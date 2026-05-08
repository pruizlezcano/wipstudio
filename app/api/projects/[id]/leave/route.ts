import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { projectCollaborator } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { checkProjectAccess } from "@/lib/access-control";

// POST /api/projects/[id]/leave - Current user leaves the project
export async function POST(
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

    const { id: projectId } = await params;
    const userId = session.user.id;

    const { hasAccess, isOwner } = await checkProjectAccess(projectId, userId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Project not found or you are not a member of this project" },
        { status: 404 }
      );
    }

    if (isOwner) {
      return NextResponse.json(
        { error: "Owners cannot leave their own project. You must delete the project or transfer ownership." },
        { status: 400 }
      );
    }

    // Delete the collaborator record for the current user
    const deleted = await db
      .delete(projectCollaborator)
      .where(
        and(
          eq(projectCollaborator.projectId, projectId),
          eq(projectCollaborator.userId, userId)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "You are not a collaborator on this project" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "You have left the project successfully" });
  } catch (error) {
    console.error("Error leaving project:", error);
    return NextResponse.json(
      { error: "Failed to leave project" },
      { status: 500 }
    );
  }
}
