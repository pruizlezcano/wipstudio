import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { projectInvitation } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { checkProjectAccess } from "@/lib/access-control";

// DELETE /api/projects/[id]/invitations/[invitationId] - Delete an invitation (owners only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, invitationId } = await params;

    const { isOwner } = await checkProjectAccess(id, session.user.id);

    if (!isOwner) {
      return NextResponse.json(
        { error: "Project not found or access denied. Only owners can delete invitations." },
        { status: 404 }
      );
    }

    // Delete the invitation
    const deletedInvitation = await db
      .delete(projectInvitation)
      .where(
        and(
          eq(projectInvitation.id, invitationId),
          eq(projectInvitation.projectId, id)
        )
      )
      .returning();

    if (deletedInvitation.length === 0) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Invitation deleted successfully" });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 }
    );
  }
}
