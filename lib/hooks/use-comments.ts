import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateCommentInput, UpdateCommentInput } from "@/lib/validations/comment";

export interface Comment {
  id: string;
  versionId: string;
  userId: string;
  content: string;
  timestamp: number | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  replies: Comment[];
}

// Query keys
export const commentKeys = {
  all: ["comments"] as const,
  lists: () => [...commentKeys.all, "list"] as const,
  list: (versionId: string) => [...commentKeys.lists(), versionId] as const,
};

// Fetch all comments for a version
async function fetchComments(
  trackId: string,
  versionId: string
): Promise<Comment[]> {
  const response = await fetch(
    `/api/tracks/${trackId}/versions/${versionId}/comments`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch comments");
  }
  return response.json();
}

// Create comment
async function createComment({
  trackId,
  versionId,
  data,
}: {
  trackId: string;
  versionId: string;
  data: CreateCommentInput;
}): Promise<Comment> {
  const response = await fetch(
    `/api/tracks/${trackId}/versions/${versionId}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create comment");
  }

  return response.json();
}

// Update comment
async function updateComment({
  trackId,
  versionId,
  commentId,
  data,
}: {
  trackId: string;
  versionId: string;
  commentId: string;
  data: UpdateCommentInput;
}): Promise<Comment> {
  const response = await fetch(
    `/api/tracks/${trackId}/versions/${versionId}/comments/${commentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update comment");
  }

  return response.json();
}

// Delete comment
async function deleteComment({
  trackId,
  versionId,
  commentId,
}: {
  trackId: string;
  versionId: string;
  commentId: string;
}): Promise<void> {
  const response = await fetch(
    `/api/tracks/${trackId}/versions/${versionId}/comments/${commentId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete comment");
  }
}

// Hooks
export function useComments(trackId: string, versionId: string) {
  return useQuery({
    queryKey: commentKeys.list(versionId),
    queryFn: () => fetchComments(trackId, versionId),
    enabled: !!trackId && !!versionId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (_, { versionId }) => {
      // Invalidate comments list to refetch with new comment
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(versionId),
      });
      toast.success("Comment added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateComment,
    onSuccess: (_, { versionId }) => {
      // Invalidate comments list
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(versionId),
      });
      toast.success("Comment updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: (_, { versionId }) => {
      // Invalidate comments list
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(versionId),
      });
      toast.success("Comment deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
