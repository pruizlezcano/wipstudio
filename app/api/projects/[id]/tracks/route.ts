import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import {
  track,
  trackVersion,
  project,
  projectCollaborator,
} from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { createTrackSchema } from "@/lib/validations/track";
import { z } from "zod";
import { nanoid } from "nanoid";
import { checkProjectAccess } from "@/lib/access-control";
import { createNotification } from "@/lib/notifications/service";
import { getAppConfig } from "@/lib/config";
import { getFileHeader, deleteS3File } from "@/lib/storage/s3";
import {
  validateAudioFile,
  getValidationErrorMessage,
} from "@/lib/file-validator";

// GET /api/projects/[id]/tracks - List all tracks for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check if user has access to project (owner or collaborator)
    const { hasAccess } = await checkProjectAccess(projectId, session.user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Project not found or access denied." },
        { status: 404 }
      );
    }

    // Fetch tracks for the project with their latest version
    const tracks = await db
      .select()
      .from(track)
      .where(eq(track.projectId, projectId))
      .orderBy(track.createdAt);

    // For each track, fetch the master version (or latest) and version count
    const tracksWithVersions = await Promise.all(
      tracks.map(async (t) => {
        // Get version count
        const versionCountResult = await db
          .select({ count: count() })
          .from(trackVersion)
          .where(eq(trackVersion.trackId, t.id));

        const versionCount = versionCountResult[0]?.count || 0;

        return {
          ...t,
          versionCount,
        };
      })
    );

    return NextResponse.json(tracksWithVersions);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/tracks - Create new track
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check if user has access to project (owner or collaborator)
    const { hasAccess } = await checkProjectAccess(projectId, session.user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Project not found or access denied." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createTrackSchema.parse({
      ...body,
      projectId,
    });

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

    // Create track (metadata only)
    const newTrack = await db
      .insert(track)
      .values({
        id: crypto.randomUUID(),
        name: validatedData.name,
        projectId: validatedData.projectId,
        createdById: session.user.id,
      })
      .returning();

    // Create initial version (version 1) with the audio file
    await db.insert(trackVersion).values({
      id: nanoid(),
      trackId: newTrack[0].id,
      versionNumber: 1,
      audioUrl: validatedData.audioUrl,
      notes: validatedData.notes,
      isMaster: true,
      uploadedById: session.user.id,
    });

    // Get project details for notification
    const projectRecord = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId))
      .limit(1);

    // Get all collaborators (except the creator) to notify
    const collaborators = await db
      .select({ userId: projectCollaborator.userId })
      .from(projectCollaborator)
      .where(eq(projectCollaborator.projectId, projectId));

    const recipientIds = collaborators
      .map((c) => c.userId)
      .filter((userId) => userId !== session.user.id);

    // Also notify the project owner if they're not the creator
    if (projectRecord[0].ownerId !== session.user.id) {
      recipientIds.push(projectRecord[0].ownerId);
    }

    // Send notifications
    if (recipientIds.length > 0) {
      const appUrl = getAppConfig().url;
      const trackUrl = `${appUrl}/projects/${projectId}/tracks/${newTrack[0].id}`;

      await createNotification({
        type: "new_track",
        recipientUserIds: recipientIds,
        title: `New track: ${validatedData.name}`,
        message: `${session.user.name} added a new track "${validatedData.name}" to ${projectRecord[0].name}.`,
        metadata: {
          projectId: projectId,
          projectName: projectRecord[0].name,
          trackId: newTrack[0].id,
          trackName: validatedData.name,
          actorId: session.user.id,
          actorName: session.user.name,
          url: trackUrl,
        },
      });
    }

    return NextResponse.json(
      {
        ...newTrack[0],
        versionCount: 1,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating track:", error);
    return NextResponse.json(
      { error: "Failed to create track" },
      { status: 500 }
    );
  }
}
