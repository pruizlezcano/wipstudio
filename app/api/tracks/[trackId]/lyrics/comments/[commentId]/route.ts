import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { lyricsComment, track, project } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateLyricsCommentSchema } from "@/lib/validations/lyrics-comment";
import { z } from "zod";
import { checkProjectAccess } from "@/lib/access-control";

// PATCH /api/tracks/[trackId]/lyrics/comments/[commentId] - Update a lyrics comment
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ trackId: string; commentId: string }>;
  }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId, commentId } = await params;

    // Verify track exists and get its project
    const trackRecord = await db
      .select({ track, project })
      .from(track)
      .innerJoin(project, eq(track.projectId, project.id))
      .where(eq(track.id, trackId))
      .limit(1);

    if (trackRecord.length === 0) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Verify comment exists
    const commentRecord = await db
      .select()
      .from(lyricsComment)
      .where(
        and(eq(lyricsComment.id, commentId), eq(lyricsComment.trackId, trackId))
      )
      .limit(1);

    if (commentRecord.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify user owns the comment
    if (session.user.id !== commentRecord[0].userId) {
      return NextResponse.json(
        {
          error: "Only the comment owner can update the comment.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateLyricsCommentSchema.parse(body);

    const updatedComment = await db
      .update(lyricsComment)
      .set({
        content: validatedData.content,
        editedAt: new Date(),
      })
      .where(eq(lyricsComment.id, commentId))
      .returning();

    return NextResponse.json(updatedComment[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating lyrics comment:", error);
    return NextResponse.json(
      { error: "Failed to update lyrics comment" },
      { status: 500 }
    );
  }
}

// DELETE /api/tracks/[trackId]/lyrics/comments/[commentId] - Delete a lyrics comment
export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ trackId: string; commentId: string }>;
  }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId, commentId } = await params;

    // Verify track exists and get its project
    const trackRecord = await db
      .select({ track, project })
      .from(track)
      .innerJoin(project, eq(track.projectId, project.id))
      .where(eq(track.id, trackId))
      .limit(1);

    if (trackRecord.length === 0) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Check if user has access to the project (owner or member)
    const { isOwner } = await checkProjectAccess(
      trackRecord[0].project.id,
      session.user.id
    );

    // Verify comment exists
    const commentRecord = await db
      .select()
      .from(lyricsComment)
      .where(
        and(eq(lyricsComment.id, commentId), eq(lyricsComment.trackId, trackId))
      )
      .limit(1);

    if (commentRecord.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (!isOwner && session.user.id !== commentRecord[0].userId) {
      return NextResponse.json(
        { error: "Track not found or access denied. Only owners can delete." },
        { status: 404 }
      );
    }

    // Delete the comment (will cascade to replies)
    await db.delete(lyricsComment).where(eq(lyricsComment.id, commentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lyrics comment:", error);
    return NextResponse.json(
      { error: "Failed to delete lyrics comment" },
      { status: 500 }
    );
  }
}
