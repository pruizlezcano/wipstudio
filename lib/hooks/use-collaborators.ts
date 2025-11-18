import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Collaborator {
  id: string;
  userId: string;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
}

// Query keys
export const collaboratorKeys = {
  all: ["collaborators"] as const,
  lists: () => [...collaboratorKeys.all, "list"] as const,
  list: (projectId: string) => [...collaboratorKeys.lists(), projectId] as const,
};

// Fetch all collaborators for a project
async function fetchCollaborators(projectId: string): Promise<Collaborator[]> {
  const response = await fetch(`/api/projects/${projectId}/collaborators`);
  if (!response.ok) {
    throw new Error("Failed to fetch collaborators");
  }
  return response.json();
}

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
  return useQuery({
    queryKey: collaboratorKeys.list(projectId),
    queryFn: () => fetchCollaborators(projectId),
    enabled: !!projectId,
  });
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCollaborator,
    onSuccess: (_, { projectId, userId }) => {
      // Remove from cache
      queryClient.setQueryData<Collaborator[]>(
        collaboratorKeys.list(projectId),
        (old) => {
          return old ? old.filter((collab) => collab.userId !== userId) : [];
        }
      );
      toast.success("Collaborator removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
