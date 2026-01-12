import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { project, projectCollaborator, user } from "@/lib/db/schema";
import { eq, sql, asc, desc, count } from "drizzle-orm";
import { createProjectSchema } from "@/lib/validations/project";
import { z } from "zod";

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
        case "updatedAt":
          return direction(project.updatedAt);
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

    // Get total count of collaborated projects
    const collaboratedCountResult = await db
      .select({ count: count() })
      .from(projectCollaborator)
      .where(eq(projectCollaborator.userId, session.user.id));
    const collaboratedCount = collaboratedCountResult[0]?.count || 0;

    const total = ownedCount + collaboratedCount;

    // Get owned projects
    const ownedProjects = await db
      .select({
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        role: sql<string>`'owner'`.as('role'),
        ownerName: user.name,
      })
      .from(project)
      .leftJoin(user, eq(project.ownerId, user.id))
      .where(eq(project.ownerId, session.user.id))
      .orderBy(orderByClause);

    // Get collaborated projects
    const collaboratedProjects = await db
      .select({
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        role: sql<string>`'collaborator'`.as('role'),
        ownerName: user.name,
      })
      .from(projectCollaborator)
      .innerJoin(project, eq(projectCollaborator.projectId, project.id))
      .leftJoin(user, eq(project.ownerId, user.id))
      .where(eq(projectCollaborator.userId, session.user.id))
      .orderBy(orderByClause);

    // Combine and sort in memory, then paginate
    const allProjects = [...ownedProjects, ...collaboratedProjects];
    
    // Sort the combined array
    allProjects.sort((a, b) => {
      let aVal: string | Date;
      let bVal: string | Date;
      
      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "updatedAt":
          aVal = new Date(a.updatedAt);
          bVal = new Date(b.updatedAt);
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
    const paginatedProjects = allProjects.slice(offset, offset + limit);

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
        ownerId: session.user.id,
      })
      .returning();

    return NextResponse.json(newProject[0], { status: 201 });
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
