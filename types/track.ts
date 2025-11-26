export interface Track {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
}

export interface TrackVersion {
  id: string;
  trackId: string;
  versionNumber: number;
  audioUrl: string;
  notes: string | null;
  isMaster: boolean;
  createdAt: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  objectUrl: string;
}

export interface MultipartUploadResponse {
  uploadId: string;
  objectUrl: string;
}

export interface ChunkUrlsResponse {
  chunkUrls: Array<{ partNumber: number; url: string }>;
}
