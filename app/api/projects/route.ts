import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import {
  project,
  projectMember,
  user,
  track,
  trackVersion,
} from "@/lib/db/schema";
import { eq, asc, desc, count, max } from "drizzle-orm";
import { createProjectSchema } from "@/lib/validations/project";
import { z } from "zod";
import {
  generateAvatarAccentColor,
  generateAvatarBase64,
} from "@/lib/avatar-generator";

function withProjectFallbackArtwork<
  T extends {
    id: string;
    artwork: string | null;
    artworkDominantColor: string | null;
  },
>(projectRecord: T) {
  return {
    ...projectRecord,
    artwork:
      projectRecord.artwork ?? generateAvatarBase64(projectRecord.id, 320),
    artworkDominantColor:
      projectRecord.artworkDominantColor ??
      generateAvatarAccentColor(projectRecord.id),
  };
}

// GET /api/projects - List all projects for authenticated user (owned + collaborated)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse sort parameters from query string
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );
    const offset = (page - 1) * limit;

    // Build order by clause based on sort parameters
    const getOrderByClause = () => {
      const direction = sortOrder === "asc" ? asc : desc;
      switch (sortBy) {
        case "name":
          return direction(project.name);
        case "createdAt":
        default:
          return direction(project.createdAt);
      }
    };

    const orderByClause = getOrderByClause();

    // Get total count of owned projects
    const ownedCountResult = await db
      .select({ count: count() })
      .from(project)
      .where(eq(project.ownerId, session.user.id));
    const ownedCount = ownedCountResult[0]?.count || 0;

    // Get total count of joined projects
    const collaboratedCountResult = await db
      .select({ count: count() })
      .from(projectMember)
      .where(eq(projectMember.userId, session.user.id));
    const collaboratedCount = collaboratedCountResult[0]?.count || 0;

    const total = ownedCount + collaboratedCount;

    // Get owned projects
    const ownedProjects = await db
      .select({
        id: project.id,
        name: project.name,
        description: project.description,
        artwork: project.artwork,
        artworkDominantColor: project.artworkDominantColor,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        owner: {
          userId: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(project)
      .leftJoin(user, eq(project.ownerId, user.id))
      .where(eq(project.ownerId, session.user.id))
      .orderBy(orderByClause);

    // Get joined projects
    const collaboratedProjects = await db
      .select({
        id: project.id,
        name: project.name,
        description: project.description,
        artwork: project.artwork,
        artworkDominantColor: project.artworkDominantColor,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        owner: {
          userId: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(projectMember)
      .innerJoin(project, eq(projectMember.projectId, project.id))
      .leftJoin(user, eq(project.ownerId, user.id))
      .where(eq(projectMember.userId, session.user.id))
      .orderBy(orderByClause);

    // Combine and sort in memory, then paginate
    const allProjects = [...ownedProjects, ...collaboratedProjects];

    // Fetch lastVersionAt and members for all projects before sorting
    const projectsWithDetails = await Promise.all(
      allProjects.map(async (p) => {
        // Get the latest version date across all tracks in the project
        const [lastVersionResult, members] = await Promise.all([
          db
            .select({ lastVersionAt: max(trackVersion.createdAt) })
            .from(track)
            .innerJoin(trackVersion, eq(track.id, trackVersion.trackId))
            .where(eq(track.projectId, p.id)),
          db
            .select({
              userId: user.id,
              name: user.name,
              image: user.image,
            })
            .from(projectMember)
            .innerJoin(user, eq(projectMember.userId, user.id))
            .where(eq(projectMember.projectId, p.id)),
        ]);

        const allMembers = [
          {
            ...p.owner,
            isOwner: true,
          },
          ...members.map((m) => ({
            ...m,
            isOwner: false,
          })),
        ];

        const { owner: _owner, ...projectWithoutOwner } = p;

        return {
          ...withProjectFallbackArtwork(projectWithoutOwner),
          lastVersionAt: lastVersionResult[0]?.lastVersionAt || null,
          members: allMembers,
        };
      })
    );

    // Sort the combined array
    projectsWithDetails.sort((a, b) => {
      let aVal: string | Date | null;
      let bVal: string | Date | null;

      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "lastVersionAt":
          // Use lastVersionAt if available, otherwise fall back to createdAt
          aVal = a.lastVersionAt
            ? new Date(a.lastVersionAt)
            : new Date(a.createdAt);
          bVal = b.lastVersionAt
            ? new Date(b.lastVersionAt)
            : new Date(b.createdAt);
          break;
        case "createdAt":
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const paginatedProjects = projectsWithDetails.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedProjects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const newProject = await db
      .insert(project)
      .values({
        id: crypto.randomUUID(),
        name: validatedData.name,
        description: validatedData.description || null,
        artwork: validatedData.artwork || null,
        artworkDominantColor: validatedData.artworkDominantColor || null,
        ownerId: session.user.id,
      })
      .returning();

    const { ownerId: _ownerId, ...projectDataWithoutOwnerId } = newProject[0];

    return NextResponse.json(
      {
        ...withProjectFallbackArtwork(projectDataWithoutOwnerId),
        lastVersionAt: null,
        members: [
          {
            userId: session.user.id,
            name: session.user.name,
            image: session.user.image,
            isOwner: true,
          },
        ],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
