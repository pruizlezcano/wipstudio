import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { projectInvitation, project } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/invitations/[token] - Get invitation details (public)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find the invitation with project details
    const invitations = await db
      .select({
        id: projectInvitation.id,
        projectId: projectInvitation.projectId,
        projectName: project.name,
        expiresAt: projectInvitation.expiresAt,
        maxUses: projectInvitation.maxUses,
        currentUses: projectInvitation.currentUses,
      })
      .from(projectInvitation)
      .innerJoin(project, eq(projectInvitation.projectId, project.id))
      .where(eq(projectInvitation.token, token))
      .limit(1);

    if (invitations.length === 0) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(invitations[0]);
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}
