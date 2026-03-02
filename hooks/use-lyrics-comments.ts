import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import type {
  CreateLyricsCommentInput,
  UpdateLyricsCommentInput,
} from "@/lib/validations/lyrics-comment";
import type { LyricsComment } from "@/types/lyrics-comment";

// Query keys
export const lyricsCommentKeys = {
  all: ["lyricsComments"] as const,
  lists: () => [...lyricsCommentKeys.all, "list"] as const,
  list: (trackId: string) => [...lyricsCommentKeys.lists(), trackId] as const,
};

// Fetch all comments for a track's lyrics
async function fetchLyricsComments(
  trackId: string,
  includeResolved: boolean = false
): Promise<LyricsComment[]> {
  const url = `/api/tracks/${trackId}/lyrics/comments${includeResolved ? "?includeResolved=true" : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError("Failed to fetch lyrics comments", response.status);
  }
  return response.json();
}

// Create lyrics comment
async function createLyricsComment({
  trackId,
  data,
}: {
  trackId: string;
  data: CreateLyricsCommentInput;
}): Promise<LyricsComment> {
  const response = await fetch(`/api/tracks/${trackId}/lyrics/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(
      error.error || "Failed to create lyrics comment",
      response.status
    );
  }

  return response.json();
}

// Update lyrics comment
async function updateLyricsComment({
  trackId,
  commentId,
  data,
}: {
  trackId: string;
  commentId: string;
  data: UpdateLyricsCommentInput;
}): Promise<LyricsComment> {
  const response = await fetch(
    `/api/tracks/${trackId}/lyrics/comments/${commentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(
      error.error || "Failed to update lyrics comment",
      response.status
    );
  }

  return response.json();
}

// Delete lyrics comment
async function deleteLyricsComment({
  trackId,
  commentId,
}: {
  trackId: string;
  commentId: string;
}): Promise<void> {
  const response = await fetch(
    `/api/tracks/${trackId}/lyrics/comments/${commentId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(
      error.error || "Failed to delete lyrics comment",
      response.status
    );
  }
}

// Resolve lyrics comment
async function resolveLyricsComment({
  trackId,
  commentId,
}: {
  trackId: string;
  commentId: string;
}): Promise<LyricsComment> {
  const response = await fetch(
    `/api/tracks/${trackId}/lyrics/comments/${commentId}/resolve`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(
      error.error || "Failed to resolve lyrics comment",
      response.status
    );
  }

  return response.json();
}

// Unresolve lyrics comment
async function unresolveLyricsComment({
  trackId,
  commentId,
}: {
  trackId: string;
  commentId: string;
}): Promise<LyricsComment> {
  const response = await fetch(
    `/api/tracks/${trackId}/lyrics/comments/${commentId}/resolve`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(
      error.error || "Failed to unresolve lyrics comment",
      response.status
    );
  }

  return response.json();
}

// Hooks
export function useLyricsComments(
  trackId: string,
  includeResolved: boolean = false
) {
  return useQuery({
    queryKey: [...lyricsCommentKeys.list(trackId), includeResolved],
    queryFn: () => fetchLyricsComments(trackId, includeResolved),
    enabled: !!trackId,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    structuralSharing: true,
  });
}

export function useCreateLyricsComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLyricsComment,
    onSuccess: (_, { trackId }) => {
      // Invalidate comments list to refetch with new comment
      queryClient.invalidateQueries({
        queryKey: lyricsCommentKeys.list(trackId),
      });
      toast.success("Comment added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateLyricsComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLyricsComment,
    onSuccess: (_, { trackId }) => {
      // Invalidate comments list
      queryClient.invalidateQueries({
        queryKey: lyricsCommentKeys.list(trackId),
      });
      toast.success("Comment updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteLyricsComment(callbacks?: {
  onSuccess?: (commentId: string, trackId: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLyricsComment,
    onSuccess: (_, { trackId, commentId }) => {
      // Invalidate comments list
      queryClient.invalidateQueries({
        queryKey: lyricsCommentKeys.list(trackId),
      });

      // Call custom success callback (e.g., to remove editor mark)
      callbacks?.onSuccess?.(commentId, trackId);

      toast.success("Comment deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useResolveLyricsComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resolveLyricsComment,
    onSuccess: (_, { trackId }) => {
      // Invalidate comments list
      queryClient.invalidateQueries({
        queryKey: lyricsCommentKeys.list(trackId),
      });
      toast.success("Comment resolved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUnresolveLyricsComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unresolveLyricsComment,
    onSuccess: (_, { trackId }) => {
      // Invalidate comments list
      queryClient.invalidateQueries({
        queryKey: lyricsCommentKeys.list(trackId),
      });
      toast.success("Comment unresolved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
