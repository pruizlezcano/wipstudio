import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { track, project } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createTrackSchema } from "@/lib/validations/track";
import { z } from "zod";
import { generatePresignedGetUrl } from "@/lib/storage/s3";

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

    // Fetch tracks for the project
    const tracks = await db
      .select()
      .from(track)
      .where(eq(track.projectId, projectId))
      .orderBy(track.createdAt);

    // Generate presigned URLs for each track
    const tracksWithPresignedUrls = await Promise.all(
      tracks.map(async (t) => ({
        ...t,
        audioUrl: await generatePresignedGetUrl(t.audioUrl, 60 * 60), // 1 hour expiry
      }))
    );

    return NextResponse.json(tracksWithPresignedUrls);
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

    const newTrack = await db
      .insert(track)
      .values({
        id: crypto.randomUUID(),
        name: validatedData.name,
        audioUrl: validatedData.audioUrl,
        projectId: validatedData.projectId,
      })
      .returning();

    return NextResponse.json(newTrack[0], { status: 201 });
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
