import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import {
  track,
  trackVersion,
  project,
  projectMember,
  user,
} from "@/lib/db/schema";
import { eq, count, inArray } from "drizzle-orm";
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
import {
  extractWaveformCacheFromS3Object,
  parseWaveformPeaks,
  serializeWaveformPeaks,
} from "@/lib/waveform-peaks";

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

    // Check if user has access to project (owner or member)
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

    // Fetch all tracks for the project
    const tracksQuery = await db
      .select()
      .from(track)
      .where(eq(track.projectId, projectId));

    // Fetch all versions for all tracks in a single query
    const trackIds = tracksQuery.map((t) => t.id);

    let allVersions: {
      trackId: string;
      id: string;
      versionNumber: number;
      audioUrl: string;
      waveformPeaks: string | null;
      waveformDuration: number | null;
      isMaster: boolean;
      createdAt: Date;
      uploaderId: string | null;
      uploaderName: string | null;
      uploaderImage: string | null;
    }[] = [];

    if (trackIds.length > 0) {
      allVersions = await db
        .select({
          trackId: trackVersion.trackId,
          id: trackVersion.id,
          versionNumber: trackVersion.versionNumber,
          audioUrl: trackVersion.audioUrl,
          waveformPeaks: trackVersion.waveformPeaks,
          waveformDuration: trackVersion.audioDuration,
          isMaster: trackVersion.isMaster,
          createdAt: trackVersion.createdAt,
          uploaderId: user.id,
          uploaderName: user.name,
          uploaderImage: user.image,
        })
        .from(trackVersion)
        .leftJoin(user, eq(trackVersion.uploadedById, user.id))
        .where(inArray(trackVersion.trackId, trackIds));
    }

    // Group versions by track
    const versionsByTrack = new Map<
      string,
      {
        id: string;
        versionNumber: number;
        audioUrl: string;
        waveformPeaks: string | null;
        waveformDuration: number | null;
        isMaster: boolean;
        createdAt: Date;
        uploaderId: string | null;
        uploaderName: string | null;
        uploaderImage: string | null;
      }[]
    >();

    for (const version of allVersions) {
      if (!versionsByTrack.has(version.trackId)) {
        versionsByTrack.set(version.trackId, []);
      }
      versionsByTrack.get(version.trackId)!.push(version);
    }

    // Build track objects with version info
    const tracksWithVersions = tracksQuery.map((t) => {
      const versions = versionsByTrack.get(t.id) || [];

      // Calculate version count
      const versionCount = versions.length;

      // Find the latest version timestamp
      const lastVersionAt =
        versions.length > 0
          ? versions.reduce(
              (latest, v) => (v.createdAt > latest ? v.createdAt : latest),
              versions[0].createdAt
            )
          : null;

      // Pick default version (master first, or latest by version number)
      const masterVersion = versions.find((v) => v.isMaster);
      const latestVersion = [...versions].sort(
        (a, b) => b.versionNumber - a.versionNumber
      )[0];
      const defaultVersion = masterVersion || latestVersion;

      return {
        ...t,
        versionCount,
        lastVersionAt,
        defaultVersion: defaultVersion
          ? {
              id: defaultVersion.id,
              versionNumber: defaultVersion.versionNumber,
              audioUrl: defaultVersion.audioUrl,
              peaks: parseWaveformPeaks(defaultVersion.waveformPeaks),
              duration: defaultVersion.waveformDuration ?? undefined,
              isMaster: defaultVersion.isMaster,
              uploadedBy: defaultVersion.uploaderId
                ? {
                    userId: defaultVersion.uploaderId,
                    name: defaultVersion.uploaderName || "Unknown User",
                    image: defaultVersion.uploaderImage,
                  }
                : undefined,
            }
          : null,
      };
    });

    // Internal type for tracks during aggregation (uses Date objects before serialization)
    type AggregatedTrack = Omit<
      Track,
      "createdAt" | "updatedAt" | "lastVersionAt"
    > & {
      createdAt: Date;
      updatedAt: Date;
      lastVersionAt: Date | null;
    };

    const tracks: AggregatedTrack[] = tracksWithVersions;

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

    // Check if user has access to project (owner or member)
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
    let detectedAudioFormat: string | undefined;

    // SECURITY: Validate actual file content by checking magic bytes
    // This prevents malicious users from uploading non-audio files
    // with fake extensions/MIME types
    try {
      const fileHeader = await getFileHeader(validatedData.audioUrl, 50);
      const validation = validateAudioFile(fileHeader);
      detectedAudioFormat = validation.format;

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

    let waveformPeaks = validatedData.waveformPeaks;
    let audioDuration: number | undefined;
    if (!waveformPeaks?.length) {
      try {
        const waveformCache = await extractWaveformCacheFromS3Object(
          validatedData.audioUrl,
          detectedAudioFormat
        );
        waveformPeaks = waveformCache?.peaks;
        audioDuration = waveformCache?.duration;
      } catch (error) {
        console.error("Failed to extract waveform peaks for new track:", error);
      }
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
      waveformPeaks: serializeWaveformPeaks(waveformPeaks),
      audioDuration,
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

    // Get all members (except the creator) to notify
    const members = await db
      .select({ userId: projectMember.userId })
      .from(projectMember)
      .where(eq(projectMember.projectId, projectId));

    const recipientIds = members
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
