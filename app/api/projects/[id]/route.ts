import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { project, track, trackVersion, user, projectCollaborator } from "@/lib/db/schema";
import { eq, sql, max } from "drizzle-orm";
import { updateProjectSchema } from "@/lib/validations/project";
import { z } from "zod";
import { deleteS3File } from "@/lib/storage/s3";
import { checkProjectAccess } from "@/lib/access-control";

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

    const { hasAccess, project: projectData } = await checkProjectAccess(id, session.user.id);

    if (!hasAccess || !projectData) {
      return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
    }

    // Fetch details (owner, collaborators, lastVersionAt)
    const [ownerResult, collaborators, lastVersionResult] = await Promise.all([
      db
        .select({
          name: user.name,
          image: user.image,
        })
        .from(user)
        .where(eq(user.id, projectData.ownerId))
        .limit(1),
      db
        .select({
          userId: user.id,
          name: user.name,
          image: user.image,
        })
        .from(projectCollaborator)
        .innerJoin(user, eq(projectCollaborator.userId, user.id))
        .where(eq(projectCollaborator.projectId, id)),
      db
        .select({ lastVersionAt: max(trackVersion.createdAt) })
        .from(track)
        .innerJoin(trackVersion, eq(track.id, trackVersion.trackId))
        .where(eq(track.projectId, id)),
    ]);

    const ownerInfo = ownerResult[0];
    const { ownerId, ...rest } = projectData;

    return NextResponse.json({
      ...rest,
      owner: {
        userId: projectData.ownerId,
        name: ownerInfo?.name || "Unknown",
        image: ownerInfo?.image || null,
      },
      collaborators,
      lastVersionAt: lastVersionResult[0]?.lastVersionAt || null,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update project (owners only)
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

    const access = await checkProjectAccess(id, session.user.id);

    if (!access.hasAccess) {
      return NextResponse.json({ error: "Project not found or access denied. Only owners can update." }, { status: 404 });
    }

    const updatedProject = await db
      .update(project)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(project.id, id))
      .returning();

    const projectData = updatedProject[0];

    // Fetch details (owner, collaborators, lastVersionAt)
    const [ownerResult, collaborators, lastVersionResult] = await Promise.all([
      db
        .select({
          name: user.name,
          image: user.image,
        })
        .from(user)
        .where(eq(user.id, projectData.ownerId))
        .limit(1),
      db
        .select({
          userId: user.id,
          name: user.name,
          image: user.image,
        })
        .from(projectCollaborator)
        .innerJoin(user, eq(projectCollaborator.userId, user.id))
        .where(eq(projectCollaborator.projectId, id)),
      db
        .select({ lastVersionAt: max(trackVersion.createdAt) })
        .from(track)
        .innerJoin(trackVersion, eq(track.id, trackVersion.trackId))
        .where(eq(track.projectId, id)),
    ]);

    const ownerInfo = ownerResult[0];
    const { ownerId, ...rest } = projectData;

    return NextResponse.json({
      ...rest,
      owner: {
        userId: projectData.ownerId,
        name: ownerInfo?.name || "Unknown",
        image: ownerInfo?.image || null,
      },
      collaborators,
      lastVersionAt: lastVersionResult[0]?.lastVersionAt || null,
    });
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

// DELETE /api/projects/[id] - Delete project (owner only)
export async function DELETE(
  _request: NextRequest,
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

    const { isOwner } = await checkProjectAccess(id, session.user.id);

    if (!isOwner) {
      return NextResponse.json({ error: "Project not found or access denied. Only owners can delete." }, { status: 404 });
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
