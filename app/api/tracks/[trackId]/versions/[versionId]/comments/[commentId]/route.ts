import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { comment, trackVersion, track, project } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateCommentSchema } from "@/lib/validations/comment";
import { z } from "zod";

// PATCH /api/tracks/[trackId]/versions/[versionId]/comments/[commentId] - Update a comment
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ trackId: string; versionId: string; commentId: string }>;
  }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId, versionId, commentId } = await params;

    // Verify comment exists and user owns it
    const commentRecord = await db
      .select({
        comment,
        version: trackVersion,
        track,
        project,
      })
      .from(comment)
      .innerJoin(trackVersion, eq(comment.versionId, trackVersion.id))
      .innerJoin(track, eq(trackVersion.trackId, track.id))
      .innerJoin(project, eq(track.projectId, project.id))
      .where(
        and(
          eq(comment.id, commentId),
          eq(trackVersion.id, versionId),
          eq(track.id, trackId)
        )
      )
      .limit(1);

    if (commentRecord.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify user owns the comment OR owns the project
    if (
      commentRecord[0].comment.userId !== session.user.id &&
      commentRecord[0].project.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    const updatedComment = await db
      .update(comment)
      .set({
        content: validatedData.content,
      })
      .where(eq(comment.id, commentId))
      .returning();

    return NextResponse.json(updatedComment[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE /api/tracks/[trackId]/versions/[versionId]/comments/[commentId] - Delete a comment
export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ trackId: string; versionId: string; commentId: string }>;
  }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId, versionId, commentId } = await params;

    // Verify comment exists and user owns it
    const commentRecord = await db
      .select({
        comment,
        version: trackVersion,
        track,
        project,
      })
      .from(comment)
      .innerJoin(trackVersion, eq(comment.versionId, trackVersion.id))
      .innerJoin(track, eq(trackVersion.trackId, track.id))
      .innerJoin(project, eq(track.projectId, project.id))
      .where(
        and(
          eq(comment.id, commentId),
          eq(trackVersion.id, versionId),
          eq(track.id, trackId)
        )
      )
      .limit(1);

    if (commentRecord.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify user owns the comment OR owns the project
    if (
      commentRecord[0].comment.userId !== session.user.id &&
      commentRecord[0].project.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the comment (will cascade to replies)
    await db.delete(comment).where(eq(comment.id, commentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
