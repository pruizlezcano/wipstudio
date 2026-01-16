import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProject, projectKeys } from "./use-projects";
// Remove collaborator
async function removeCollaborator({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}): Promise<void> {
  const response = await fetch(
    `/api/projects/${projectId}/collaborators/${userId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove collaborator");
  }
}

// Hooks
export function useCollaborators(projectId: string) {
  const { data: project, isLoading, error } = useProject(projectId);
  return { data: project?.collaborators, isLoading, error };
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCollaborator,
    onSuccess: (_, { projectId, userId }) => {
      // Invalidate project list and detail queries
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      toast.success("Collaborator removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
