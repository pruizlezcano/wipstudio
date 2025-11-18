import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { projectCollaborator, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkProjectAccess } from "@/lib/access-control";

// GET /api/projects/[id]/collaborators - List all collaborators for a project
export async function GET(
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

    const { hasAccess } = await checkProjectAccess(id, session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Fetch all collaborators with user info
    const collaborators = await db
      .select({
        id: projectCollaborator.id,
        userId: projectCollaborator.userId,
        createdAt: projectCollaborator.createdAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(projectCollaborator)
      .leftJoin(user, eq(projectCollaborator.userId, user.id))
      .where(eq(projectCollaborator.projectId, id))
      .orderBy(projectCollaborator.createdAt);

    return NextResponse.json(collaborators);
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaborators" },
      { status: 500 }
    );
  }
}
