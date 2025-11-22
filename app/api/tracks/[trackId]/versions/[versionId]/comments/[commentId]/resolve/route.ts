import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { comment, trackVersion, track, project } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { checkProjectAccess } from "@/lib/access-control";

// POST /api/tracks/[trackId]/versions/[versionId]/comments/[commentId]/resolve - Resolve a comment
export async function POST(
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

    // Verify comment exists and belongs to this version
    const commentRecord = await db
      .select()
      .from(comment)
      .innerJoin(trackVersion, eq(comment.versionId, trackVersion.id))
      .where(
        and(
          eq(comment.id, commentId),
          eq(trackVersion.id, versionId),
          eq(trackVersion.trackId, trackId)
        )
      )
      .limit(1);

    if (commentRecord.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only allow resolving top-level comments (with timestamp, not replies)
    if (commentRecord[0].comment.parentId !== null) {
      return NextResponse.json(
        { error: "Only top-level comments can be resolved" },
        { status: 400 }
      );
    }

    // Check if comment is already resolved
    if (commentRecord[0].comment.resolvedAt !== null) {
      return NextResponse.json(
        { error: "Comment is already resolved" },
        { status: 400 }
      );
    }

    // Resolve the comment
    const updatedComment = await db
      .update(comment)
      .set({
        resolvedAt: new Date(),
        resolvedById: session.user.id,
      })
      .where(eq(comment.id, commentId))
      .returning();

    return NextResponse.json(updatedComment[0]);
  } catch (error) {
    console.error("Error resolving comment:", error);
    return NextResponse.json(
      { error: "Failed to resolve comment" },
      { status: 500 }
    );
  }
}

// DELETE /api/tracks/[trackId]/versions/[versionId]/comments/[commentId]/resolve - Unresolve a comment
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

    // Verify comment exists and belongs to this version
    const commentRecord = await db
      .select()
      .from(comment)
      .innerJoin(trackVersion, eq(comment.versionId, trackVersion.id))
      .where(
        and(
          eq(comment.id, commentId),
          eq(trackVersion.id, versionId),
          eq(trackVersion.trackId, trackId)
        )
      )
      .limit(1);

    if (commentRecord.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if comment is not resolved
    if (commentRecord[0].comment.resolvedAt === null) {
      return NextResponse.json(
        { error: "Comment is not resolved" },
        { status: 400 }
      );
    }

    // Unresolve the comment
    const updatedComment = await db
      .update(comment)
      .set({
        resolvedAt: null,
        resolvedById: null,
      })
      .where(eq(comment.id, commentId))
      .returning();

    return NextResponse.json(updatedComment[0]);
  } catch (error) {
    console.error("Error unresolving comment:", error);
    return NextResponse.json(
      { error: "Failed to unresolve comment" },
      { status: 500 }
    );
  }
}
