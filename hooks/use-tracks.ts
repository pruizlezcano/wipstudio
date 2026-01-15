import {
  useMutation,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CreateTrackInput,
  UpdateTrackInput,
  UploadRequestInput,
} from "@/lib/validations/track";
import type {
  Track,
  TrackVersion,
  PresignedUrlResponse,
  MultipartUploadResponse,
  ChunkUrlsResponse,
  PaginatedTracksResponse,
} from "@/types/track";
import { usePlayerStore } from "@/stores/playerStore";
import { getPublicEnv } from "@/app/public-env";

// Query keys
export const trackKeys = {
  all: ["tracks"] as const,
  lists: () => [...trackKeys.all, "list"] as const,
  list: (projectId: string, sortBy?: string, sortOrder?: string) =>
    [...trackKeys.lists(), projectId, { sortBy, sortOrder }] as const,
  details: () => [...trackKeys.all, "detail"] as const,
  detail: (id: string) => [...trackKeys.details(), id] as const,
  versions: (trackId: string) =>
    [...trackKeys.all, "versions", trackId] as const,
};

// Sort options type
export type TrackSortBy = "name" | "createdAt" | "updatedAt" | "lastVersionAt";
export type SortOrder = "asc" | "desc";

export interface TrackSortOptions {
  sortBy?: TrackSortBy;
  sortOrder?: SortOrder;
}

export interface TrackQueryOptions extends TrackSortOptions {
  limit?: number;
}

// Fetch tracks for a project with pagination
async function fetchTracks(
  projectId: string,
  page: number,
  options?: TrackQueryOptions
): Promise<PaginatedTracksResponse> {
  const params = new URLSearchParams();
  if (options?.sortBy) params.set("sortBy", options.sortBy);
  if (options?.sortOrder) params.set("sortOrder", options.sortOrder);
  params.set("page", page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());

  const queryString = params.toString();
  const url = `/api/projects/${projectId}/tracks?${queryString}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch tracks");
  }
  return response.json();
}

// Fetch a single track
async function fetchTrack(trackId: string): Promise<Track> {
  const response = await fetch(`/api/tracks/${trackId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch track");
  }
  return response.json();
}

// Create track
async function createTrack({
  projectId,
  data,
}: {
  projectId: string;
  data: Omit<CreateTrackInput, "projectId">;
}): Promise<Track> {
  const response = await fetch(`/api/projects/${projectId}/tracks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create track");
  }

  return response.json();
}

// Update track
async function updateTrack({
  id,
  data,
}: {
  id: string;
  data: UpdateTrackInput;
}): Promise<Track> {
  const response = await fetch(`/api/tracks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update track");
  }

  return response.json();
}

