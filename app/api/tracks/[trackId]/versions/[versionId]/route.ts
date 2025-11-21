import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { trackVersion, track, project } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { updateTrackVersionSchema, setMasterVersionSchema } from "@/lib/validations/track-version";
import { z } from "zod";
import { deleteS3File } from "@/lib/storage/s3";
import { checkProjectAccess } from "@/lib/access-control";

// PATCH /api/tracks/[trackId]/versions/[versionId] - Update version notes or set as master
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

    // Get track and its project
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

    // Check if user has access to project (owner or collaborator)
    const { hasAccess } = await checkProjectAccess(
      trackRecord[0].project.id,
      session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Track not found or access denied." }, { status: 404 });
    }

    const body = await request.json();

    // Check if this is a setMaster request
    if ('isMaster' in body) {
      const validatedData = setMasterVersionSchema.parse(body);

      if (validatedData.isMaster) {
        // First, unset any existing master for this track
        await db
          .update(trackVersion)
          .set({ isMaster: false })
          .where(eq(trackVersion.trackId, trackId));

        // Then set this version as master
        const updatedVersion = await db
          .update(trackVersion)
          .set({ isMaster: true })
          .where(eq(trackVersion.id, versionId))
          .returning();

        if (updatedVersion.length === 0) {
          return NextResponse.json(
            { error: "Version not found" },
            { status: 404 }
          );
        }

        return NextResponse.json(updatedVersion[0]);
      }
    }

    // Otherwise, update notes
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

    // Get track and its project
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

    // Check if user is owner of the project
    const { isOwner } = await checkProjectAccess(
      trackRecord[0].project.id,
      session.user.id
    );

    if (!isOwner) {
      return NextResponse.json({ error: "Track not found or access denied." }, { status: 404 });
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

    // Check if this is the only version for the track
    const versionCount = await db
      .select()
      .from(trackVersion)
      .where(eq(trackVersion.trackId, trackId));

    if (versionCount.length === 1) {
      return NextResponse.json(
        { error: "Cannot delete the only version of a track" },
        { status: 400 }
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

    // Set latest version as master if the deleted one was master
    if (versionRecord[0].isMaster) {
      const latestVersion = await db
        .select()
        .from(trackVersion)
        .where(eq(trackVersion.trackId, trackId))
        .orderBy(desc(trackVersion.createdAt))
        .limit(1);

      if (latestVersion.length > 0) {
        await db
          .update(trackVersion)
          .set({ isMaster: true })
          .where(eq(trackVersion.id, latestVersion[0].id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting track version:", error);
    return NextResponse.json(
      { error: "Failed to delete track version" },
      { status: 500 }
    );
  }
}
