import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { trackVersion, track, project } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateTrackVersionSchema } from "@/lib/validations/track-version";
import { z } from "zod";
import { deleteS3File } from "@/lib/storage/s3";

// PATCH /api/tracks/[trackId]/versions/[versionId] - Update version notes
export async function PATCH(
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
    const validatedData = updateTrackVersionSchema.parse(body);

    const updatedVersion = await db
      .update(trackVersion)
      .set({
        notes: validatedData.notes,
      })
      .where(eq(trackVersion.id, versionId))
      .returning();

    if (updatedVersion.length === 0) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedVersion[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating track version:", error);
    return NextResponse.json(
      { error: "Failed to update track version" },
      { status: 500 }
    );
  }
}

// DELETE /api/tracks/[trackId]/versions/[versionId] - Delete a version
export async function DELETE(
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

    // Get the version to delete
    const versionRecord = await db
      .select()
      .from(trackVersion)
      .where(eq(trackVersion.id, versionId))
      .limit(1);

    if (versionRecord.length === 0) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // Delete the file from S3
    try {
      await deleteS3File(versionRecord[0].audioUrl);
    } catch (error) {
      console.error("Error deleting file from S3:", error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete the version from database
    await db.delete(trackVersion).where(eq(trackVersion.id, versionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting track version:", error);
    return NextResponse.json(
      { error: "Failed to delete track version" },
      { status: 500 }
    );
  }
}
