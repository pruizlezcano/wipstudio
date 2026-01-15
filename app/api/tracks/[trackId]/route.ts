import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { track, project, trackVersion } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { updateTrackSchema } from "@/lib/validations/track";
import { z } from "zod";
import { deleteS3File } from "@/lib/storage/s3";
import { checkProjectAccess } from "@/lib/access-control";

// GET /api/tracks/[trackId] - Get track by ID
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
      return NextResponse.json(
        { error: "Track not found or access denied." },
        { status: 404 }
      );
    }

    // Get version count
    const versionCountResult = await db
      .select({ count: count() })
      .from(trackVersion)
      .where(eq(trackVersion.trackId, trackId));

    const versionCount = versionCountResult[0]?.count || 0;

    return NextResponse.json({
      ...trackRecord[0].track,
      versionCount,
    });
  } catch (error) {
    console.error("Error fetching track:", error);
    return NextResponse.json(
      { error: "Failed to fetch track" },
      { status: 500 }
    );
  }
}

// PATCH /api/tracks/[trackId] - Update track
export async function PATCH(
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
      return NextResponse.json(
        { error: "Track not found or access denied." },
        { status: 404 }
      );
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

    const versionCountResult = await db
      .select({ count: count() })
      .from(trackVersion)
      .where(eq(trackVersion.trackId, trackId));

    const versionCount = versionCountResult[0]?.count || 0;

    return NextResponse.json({
      ...updatedTrack[0],
      versionCount,
    });
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

// DELETE /api/tracks/[trackId] - Delete track and associated file
export async function DELETE(
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

    // Check if user is owner (only owners can delete tracks)
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

    // Get all versions for this track
    const versions = await db
      .select()
      .from(trackVersion)
      .where(eq(trackVersion.trackId, trackId));

    // Delete all version files from S3
    const versionDeletePromises = versions.map(async (version) => {
      try {
        await deleteS3File(version.audioUrl);
      } catch (error) {
        console.error(
          `Failed to delete version file ${version.audioUrl}:`,
          error
        );
        // Continue deletion even if S3 deletion fails
      }
    });

    await Promise.allSettled(versionDeletePromises);

    // Delete all versions from database (will cascade due to FK)
    await db.delete(trackVersion).where(eq(trackVersion.trackId, trackId));

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
