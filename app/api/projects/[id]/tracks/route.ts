import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import {
  track,
  trackVersion,
  project,
  projectCollaborator,
  user,
} from "@/lib/db/schema";
import { eq, count, max } from "drizzle-orm";
import { createTrackSchema } from "@/lib/validations/track";
import { z } from "zod";
import { nanoid } from "nanoid";
import { checkProjectAccess } from "@/lib/access-control";
import { createNotification } from "@/lib/notifications/service";
import { getAppConfig } from "@/lib/config";
import {
  getFileHeader,
  deleteS3File,
  generatePresignedGetUrl,
} from "@/lib/storage/s3";
import {
  validateAudioFile,
  getValidationErrorMessage,
} from "@/lib/file-validator";
import type { Track } from "@/types/track";

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

    // Parse sort parameters from query string
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );
    const offset = (page - 1) * limit;

    // Check if user has access to project (owner or collaborator)
    const { hasAccess } = await checkProjectAccess(projectId, session.user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Project not found or access denied." },
        { status: 404 }
      );
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(track)
      .where(eq(track.projectId, projectId));
    const total = totalCountResult[0]?.count || 0;

    // Fetch tracks with aggregated version stats in a single efficient query
    // This uses a subquery to get the master/latest version and its uploader info
    const tracksQuery = db
      .select({
        track: track,
        versionCount: count(trackVersion.id),
        lastVersionAt: max(trackVersion.createdAt),
        // Get master version info (or latest if no master)
        defaultVersionId: trackVersion.id,
        defaultVersionNumber: trackVersion.versionNumber,
        defaultVersionAudioUrl: trackVersion.audioUrl,
        defaultVersionIsMaster: trackVersion.isMaster,
        defaultVersionUploaderId: user.id,
        defaultVersionUploaderName: user.name,
        defaultVersionUploaderImage: user.image,
      })
      .from(track)
      .leftJoin(trackVersion, eq(trackVersion.trackId, track.id))
      .leftJoin(user, eq(trackVersion.uploadedById, user.id))
      .where(eq(track.projectId, projectId))
      .groupBy(
        track.id,
        track.name,
        track.projectId,
        track.createdById,
        track.createdAt,
        track.updatedAt,
        trackVersion.id,
        trackVersion.versionNumber,
        trackVersion.audioUrl,
        trackVersion.isMaster,
        user.id,
        user.name,
        user.image
      );

    // Execute query and get all results
    const allTracksData = await tracksQuery;

    // Internal type for tracks during aggregation (uses Date objects before serialization)
    type AggregatedTrack = Omit<
      Track,
      "createdAt" | "updatedAt" | "lastVersionAt"
    > & {
      createdAt: Date;
      updatedAt: Date;
      lastVersionAt: Date | null;
    };

    // Group results by track and pick the default version (master or latest)
    const tracksMap = new Map<string, AggregatedTrack>();

    for (const row of allTracksData) {
      const trackId = row.track.id;

      if (!tracksMap.has(trackId)) {
        tracksMap.set(trackId, {
          ...row.track,
          versionCount: 0,
          lastVersionAt: null,
          defaultVersion: null,
        });
      }

      const trackData = tracksMap.get(trackId)!;

      // Update version count and lastVersionAt
      if (row.versionCount > 0) {
        trackData.versionCount = row.versionCount;
        trackData.lastVersionAt = row.lastVersionAt;
      }

      // Set default version (prefer master, otherwise use latest by version number)
      if (
        row.defaultVersionId &&
        row.defaultVersionNumber !== null &&
        row.defaultVersionAudioUrl &&
        row.defaultVersionIsMaster !== null
      ) {
        const currentDefault = trackData.defaultVersion;
        const shouldUpdateDefault =
          !currentDefault ||
          row.defaultVersionIsMaster ||
          (!currentDefault.isMaster &&
            row.defaultVersionNumber > currentDefault.versionNumber);

        if (shouldUpdateDefault) {
          trackData.defaultVersion = {
            id: row.defaultVersionId,
            versionNumber: row.defaultVersionNumber,
            audioUrl: row.defaultVersionAudioUrl,
            isMaster: row.defaultVersionIsMaster,
            uploadedBy: row.defaultVersionUploaderId
              ? {
                  userId: row.defaultVersionUploaderId,
                  name: row.defaultVersionUploaderName || "Unknown User",
                  image: row.defaultVersionUploaderImage,
                }
              : undefined,
          };
        }
      }
    }

    // Convert map to array
    const tracks = Array.from(tracksMap.values());

    // Sort the results
    tracks.sort((a, b) => {
      let aVal: string | Date, bVal: string | Date;

      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "lastVersionAt":
          aVal = a.lastVersionAt
            ? new Date(a.lastVersionAt)
            : new Date(a.createdAt);
          bVal = b.lastVersionAt
            ? new Date(b.lastVersionAt)
            : new Date(b.createdAt);
          break;
        case "createdAt":
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const paginatedTracks = tracks.slice(offset, offset + limit);

    // Generate presigned URLs only for the paginated tracks that will be returned
    const tracksWithUrls = await Promise.all(
      paginatedTracks.map(async (t) => {
        if (t.defaultVersion?.audioUrl) {
          const presignedUrl = await generatePresignedGetUrl(
            t.defaultVersion.audioUrl,
            3600
          );
          return {
            ...t,
            defaultVersion: {
              ...t.defaultVersion,
              audioUrl: presignedUrl,
            },
          };
        }
        return t;
      })
    );

    return NextResponse.json({
      data: tracksWithUrls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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
        lastVersionAt: new Date().toISOString(),
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
