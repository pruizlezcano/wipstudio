import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { trackVersion, track, project } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createTrackVersionSchema } from "@/lib/validations/track-version";
import { z } from "zod";
import { generatePresignedGetUrl } from "@/lib/storage/s3";
import { nanoid } from "nanoid";

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

    // Verify track exists and user owns the project
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

    if (trackRecord[0].project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // Verify track exists and user owns the project
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

    if (trackRecord[0].project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTrackVersionSchema.parse(body);

    // Get the latest version number
    const latestVersion = await db
      .select()
      .from(trackVersion)
      .where(eq(trackVersion.trackId, trackId))
      .orderBy(desc(trackVersion.versionNumber))
      .limit(1);

    const nextVersionNumber =
      latestVersion.length > 0 ? latestVersion[0].versionNumber + 1 : 1;

    // Create new version
    const newVersion = await db
      .insert(trackVersion)
      .values({
        id: nanoid(),
        trackId,
        versionNumber: nextVersionNumber,
        audioUrl: validatedData.audioUrl,
        notes: validatedData.notes,
      })
      .returning();

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
