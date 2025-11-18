import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { track, project, trackVersion } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createTrackSchema } from "@/lib/validations/track";
import { z } from "zod";
import { generatePresignedGetUrl } from "@/lib/storage/s3";
import { nanoid } from "nanoid";

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

    // Verify project ownership
    const projectRecord = await db
      .select()
      .from(project)
      .where(
        and(eq(project.id, projectId), eq(project.ownerId, session.user.id))
      )
      .limit(1);

    if (projectRecord.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Fetch tracks for the project with their latest version
    const tracks = await db
      .select()
      .from(track)
      .where(eq(track.projectId, projectId))
      .orderBy(track.createdAt);

    // For each track, fetch the latest version
    const tracksWithVersions = await Promise.all(
      tracks.map(async (t) => {
        const versions = await db
          .select()
          .from(trackVersion)
          .where(eq(trackVersion.trackId, t.id))
          .orderBy(desc(trackVersion.versionNumber))
          .limit(1);

        const latestVersion = versions[0];

        return {
          ...t,
          latestVersion: latestVersion
            ? {
                ...latestVersion,
                audioUrl: await generatePresignedGetUrl(
                  latestVersion.audioUrl,
                  60 * 60
                ), // 1 hour expiry
              }
            : null,
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

    // Verify project ownership
    const projectRecord = await db
      .select()
      .from(project)
      .where(
        and(eq(project.id, projectId), eq(project.ownerId, session.user.id))
      )
      .limit(1);

    if (projectRecord.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createTrackSchema.parse({
      ...body,
      projectId,
    });

    // Create track (metadata only)
    const newTrack = await db
      .insert(track)
      .values({
        id: crypto.randomUUID(),
        name: validatedData.name,
        projectId: validatedData.projectId,
      })
      .returning();

    // Create initial version (version 1) with the audio file
    const initialVersion = await db
      .insert(trackVersion)
      .values({
        id: nanoid(),
        trackId: newTrack[0].id,
        versionNumber: 1,
        audioUrl: validatedData.audioUrl,
        notes: validatedData.notes,
      })
      .returning();

    return NextResponse.json(
      {
        ...newTrack[0],
        latestVersion: initialVersion[0],
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
