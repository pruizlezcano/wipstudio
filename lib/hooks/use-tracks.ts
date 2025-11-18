import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateTrackInput, UpdateTrackInput, UploadRequestInput } from "@/lib/validations/track";

export interface TrackVersion {
  id: string;
  trackId: string;
  versionNumber: number;
  audioUrl: string;
  notes: string | null;
  createdAt: string;
}

export interface Track {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  latestVersion: TrackVersion | null;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  objectUrl: string;
}

// Query keys
export const trackKeys = {
  all: ["tracks"] as const,
  lists: () => [...trackKeys.all, "list"] as const,
  list: (projectId: string) => [...trackKeys.lists(), projectId] as const,
  details: () => [...trackKeys.all, "detail"] as const,
  detail: (id: string) => [...trackKeys.details(), id] as const,
  versions: (trackId: string) => [...trackKeys.all, "versions", trackId] as const,
};

// Fetch all tracks for a project
async function fetchTracks(projectId: string): Promise<Track[]> {
  const response = await fetch(`/api/projects/${projectId}/tracks`);
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

// Upload file to S3
async function uploadFile(file: File, uploadUrl: string): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }
}

// Hooks
export function useTracks(projectId: string) {
  return useQuery({
    queryKey: trackKeys.list(projectId),
    queryFn: () => fetchTracks(projectId),
    enabled: !!projectId,
  });
}

export function useTrack(trackId: string) {
  return useQuery({
    queryKey: trackKeys.detail(trackId),
    queryFn: () => fetchTrack(trackId),
    enabled: !!trackId,
  });
}

export function useCreateTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTrack,
    onSuccess: (newTrack) => {
      // Optimistically update the cache
      queryClient.setQueryData<Track[]>(
        trackKeys.list(newTrack.projectId),
        (old) => {
          return old ? [...old, newTrack] : [newTrack];
        }
      );
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
      // Update the list cache
      queryClient.setQueryData<Track[]>(
        trackKeys.list(updatedTrack.projectId),
        (old) => {
          return old
            ? old.map((t) => (t.id === updatedTrack.id ? updatedTrack : t))
            : [updatedTrack];
        }
      );
      // Update the detail cache
      queryClient.setQueryData(
        trackKeys.detail(updatedTrack.id),
        updatedTrack
      );
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
    }: {
      file: File;
      trackName: string;
      projectId: string;
      notes?: string;
    }) => {
      // Step 1: Get presigned URL
      const { uploadUrl, objectUrl } = await getPresignedUrl({
        fileName: file.name,
        fileType: file.type,
        projectId,
      });

      // Step 2: Upload file to MinIO
      await uploadFile(file, uploadUrl);

      // Step 3: Create track record in database with initial version
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
    onSuccess: (_, { trackId }) => {
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
    }: {
      file: File;
      trackId: string;
      projectId: string;
      notes?: string;
    }) => {
      // Step 1: Get presigned URL
      const { uploadUrl, objectUrl } = await getPresignedUrl({
        fileName: file.name,
        fileType: file.type,
        projectId,
      });

      // Step 2: Upload file to MinIO
      await uploadFile(file, uploadUrl);

      // Step 3: Create version record in database
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

