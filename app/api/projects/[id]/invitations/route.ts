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
import { getAppConfig } from "@/lib/config";

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

    // Collect all emails to invite
    const emailsToInvite = new Set<string>();
    if (validatedData.email)
      emailsToInvite.add(validatedData.email.toLowerCase().trim());
    if (validatedData.emails) {
      validatedData.emails.forEach((e) =>
        emailsToInvite.add(e.toLowerCase().trim())
      );
    }

    // Get project details for notification
    const projectRecord = await db
      .select()
      .from(project)
      .where(eq(project.id, id))
      .limit(1);

    if (projectRecord.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const appUrl = getAppConfig().url;

    // Create the invitation
    // If restricted, we can only support this if we have a way to check the email on acceptance.
    // The current schema has a single 'email' field.
    // If we want to restrict to MULTIPLE emails, we either need a new table or 
    // we use the single invitation and the acceptance logic handles it.
    // Given the user wants to "restrict to those emails", and we are using a single invitation:
    
    const [newInvitation] = await db
      .insert(projectInvitation)
      .values({
        id: crypto.randomUUID(),
        projectId: id,
        token: crypto.randomUUID(),
        createdById: session.user.id,
        // If restricted to multiple emails, we store them as a comma-separated string
        // or just the first one if it's only one.
        email: validatedData.restrictToEmails && emailsToInvite.size > 0
          ? Array.from(emailsToInvite).join(",")
          : null,
        maxUses: validatedData.maxUses || null,
        currentUses: 0,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
      })
      .returning();

    // Send notification emails to all specified addresses using the same invitation link
    if (emailsToInvite.size > 0) {
      const invitationUrl = `${appUrl}/invitations/${newInvitation.token}`;

      for (const email of Array.from(emailsToInvite)) {
        await createNotification({
          type: "invitation",
          recipientUserIds: [], // No in-app notification for non-users
          recipientEmails: [email],
          title: `You've been invited to ${projectRecord[0].name}`,
          message: `${session.user.name} has invited you to join the project ${projectRecord[0].name}.`,
          metadata: {
            projectId: id,
            projectName: projectRecord[0].name,
            invitationToken: newInvitation.token,
            actorId: session.user.id,
            actorName: session.user.name,
            url: invitationUrl,
          },
        });
      }
    }

    return NextResponse.json(newInvitation, { status: 201 });
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
