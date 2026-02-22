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
import { eq, count, asc, desc, max, and } from "drizzle-orm";
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

// Helper function to get default version (master or latest) for a track
async function getDefaultVersion(trackId: string, versionCount: number) {
  if (versionCount === 0) return null;

  // First try to get master version
  const masterVersion = await db
    .select({
      id: trackVersion.id,
      versionNumber: trackVersion.versionNumber,
      audioUrl: trackVersion.audioUrl,
      isMaster: trackVersion.isMaster,
    })
    .from(trackVersion)
    .where(
      and(eq(trackVersion.trackId, trackId), eq(trackVersion.isMaster, true))
    )
    .limit(1);

  if (masterVersion.length > 0) {
    const version = masterVersion[0];
    const presignedUrl = await generatePresignedGetUrl(version.audioUrl, 3600);
    return {
      ...version,
      audioUrl: presignedUrl,
    };
  }

  // Fall back to latest version (highest version number)
  const latestVersion = await db
    .select({
      id: trackVersion.id,
      versionNumber: trackVersion.versionNumber,
      audioUrl: trackVersion.audioUrl,
      isMaster: trackVersion.isMaster,
    })
    .from(trackVersion)
    .where(eq(trackVersion.trackId, trackId))
    .orderBy(desc(trackVersion.versionNumber))
    .limit(1);

  if (latestVersion.length > 0) {
    const version = latestVersion[0];
    const presignedUrl = await generatePresignedGetUrl(version.audioUrl, 3600);
    return {
      ...version,
      audioUrl: presignedUrl,
    };
  }

  return null;
}

// Helper function to enrich a track with version stats and default version
async function enrichTrackWithVersions(t: typeof track.$inferSelect) {
  const versionStats = await db
    .select({
      count: count(),
      lastVersionAt: max(trackVersion.createdAt),
    })
    .from(trackVersion)
    .where(eq(trackVersion.trackId, t.id));

  const versionCount = versionStats[0]?.count || 0;
  const lastVersionAt = versionStats[0]?.lastVersionAt || null;
  const defaultVersion = await getDefaultVersion(t.id, versionCount);

  return {
    ...t,
    versionCount,
    lastVersionAt,
    defaultVersion,
  };
}

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

    // Build order by clause based on sort parameters (for non-lastVersionAt sorts)
    const orderByClause = (() => {
      const direction = sortOrder === "asc" ? asc : desc;
      switch (sortBy) {
        case "name":
          return direction(track.name);
        case "createdAt":
        default:
          return direction(track.createdAt);
      }
    })();

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(track)
      .where(eq(track.projectId, projectId));
    const total = totalCountResult[0]?.count || 0;

    // For lastVersionAt sorting, we need to fetch all tracks and sort in memory
    if (sortBy === "lastVersionAt") {
      // Fetch all tracks for the project
      const allTracks = await db
        .select()
        .from(track)
        .where(eq(track.projectId, projectId));

      // Fetch version stats for all tracks
      const tracksWithVersions = await Promise.all(
        allTracks.map((t) => enrichTrackWithVersions(t))
      );

      // Sort by lastVersionAt (fall back to createdAt if null)
      tracksWithVersions.sort((a, b) => {
        const aVal = a.lastVersionAt
          ? new Date(a.lastVersionAt)
          : new Date(a.createdAt);
        const bVal = b.lastVersionAt
          ? new Date(b.lastVersionAt)
          : new Date(b.createdAt);

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // Apply pagination
      const paginatedTracks = tracksWithVersions.slice(offset, offset + limit);

      return NextResponse.json({
        data: paginatedTracks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Fetch tracks for the project with pagination (for other sort options)
    const tracks = await db
      .select()
      .from(track)
      .where(eq(track.projectId, projectId))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // For each track, fetch the master version (or latest) and version count
    const tracksWithVersions = await Promise.all(
      tracks.map((t) => enrichTrackWithVersions(t))
    );

    return NextResponse.json({
      data: tracksWithVersions,
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
