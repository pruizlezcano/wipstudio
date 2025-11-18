import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { projectInvitation } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createInvitationSchema } from "@/lib/validations/invitation";
import { z } from "zod";
import { checkProjectAccess } from "@/lib/access-control";

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
        { error: "Project not found or access denied. Only owners can create invitations." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createInvitationSchema.parse(body);

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
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      })
      .returning();

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
