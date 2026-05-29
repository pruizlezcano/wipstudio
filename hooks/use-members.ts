import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import { useProject, projectKeys } from "./use-projects";

// Remove member
async function removeMember({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw ApiError.fromResponse(
      error,
      "Failed to remove member",
      response.status
    );
  }
}

// Hooks
export function useMembers(projectId: string) {
  const { data: project, isLoading, error } = useProject(projectId);
  return { data: project?.members, isLoading, error };
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMember,
    onSuccess: (_, { projectId }) => {
      // Invalidate project list and detail queries
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
      toast.success("Member removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Leave project
async function leaveProject(projectId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/leave`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw ApiError.fromResponse(
      error,
      "Failed to leave project",
      response.status
    );
  }
}

export function useLeaveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveProject,
    onSuccess: () => {
      // Invalidate project list since the user is no longer a member
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("You have left the project");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
