import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { project, track, trackVersion } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateProjectSchema } from "@/lib/validations/project";
import { z } from "zod";
import { deleteS3File } from "@/lib/storage/s3";

// GET /api/projects/[id] - Get single project
export async function GET(
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

    const { id } = await params;

    const projectData = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.ownerId, session.user.id)))
      .limit(1);

    if (projectData.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(projectData[0]);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update project
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    // Check if project exists and belongs to user
    const existingProject = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.ownerId, session.user.id)))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updatedProject = await db
      .update(project)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(project.id, id))
      .returning();

    return NextResponse.json(updatedProject[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
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

    const { id } = await params;

    // Check if project exists and belongs to user
    const existingProject = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.ownerId, session.user.id)))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch all tracks for this project
    const tracks = await db
      .select()
      .from(track)
      .where(eq(track.projectId, id));

    // For each track, fetch and delete all version files from S3
    const allVersionDeletePromises = tracks.flatMap((t) =>
      db
        .select()
        .from(trackVersion)
        .where(eq(trackVersion.trackId, t.id))
        .then((versions) =>
          versions.map(async (version) => {
            try {
              await deleteS3File(version.audioUrl);
            } catch (error) {
              console.error(
                `Failed to delete version file ${version.audioUrl}:`,
                error
              );
            }
          })
        )
        .then((promises) => Promise.allSettled(promises))
    );

    await Promise.all(allVersionDeletePromises);

    // Delete the project (tracks and versions will be deleted automatically via cascade)
    await db.delete(project).where(eq(project.id, id));

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
