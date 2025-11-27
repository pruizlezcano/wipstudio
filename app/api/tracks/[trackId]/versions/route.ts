import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import {
  trackVersion,
  track,
  project,
  projectCollaborator,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createTrackVersionSchema } from "@/lib/validations/track-version";
import { z } from "zod";
import { generatePresignedGetUrl, getFileHeader, deleteS3File } from "@/lib/storage/s3";
import { nanoid } from "nanoid";
import { checkProjectAccess } from "@/lib/access-control";
import { createNotification } from "@/lib/notifications/service";
import { getAppConfig } from "@/lib/config";
import {
  validateAudioFile,
  getValidationErrorMessage,
} from "@/lib/file-validator";

// GET /api/tracks/[trackId]/versions - Get all versions for a track
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId } = await params;

    // Get track and its project
    const trackRecord = await db
      .select({
        track,
        project,
      })
      .from(track)
      .innerJoin(project, eq(track.projectId, project.id))
      .where(eq(track.id, trackId))
      .limit(1);

    if (trackRecord.length === 0) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Check if user has access to project (owner or collaborator)
    const { hasAccess } = await checkProjectAccess(
      trackRecord[0].project.id,
      session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Track not found or access denied." },
        { status: 404 }
      );
    }

    // Fetch all versions
    const versions = await db
      .select()
      .from(trackVersion)
      .where(eq(trackVersion.trackId, trackId))
      .orderBy(desc(trackVersion.versionNumber));

    // Generate presigned URLs for each version
    const versionsWithUrls = await Promise.all(
      versions.map(async (version) => {
        const audioUrl = await generatePresignedGetUrl(version.audioUrl);
        return {
          ...version,
          audioUrl,
        };
      })
    );

    return NextResponse.json(versionsWithUrls);
  } catch (error) {
    console.error("Error fetching track versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch track versions" },
      { status: 500 }
    );
  }
}

// POST /api/tracks/[trackId]/versions - Create a new version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId } = await params;

    // Get track and its project
    const trackRecord = await db
      .select({
        track,
        project,
      })
      .from(track)
      .innerJoin(project, eq(track.projectId, project.id))
      .where(eq(track.id, trackId))
      .limit(1);

    if (trackRecord.length === 0) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Check if user has access to project (owner or collaborator)
    const { hasAccess } = await checkProjectAccess(
      trackRecord[0].project.id,
      session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Track not found or access denied." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createTrackVersionSchema.parse(body);

    // SECURITY: Validate actual file content by checking magic bytes
    // This prevents malicious users from uploading non-audio files
    // with fake extensions/MIME types
    try {
      const fileHeader = await getFileHeader(validatedData.audioUrl, 50);
      const validation = validateAudioFile(fileHeader);

      if (!validation.isValid) {
        // Delete the invalid file from S3
        await deleteS3File(validatedData.audioUrl);

        return NextResponse.json(
          {
            error: validation.error || getValidationErrorMessage(fileHeader),
          },
          { status: 400 }
        );
      }

      // Log the detected format for debugging
      console.log(
        `Validated audio file: ${validatedData.audioUrl} - Format: ${validation.format}`
      );
    } catch (error) {
      console.error("Error validating file content:", error);
      // Clean up the uploaded file
      try {
        await deleteS3File(validatedData.audioUrl);
      } catch (deleteError) {
        console.error("Error deleting invalid file:", deleteError);
      }

      return NextResponse.json(
        {
          error:
            "Failed to validate uploaded file. The file may be corrupted or not a valid audio format.",
        },
        { status: 400 }
      );
    }

    // Get the latest version number
    const latestVersion = await db
      .select()
      .from(trackVersion)
      .where(eq(trackVersion.trackId, trackId))
      .orderBy(desc(trackVersion.versionNumber))
      .limit(1);

    const nextVersionNumber =
      latestVersion.length > 0 ? latestVersion[0].versionNumber + 1 : 1;

    // Unset any existing master for this track
    await db
      .update(trackVersion)
      .set({ isMaster: false })
      .where(eq(trackVersion.trackId, trackId));

    // Create new version as master
    const newVersion = await db
      .insert(trackVersion)
      .values({
        id: nanoid(),
        trackId,
        versionNumber: nextVersionNumber,
        audioUrl: validatedData.audioUrl,
        notes: validatedData.notes,
        isMaster: true,
        uploadedById: session.user.id,
      })
      .returning();

    // Get all collaborators (except the uploader) to notify
    const collaborators = await db
      .select({ userId: projectCollaborator.userId })
      .from(projectCollaborator)
      .where(eq(projectCollaborator.projectId, trackRecord[0].project.id));

    const recipientIds = collaborators
      .map((c) => c.userId)
      .filter((userId) => userId !== session.user.id);

    // Also notify the project owner if they're not the uploader
    if (trackRecord[0].project.ownerId !== session.user.id) {
      recipientIds.push(trackRecord[0].project.ownerId);
    }

    // Send notifications
    if (recipientIds.length > 0) {
      const appUrl = getAppConfig().url;
      const versionUrl = `${appUrl}/projects/${trackRecord[0].project.id}/tracks/${trackId}?v=${nextVersionNumber}`;

      await createNotification({
        type: "new_version",
        recipientUserIds: recipientIds,
        title: `New version of ${trackRecord[0].track.name}`,
        message: `${session.user.name} uploaded version ${nextVersionNumber} of "${trackRecord[0].track.name}".`,
        metadata: {
          projectId: trackRecord[0].project.id,
          projectName: trackRecord[0].project.name,
          trackId: trackId,
          trackName: trackRecord[0].track.name,
          versionId: newVersion[0].id,
          versionNumber: nextVersionNumber,
          versionNotes: validatedData.notes,
          actorId: session.user.id,
          actorName: session.user.name,
          url: versionUrl,
        },
      });
    }

    return NextResponse.json(newVersion[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating track version:", error);
    return NextResponse.json(
      { error: "Failed to create track version" },
      { status: 500 }
    );
  }
}
