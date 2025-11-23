import { db } from "@/lib/db/db";
import { project, projectCollaborator } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Check if a user has access to a project (either as owner or collaborator)
 * @param projectId - The project ID to check access for
 * @param userId - The user ID to check
 * @returns Object with hasAccess, isOwner flags, and optionally the project data
 */
export async function checkProjectAccess(projectId: string, userId: string) {
  const result = await db
    .select({
      project,
      isCollaborator: projectCollaborator.userId,
    })
    .from(project)
    .leftJoin(
      projectCollaborator,
      and(
        eq(projectCollaborator.projectId, project.id),
        eq(projectCollaborator.userId, userId),
      ),
    )
    .where(eq(project.id, projectId))
    .limit(1);

  if (result.length === 0) {
    return { hasAccess: false, isOwner: false, project: null };
  }

  const isOwner = result[0].project.ownerId === userId;
  const isCollaborator = result[0].isCollaborator === userId;
  const hasAccess = isOwner || isCollaborator;

  return { hasAccess, isOwner, project: result[0].project };
}
