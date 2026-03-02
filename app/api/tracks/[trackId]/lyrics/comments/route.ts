import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import {
  lyricsComment,
  track,
  project,
  user,
  projectCollaborator,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createLyricsCommentSchema } from "@/lib/validations/lyrics-comment";
import { z } from "zod";
import { checkProjectAccess } from "@/lib/access-control";
import { createNotification } from "@/lib/notifications/service";
import { getAppConfig } from "@/lib/config";

// Type for comment with user and nested replies
type LyricsCommentWithUserAndReplies = {
  id: string;
  trackId: string;
  userId: string | null;
  content: string;
  parentId: string | null;
  rangeFrom: number | null;
  rangeTo: number | null;
  rangeText: string | null;
  resolvedAt: Date | null;
  resolvedById: string | null;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  replies: LyricsCommentWithUserAndReplies[];
};

// GET /api/tracks/[trackId]/lyrics/comments - Get all comments for lyrics
export async function GET(
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

    // Get query parameter to optionally include resolved comments
    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get("includeResolved") === "true";

    // Verify track exists and user has access through project ownership
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

    // Check if user has access to the project (owner or collaborator)
    const { hasAccess } = await checkProjectAccess(
      trackRecord[0].project.id,
      session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Track not found or access denied." },
        { status: 404 }
      );
    }

    // Fetch all comments with user info
    const comments = await db
      .select({
        comment: lyricsComment,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(lyricsComment)
      .leftJoin(user, eq(lyricsComment.userId, user.id))
      .where(eq(lyricsComment.trackId, trackId))
      .orderBy(desc(lyricsComment.createdAt));

    // Organize comments into threads and filter resolved ones
    const commentMap = new Map<string, LyricsCommentWithUserAndReplies>();
    const resolvedParentIds = new Set<string>();
    const topLevelComments: LyricsCommentWithUserAndReplies[] = [];

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
    console.error("Error fetching lyrics comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch lyrics comments" },
      { status: 500 }
    );
  }
}

// POST /api/tracks/[trackId]/lyrics/comments - Create a new lyrics comment
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

    // Verify track exists and user has access through project ownership
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

    // Check if user has access to the project (owner or collaborator)
    const { hasAccess } = await checkProjectAccess(
      trackRecord[0].project.id,
      session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Track not found or access denied." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createLyricsCommentSchema.parse(body);

    // If parentId is provided, verify it exists and belongs to same track
    if (validatedData.parentId) {
      const parentComment = await db
        .select()
        .from(lyricsComment)
        .where(eq(lyricsComment.id, validatedData.parentId))
        .limit(1);

      if (parentComment.length === 0) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      if (parentComment[0].trackId !== trackId) {
        return NextResponse.json(
          { error: "Parent comment belongs to different track" },
          { status: 400 }
        );
      }
    }

    const newComment = await db
      .insert(lyricsComment)
      .values({
        id: validatedData.id, // Use client-generated ID
        trackId,
        userId: session.user.id,
        content: validatedData.content,
        parentId: validatedData.parentId ?? null,
        rangeFrom: validatedData.rangeFrom ?? null,
        rangeTo: validatedData.rangeTo ?? null,
        rangeText: validatedData.rangeText ?? null,
      })
      .returning();

    // Fetch the comment with user info
    const commentWithUser = await db
      .select({
        comment: lyricsComment,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(lyricsComment)
      .leftJoin(user, eq(lyricsComment.userId, user.id))
      .where(eq(lyricsComment.id, newComment[0].id))
      .limit(1);

    // Send notifications
    const appUrl = getAppConfig().url;
    const commentUrl = `${appUrl}/projects/${trackRecord[0].project.id}/tracks/${trackId}/lyrics?c=${newComment[0].id}`;

    if (validatedData.parentId) {
      // This is a reply - notify the parent comment author
      const parentComment = await db
        .select()
        .from(lyricsComment)
        .where(eq(lyricsComment.id, validatedData.parentId))
        .limit(1);

      if (
        parentComment.length > 0 &&
        parentComment[0].userId &&
        parentComment[0].userId !== session.user.id
      ) {
        await createNotification({
          type: "lyrics_comment_reply",
          recipientUserIds: [parentComment[0].userId],
          title: `${session.user.name} replied to your lyric comment`,
          message: `${session.user.name} replied to your lyric comment on "${trackRecord[0].track.name}".`,
          metadata: {
            projectId: trackRecord[0].project.id,
            projectName: trackRecord[0].project.name,
            trackId: trackId,
            trackName: trackRecord[0].track.name,
            commentId: newComment[0].id,
            parentCommentContent: parentComment[0].content,
            replyContent: validatedData.content,
            lyricContext: parentComment[0].rangeText,
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
        .where(eq(projectCollaborator.projectId, trackRecord[0].project.id));

      const recipientIds = collaborators
        .map((c) => c.userId)
        .filter((userId) => userId !== session.user.id);

      // Also notify the project owner if they're not the commenter
      if (trackRecord[0].project.ownerId !== session.user.id) {
        recipientIds.push(trackRecord[0].project.ownerId);
      }

      if (recipientIds.length > 0) {
        await createNotification({
          type: "new_lyrics_comment",
          recipientUserIds: recipientIds,
          title: `New lyric comment on ${trackRecord[0].track.name}`,
          message: `${session.user.name} commented on lyrics for "${trackRecord[0].track.name}".`,
          metadata: {
            projectId: trackRecord[0].project.id,
            projectName: trackRecord[0].project.name,
            trackId: trackId,
            trackName: trackRecord[0].track.name,
            commentId: newComment[0].id,
            commentContent: validatedData.content,
            lyricContext: validatedData.rangeText ?? null,
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

    console.error("Error creating lyrics comment:", error);
    return NextResponse.json(
      { error: "Failed to create lyrics comment" },
      { status: 500 }
    );
  }
}
