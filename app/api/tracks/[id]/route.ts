import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { track, project } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateTrackSchema } from "@/lib/validations/track";
import { z } from "zod";
import { deleteS3File } from "@/lib/storage/s3";

// PATCH /api/tracks/[id] - Update track
export async function PATCH(
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

    const { id: trackId } = await params;

    // Fetch the track and verify ownership through project
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
    const validatedData = updateTrackSchema.parse(body);

    const updatedTrack = await db
      .update(track)
      .set({
        name: validatedData.name,
      })
      .where(eq(track.id, trackId))
      .returning();

    return NextResponse.json(updatedTrack[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating track:", error);
    return NextResponse.json(
      { error: "Failed to update track" },
      { status: 500 }
    );
  }
}

// DELETE /api/tracks/[id] - Delete track and associated file
export async function DELETE(
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

    const { id: trackId } = await params;

    // Fetch the track and verify ownership through project
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

    // Extract the object key from the audioUrl
    const objectKey = trackRecord[0].track.audioUrl;
    try {
      // Delete the file from S3
      await deleteS3File(objectKey);
    } catch (error) {
      console.error("Error deleting file from S3:", error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete the track from database
    await db.delete(track).where(eq(track.id, trackId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting track:", error);
    return NextResponse.json(
      { error: "Failed to delete track" },
      { status: 500 }
    );
  }
}
