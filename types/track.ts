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

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedTracksResponse {
  data: Track[];
  pagination: PaginationInfo;
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
