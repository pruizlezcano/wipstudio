import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import {
  comment,
  trackVersion,
  track,
  project,
  user,
  projectCollaborator,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createCommentSchema } from "@/lib/validations/comment";
import { z } from "zod";
import { nanoid } from "nanoid";
import { checkProjectAccess } from "@/lib/access-control";
import { createNotification } from "@/lib/notifications/service";

// Type for comment with user and nested replies
type CommentWithUserAndReplies = {
  id: string;
  versionId: string;
  userId: string;
  content: string;
  timestamp: number | null;
  parentId: string | null;
  resolvedAt: Date | null;
  resolvedById: string | null;
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

    // Get query parameter to optionally include resolved comments
    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get("includeResolved") === "true";

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

    // Check if user has access to the project (owner or collaborator)
    const { hasAccess } = await checkProjectAccess(
      versionRecord[0].project.id,
      session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Track not found or access denied." },
        { status: 404 }
      );
    }

    // Fetch all comments with user info
    // By default, exclude resolved top-level comments and their replies
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

    // Organize comments into threads and filter resolved ones
    const commentMap = new Map<string, CommentWithUserAndReplies>();
    const resolvedParentIds = new Set<string>();
    const topLevelComments: CommentWithUserAndReplies[] = [];

    // First pass: create map of all comments and identify resolved parents
    comments.forEach((c) => {
      commentMap.set(c.comment.id, {
        ...c.comment,
        user: c.user,
        replies: [],
      });

      // Track top-level resolved comments
      if (c.comment.resolvedAt !== null && c.comment.parentId === null) {
        resolvedParentIds.add(c.comment.id);
      }
    });

    // Second pass: organize into threads and filter based on resolved status
    comments.forEach((c) => {
      const commentWithUser = commentMap.get(c.comment.id);

      if (!commentWithUser) return;

      // Skip if this is a resolved top-level comment and we're not including resolved
      if (
        !includeResolved &&
        c.comment.resolvedAt !== null &&
        c.comment.parentId === null
      ) {
        return;
      }

      if (c.comment.parentId) {
        // Skip if parent is resolved and we're not including resolved
        if (!includeResolved && resolvedParentIds.has(c.comment.parentId)) {
          return;
        }

        const parent = commentMap.get(c.comment.parentId);
        if (parent) {
          parent.replies.push(commentWithUser);
        }
      } else {
        topLevelComments.push(commentWithUser);
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

    // Check if user has access to the project (owner or collaborator)
    const { hasAccess } = await checkProjectAccess(
      versionRecord[0].project.id,
      session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Track not found or access denied." },
        { status: 404 }
      );
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

    // Send notifications
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const commentUrl = `${appUrl}/projects/${versionRecord[0].project.id}/tracks/${trackId}?v=${versionRecord[0].version.versionNumber}&c=${newComment[0].id}`;

    if (validatedData.parentId) {
      // This is a reply - notify the parent comment author
      const parentComment = await db
        .select()
        .from(comment)
        .where(eq(comment.id, validatedData.parentId))
        .limit(1);

      if (
        parentComment.length > 0 &&
        parentComment[0].userId !== session.user.id
      ) {
        await createNotification({
          type: "comment_reply",
          recipientUserIds: [parentComment[0].userId],
          title: `${session.user.name} replied to your comment`,
          message: `${session.user.name} replied to your comment on "${versionRecord[0].track.name}".`,
          metadata: {
            projectId: versionRecord[0].project.id,
            projectName: versionRecord[0].project.name,
            trackId: trackId,
            trackName: versionRecord[0].track.name,
            versionId: versionId,
            commentId: newComment[0].id,
            parentCommentContent: parentComment[0].content,
            replyContent: validatedData.content,
            commentTimestamp: validatedData.timestamp ?? null,
            actorId: session.user.id,
            actorName: session.user.name,
            url: commentUrl,
          },
        });
      }
    } else {
      // This is a new comment - notify all collaborators
      const collaborators = await db
        .select({ userId: projectCollaborator.userId })
        .from(projectCollaborator)
        .where(eq(projectCollaborator.projectId, versionRecord[0].project.id));

      const recipientIds = collaborators
        .map((c) => c.userId)
        .filter((userId) => userId !== session.user.id);

      // Also notify the project owner if they're not the commenter
      if (versionRecord[0].project.ownerId !== session.user.id) {
        recipientIds.push(versionRecord[0].project.ownerId);
      }

      if (recipientIds.length > 0) {
        await createNotification({
          type: "new_comment",
          recipientUserIds: recipientIds,
          title: `New comment on ${versionRecord[0].track.name}`,
          message: `${session.user.name} commented on "${versionRecord[0].track.name}".`,
          metadata: {
            projectId: versionRecord[0].project.id,
            projectName: versionRecord[0].project.name,
            trackId: trackId,
            trackName: versionRecord[0].track.name,
            versionId: versionId,
            commentId: newComment[0].id,
            commentContent: validatedData.content,
            commentTimestamp: validatedData.timestamp ?? null,
            actorId: session.user.id,
            actorName: session.user.name,
            url: commentUrl,
          },
        });
      }
    }

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
