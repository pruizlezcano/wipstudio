import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { projectMember } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { checkProjectAccess } from "@/lib/access-control";

// DELETE /api/projects/[id]/members/[userId] - Remove a member
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, userId } = await params;

    const { isOwner } = await checkProjectAccess(id, session.user.id);

    if (!isOwner) {
      return NextResponse.json(
        {
          error:
            "Project not found or access denied. Only owners can remove members.",
        },
        { status: 404 }
      );
    }

    // Delete the membership
    const deleted = await db
      .delete(projectMember)
      .where(
        and(eq(projectMember.projectId, id), eq(projectMember.userId, userId))
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
