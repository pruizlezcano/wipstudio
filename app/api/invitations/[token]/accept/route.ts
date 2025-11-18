import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { projectInvitation, projectCollaborator, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/invitations/[token]/accept - Accept an invitation
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    // Find the invitation
    const invitation = await db
      .select()
      .from(projectInvitation)
      .where(eq(projectInvitation.token, token))
      .limit(1);

    if (invitation.length === 0) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    const inv = invitation[0];

    // Validate invitation
    if (inv.expiresAt && new Date(inv.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    if (inv.maxUses && inv.currentUses >= inv.maxUses) {
      return NextResponse.json(
        { error: "This invitation has reached its maximum uses" },
        { status: 400 }
      );
    }

    // Check if specific email invitation matches user
    if (inv.email) {
      const currentUser = await db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (currentUser.length === 0 || currentUser[0].email !== inv.email) {
        return NextResponse.json(
          { error: "This invitation is for a different email address" },
          { status: 403 }
        );
      }
    }

    // Check if user is already a collaborator
    const existingCollaborator = await db
      .select()
      .from(projectCollaborator)
      .where(
        and(
          eq(projectCollaborator.projectId, inv.projectId),
          eq(projectCollaborator.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingCollaborator.length > 0) {
      return NextResponse.json(
        { error: "You are already a collaborator on this project" },
        { status: 400 }
      );
    }

    // Create collaborator
    const newCollaborator = await db
      .insert(projectCollaborator)
      .values({
        id: crypto.randomUUID(),
        projectId: inv.projectId,
        userId: session.user.id,
      })
      .returning();

    // Increment invitation uses
    await db
      .update(projectInvitation)
      .set({
        currentUses: inv.currentUses + 1,
        updatedAt: new Date(),
      })
      .where(eq(projectInvitation.id, inv.id));

    return NextResponse.json({
      message: "Successfully joined project",
      collaborator: newCollaborator[0],
      projectId: inv.projectId,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
