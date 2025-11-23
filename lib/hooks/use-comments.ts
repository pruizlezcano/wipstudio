import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CreateCommentInput,
  UpdateCommentInput,
} from "@/lib/validations/comment";

export interface Comment {
  id: string;
  versionId: string;
  userId: string | null;
  content: string;
  timestamp: number | null;
  parentId: string | null;
  resolvedAt: string | null;
  resolvedById: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
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
  versionId: string,
  includeResolved: boolean = false
): Promise<Comment[]> {
  const url = `/api/tracks/${trackId}/versions/${versionId}/comments${includeResolved ? "?includeResolved=true" : ""}`;
  const response = await fetch(url);
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

// Resolve comment
async function resolveComment({
  trackId,
  versionId,
  commentId,
}: {
  trackId: string;
  versionId: string;
  commentId: string;
}): Promise<Comment> {
  const response = await fetch(
    `/api/tracks/${trackId}/versions/${versionId}/comments/${commentId}/resolve`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to resolve comment");
  }

  return response.json();
}

// Unresolve comment
async function unresolveComment({
  trackId,
  versionId,
  commentId,
}: {
  trackId: string;
  versionId: string;
  commentId: string;
}): Promise<Comment> {
  const response = await fetch(
    `/api/tracks/${trackId}/versions/${versionId}/comments/${commentId}/resolve`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to unresolve comment");
  }

  return response.json();
}

// Hooks
export function useComments(
  trackId: string,
  versionId: string,
  includeResolved: boolean = false
) {
  return useQuery({
    queryKey: [...commentKeys.list(versionId), includeResolved],
    queryFn: () => fetchComments(trackId, versionId, includeResolved),
    enabled: !!trackId && !!versionId,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    structuralSharing: true,
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

export function useResolveComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resolveComment,
    onSuccess: (_, { versionId }) => {
      // Invalidate comments list
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(versionId),
      });
      toast.success("Comment resolved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUnresolveComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unresolveComment,
    onSuccess: (_, { versionId }) => {
      // Invalidate comments list
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(versionId),
      });
      toast.success("Comment unresolved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