// Delete track
async function deleteTrack(id: string): Promise<void> {
  const response = await fetch(`/api/tracks/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete track");
  }
}

// Get presigned URL for upload
async function getPresignedUrl(
  data: UploadRequestInput
): Promise<PresignedUrlResponse> {
  const response = await fetch("/api/upload/presigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get upload URL");
  }

  return response.json();
}

// Upload file to S3 (simple upload)
async function uploadFile(
  file: File,
  uploadUrl: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(e.loaded, e.total);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

// Initiate multipart upload
async function initiateMultipartUpload(
  projectId: string,
  fileName: string,
  fileType: string
): Promise<MultipartUploadResponse> {
  const response = await fetch("/api/upload/multipart/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, fileName, fileType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to initiate multipart upload");
  }

  return response.json();
}

// Get presigned URLs for chunks
async function getChunkUrls(
  projectId: string,
  objectKey: string,
  uploadId: string,
  partNumbers: number[]
): Promise<ChunkUrlsResponse> {
  const response = await fetch("/api/upload/multipart/chunk-urls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, objectKey, uploadId, partNumbers }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get chunk URLs");
  }

  return response.json();
}

// Upload a single chunk and return its ETag
async function uploadChunk(
  chunk: Blob,
  url: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded, e.total);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        if (!etag) {
          reject(new Error("No ETag returned from upload"));
          return;
        }
        resolve(etag);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.open("PUT", url);
    xhr.send(chunk);
  });
}

// Complete multipart upload
async function completeMultipartUpload(
  projectId: string,
  objectKey: string,
  uploadId: string,
  parts: Array<{ PartNumber: number; ETag: string }>
): Promise<void> {
  const response = await fetch("/api/upload/multipart/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, objectKey, uploadId, parts }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to complete multipart upload");
  }
}

// Abort multipart upload
async function abortMultipartUpload(
  projectId: string,
  objectKey: string,
  uploadId: string
): Promise<void> {
  try {
    await fetch("/api/upload/multipart/abort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, objectKey, uploadId }),
    });
  } catch (error) {
    console.error("Failed to abort multipart upload:", error);
  }
}

// Smart upload function that chooses between simple and multipart upload
async function uploadFileWithChunking(
  file: File,
  projectId: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<string> {
  const chunkSize = parseInt(getPublicEnv().UPLOAD_CHUNK_SIZE, 10);

  // Use simple upload for small files
  if (file.size < chunkSize) {
    const { uploadUrl, objectUrl } = await getPresignedUrl({
      fileName: file.name,
      fileType: file.type,
      projectId,
    });

    await uploadFile(file, uploadUrl, onProgress);
    return objectUrl;
  }

  // Use multipart upload for large files
  const { uploadId, objectUrl } = await initiateMultipartUpload(
    projectId,
    file.name,
    file.type
  );

  try {
    // Split file into chunks
    const chunks: Blob[] = [];
    let offset = 0;
    while (offset < file.size) {
      chunks.push(file.slice(offset, offset + chunkSize));
      offset += chunkSize;
    }

    // Get presigned URLs for all chunks
    const partNumbers = chunks.map((_, index) => index + 1);
    const { chunkUrls } = await getChunkUrls(
      projectId,
      objectUrl,
      uploadId,
      partNumbers
    );

    // Upload all chunks with progress tracking
    let totalUploaded = 0;
    const parts: Array<{ PartNumber: number; ETag: string }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkUrl = chunkUrls.find((c) => c.partNumber === i + 1);

      if (!chunkUrl) {
        throw new Error(`Missing URL for chunk ${i + 1}`);
      }

      const etag = await uploadChunk(chunk, chunkUrl.url, (loaded) => {
        if (onProgress) {
          const chunkProgress = totalUploaded + loaded;
          onProgress(chunkProgress, file.size);
        }
      });

      totalUploaded += chunk.size;
      parts.push({ PartNumber: i + 1, ETag: etag });

      // Report overall progress after chunk completes
      if (onProgress) {
        onProgress(totalUploaded, file.size);
      }
    }

    // Complete the multipart upload
    await completeMultipartUpload(projectId, objectUrl, uploadId, parts);

    return objectUrl;
  } catch (error) {
    // Abort the multipart upload on failure
    await abortMultipartUpload(projectId, objectUrl, uploadId);
    throw error;
  }
}

// Hooks
export function useTracks(projectId: string, options?: TrackQueryOptions) {
  return useInfiniteQuery({
    queryKey: trackKeys.list(projectId, options?.sortBy, options?.sortOrder),
    queryFn: ({ pageParam }) => fetchTracks(projectId, pageParam, options),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!projectId,
    refetchOnWindowFocus: true,
  });
}

export function useTrack(trackId: string) {
  return useQuery({
    queryKey: trackKeys.detail(trackId),
    queryFn: () => fetchTrack(trackId),
    enabled: !!trackId,
    refetchOnWindowFocus: true,
    structuralSharing: true,
  });
}

export function useCreateTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTrack,
    onSuccess: () => {
      // Invalidate all track list queries to refetch with current pagination
      queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
      toast.success("Track created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTrack,
    onSuccess: (updatedTrack) => {
      // Invalidate all track list queries
      queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
      // Update the detail cache
      queryClient.setQueryData(trackKeys.detail(updatedTrack.id), updatedTrack);
      toast.success("Track updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTrack,
    onSuccess: (_, deletedId) => {
      // We need to invalidate all track lists since we don't know the projectId
      queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
      // Remove detail cache
      queryClient.removeQueries({ queryKey: trackKeys.detail(deletedId) });
      toast.success("Track deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUploadTrack() {
  const createTrackMutation = useCreateTrack();

  return useMutation({
    mutationFn: async ({
      file,
      trackName,
      projectId,
      notes,
      onProgress,
    }: {
      file: File;
      trackName: string;
      projectId: string;
      notes?: string;
      onProgress?: (loaded: number, total: number) => void;
    }) => {
      // Upload file (automatically handles chunking if needed)
      const objectUrl = await uploadFileWithChunking(
        file,
        projectId,
        onProgress
      );

      // Create track record in database with initial version
      return createTrackMutation.mutateAsync({
        projectId,
        data: {
          name: trackName,
          audioUrl: objectUrl,
          notes,
        },
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload track");
    },
  });
}

// ===== VERSION MANAGEMENT =====

// Fetch all versions for a track
async function fetchVersions(trackId: string): Promise<TrackVersion[]> {
  const response = await fetch(`/api/tracks/${trackId}/versions`);
  if (!response.ok) {
    throw new Error("Failed to fetch versions");
  }
  return response.json();
}

// Create a new version
async function createVersion({
  trackId,
  data,
}: {
  trackId: string;
  data: { audioUrl: string; notes?: string };
}): Promise<TrackVersion> {
  const response = await fetch(`/api/tracks/${trackId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create version");
  }

  return response.json();
}

// Update version notes
async function updateVersion({
  trackId,
  versionId,
  notes,
}: {
  trackId: string;
  versionId: string;
  notes?: string;
}): Promise<TrackVersion> {
  const response = await fetch(`/api/tracks/${trackId}/versions/${versionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update version");
  }

  return response.json();
}

// Delete a version
async function deleteVersion({
  trackId,
  versionId,
}: {
  trackId: string;
  versionId: string;
}): Promise<void> {
  const response = await fetch(`/api/tracks/${trackId}/versions/${versionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete version");
  }
}

// Version hooks
export function useVersions(trackId: string) {
  return useQuery({
    queryKey: trackKeys.versions(trackId),
    queryFn: () => fetchVersions(trackId),
    enabled: !!trackId,
    refetchOnWindowFocus: true,
    structuralSharing: true,
  });
}

export function useCreateVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVersion,
    onSuccess: (newVersion) => {
      // Invalidate versions list
      queryClient.invalidateQueries({
        queryKey: trackKeys.versions(newVersion.trackId),
      });
      // Invalidate track lists to update latest version
      queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
      toast.success("New version created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVersion,
    onSuccess: (updatedVersion) => {
      // Invalidate versions list
      queryClient.invalidateQueries({
        queryKey: trackKeys.versions(updatedVersion.trackId),
      });
      toast.success("Version updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVersion,
    onSuccess: (_, { trackId, versionId }) => {
      // Check if the deleted version is currently playing in the global player
      const { version: currentVersion, clearPlayer } =
        usePlayerStore.getState();
      if (currentVersion?.id === versionId) {
        clearPlayer();
      }

      // Invalidate versions list
      queryClient.invalidateQueries({ queryKey: trackKeys.versions(trackId) });
      // Invalidate track lists to update latest version
      queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
      toast.success("Version deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUploadVersion() {
  const createVersionMutation = useCreateVersion();

  return useMutation({
    mutationFn: async ({
      file,
      trackId,
      projectId,
      notes,
      onProgress,
    }: {
      file: File;
      trackId: string;
      projectId: string;
      notes?: string;
      onProgress?: (loaded: number, total: number) => void;
    }) => {
      // Upload file (automatically handles chunking if needed)
      const objectUrl = await uploadFileWithChunking(
        file,
        projectId,
        onProgress
      );

      // Create version record in database
      return createVersionMutation.mutateAsync({
        trackId,
        data: {
          audioUrl: objectUrl,
          notes,
        },
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload version");
    },
  });
}

// Set version as master
async function setMasterVersion({
  trackId,
  versionId,
}: {
  trackId: string;
  versionId: string;
}): Promise<TrackVersion> {
  const response = await fetch(`/api/tracks/${trackId}/versions/${versionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isMaster: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to set master version");
  }

  return response.json();
}

export function useSetMasterVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setMasterVersion,
    onSuccess: (updatedVersion) => {
      // Invalidate versions list to reflect master change
      queryClient.invalidateQueries({
        queryKey: trackKeys.versions(updatedVersion.trackId),
      });
      // Invalidate track detail to update UI
      queryClient.invalidateQueries({
        queryKey: trackKeys.detail(updatedVersion.trackId),
      });
      // Invalidate track lists to update latest version
      queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
      toast.success("Master version updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
