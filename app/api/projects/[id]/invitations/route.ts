import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { projectInvitation, project } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createInvitationSchema } from "@/lib/validations/invitation";
import { z } from "zod";
import { checkProjectAccess } from "@/lib/access-control";
import { createNotification } from "@/lib/notifications/service";

// GET /api/projects/[id]/invitations - List all invitations for a project
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

    const { isOwner } = await checkProjectAccess(id, session.user.id);

    if (!isOwner) {
      return NextResponse.json(
        { error: "Project not found or access denied." },
        { status: 404 }
      );
    }

    // Fetch all invitations for this project
    const invitations = await db
      .select()
      .from(projectInvitation)
      .where(eq(projectInvitation.projectId, id))
      .orderBy(projectInvitation.createdAt);

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/invitations - Create a new invitation
export async function POST(
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

    const { isOwner } = await checkProjectAccess(id, session.user.id);

    if (!isOwner) {
      return NextResponse.json(
        {
          error:
            "Project not found or access denied. Only owners can create invitations.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createInvitationSchema.parse(body);

    // Get project details for notification
    const projectRecord = await db
      .select()
      .from(project)
      .where(eq(project.id, id))
      .limit(1);

    if (projectRecord.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create the invitation
    const newInvitation = await db
      .insert(projectInvitation)
      .values({
        id: crypto.randomUUID(),
        projectId: id,
        token: crypto.randomUUID(),
        createdById: session.user.id,
        email: validatedData.email || null,
        maxUses: validatedData.maxUses || null,
        currentUses: 0,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
      })
      .returning();

    // Send notification email (if email is specified)
    if (validatedData.email) {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const invitationUrl = `${appUrl}/invitations/${newInvitation[0].token}`;

      await createNotification({
        type: "invitation",
        recipientUserIds: [], // No in-app notification for non-users
        recipientEmails: [validatedData.email],
        title: `You've been invited to ${projectRecord[0].name}`,
        message: `${session.user.name} has invited you to join the project ${projectRecord[0].name}.`,
        metadata: {
          projectId: id,
          projectName: projectRecord[0].name,
          invitationToken: newInvitation[0].token,
          actorId: session.user.id,
          actorName: session.user.name,
          url: invitationUrl,
        },
      });
    }

    return NextResponse.json(newInvitation[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
