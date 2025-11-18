import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateInvitationInput } from "@/lib/validations/invitation";

export interface Invitation {
  id: string;
  projectId: string;
  token: string;
  createdById: string;
  email: string | null;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Query keys
export const invitationKeys = {
  all: ["invitations"] as const,
  lists: () => [...invitationKeys.all, "list"] as const,
  list: (projectId: string) => [...invitationKeys.lists(), projectId] as const,
};

// Fetch all invitations for a project
async function fetchInvitations(projectId: string): Promise<Invitation[]> {
  const response = await fetch(`/api/projects/${projectId}/invitations`);
  if (!response.ok) {
    throw new Error("Failed to fetch invitations");
  }
  return response.json();
}

// Create invitation
async function createInvitation({
  projectId,
  data,
}: {
  projectId: string;
  data: CreateInvitationInput;
}): Promise<Invitation> {
  const response = await fetch(`/api/projects/${projectId}/invitations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create invitation");
  }

  return response.json();
}

// Delete invitation
async function deleteInvitation({
  projectId,
  invitationId,
}: {
  projectId: string;
  invitationId: string;
}): Promise<void> {
  const response = await fetch(
    `/api/projects/${projectId}/invitations/${invitationId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete invitation");
  }
}

// Accept invitation
async function acceptInvitation(token: string): Promise<{ projectId: string }> {
  const response = await fetch(`/api/invitations/${token}/accept`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to accept invitation");
  }

  return response.json();
}

// Hooks
export function useInvitations(projectId: string) {
  return useQuery({
    queryKey: invitationKeys.list(projectId),
    queryFn: () => fetchInvitations(projectId),
    enabled: !!projectId,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvitation,
    onSuccess: (newInvitation, { projectId }) => {
      // Optimistically update the cache
      queryClient.setQueryData<Invitation[]>(
        invitationKeys.list(projectId),
        (old) => {
          return old ? [...old, newInvitation] : [newInvitation];
        }
      );
      toast.success("Invitation created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInvitation,
    onSuccess: (_, { projectId, invitationId }) => {
      // Remove the invitation from the cache
      queryClient.setQueryData<Invitation[]>(
        invitationKeys.list(projectId),
        (old) => {
          return old ? old.filter((inv) => inv.id !== invitationId) : [];
        }
      );
      toast.success("Invitation deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      // Invalidate projects list to show new project
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Successfully joined project");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
