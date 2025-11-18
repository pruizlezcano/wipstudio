import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { comment, trackVersion, track, project, user } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createCommentSchema } from "@/lib/validations/comment";
import { z } from "zod";
import { nanoid } from "nanoid";

// Type for comment with user and nested replies
type CommentWithUserAndReplies = {
  id: string;
  versionId: string;
  userId: string;
  content: string;
  timestamp: number | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  replies: CommentWithUserAndReplies[];
};

// GET /api/tracks/[trackId]/versions/[versionId]/comments - Get all comments for a version
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackId: string; versionId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId, versionId } = await params;

    // Verify version exists and user has access through project ownership
    const versionRecord = await db
      .select({
        version: trackVersion,
        track,
        project,
      })
      .from(trackVersion)
      .innerJoin(track, eq(trackVersion.trackId, track.id))
      .innerJoin(project, eq(track.projectId, project.id))
      .where(and(eq(trackVersion.id, versionId), eq(track.id, trackId)))
      .limit(1);

    if (versionRecord.length === 0) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (versionRecord[0].project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all comments with user info and replies
    const comments = await db
      .select({
        comment,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(comment)
      .innerJoin(user, eq(comment.userId, user.id))
      .where(eq(comment.versionId, versionId))
      .orderBy(desc(comment.createdAt));

    // Organize comments into threads
    const commentMap = new Map<string, CommentWithUserAndReplies>();
    const topLevelComments: CommentWithUserAndReplies[] = [];

    // First pass: create map of all comments
    comments.forEach((c) => {
      commentMap.set(c.comment.id, {
        ...c.comment,
        user: c.user,
        replies: [],
      });
    });

    // Second pass: organize into threads
    comments.forEach((c) => {
      const commentWithUser = commentMap.get(c.comment.id);
      if (c.comment.parentId) {
        const parent = commentMap.get(c.comment.parentId);
        if (parent) {
          parent.replies.push(commentWithUser as CommentWithUserAndReplies);
        }
      } else {
        topLevelComments.push(commentWithUser as CommentWithUserAndReplies);
      }
    });

    return NextResponse.json(topLevelComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/tracks/[trackId]/versions/[versionId]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string; versionId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trackId, versionId } = await params;

    // Verify version exists and user has access through project ownership
    const versionRecord = await db
      .select({
        version: trackVersion,
        track,
        project,
      })
      .from(trackVersion)
      .innerJoin(track, eq(trackVersion.trackId, track.id))
      .innerJoin(project, eq(track.projectId, project.id))
      .where(and(eq(trackVersion.id, versionId), eq(track.id, trackId)))
      .limit(1);

    if (versionRecord.length === 0) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (versionRecord[0].project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // If parentId is provided, verify it exists and belongs to same version
    if (validatedData.parentId) {
      const parentComment = await db
        .select()
        .from(comment)
        .where(eq(comment.id, validatedData.parentId))
        .limit(1);

      if (parentComment.length === 0) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      if (parentComment[0].versionId !== versionId) {
        return NextResponse.json(
          { error: "Parent comment belongs to different version" },
          { status: 400 }
        );
      }
    }

    const newComment = await db
      .insert(comment)
      .values({
        id: nanoid(),
        versionId,
        userId: session.user.id,
        content: validatedData.content,
        timestamp: validatedData.timestamp ?? null,
        parentId: validatedData.parentId ?? null,
      })
      .returning();

    // Fetch the comment with user info
    const commentWithUser = await db
      .select({
        comment,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(comment)
      .innerJoin(user, eq(comment.userId, user.id))
      .where(eq(comment.id, newComment[0].id))
      .limit(1);

    return NextResponse.json({
      ...commentWithUser[0].comment,
      user: commentWithUser[0].user,
      replies: [],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
