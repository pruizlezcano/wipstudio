import { PaginationInfo } from "./pagination";
import { Collaborator } from "./collaborator";

export interface Track {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
  lastVersionAt: string | null;
  defaultVersion?: {
    id: string;
    versionNumber: number;
    audioUrl: string;
    isMaster: boolean;
    uploadedBy?: Collaborator;
  } | null;
}

export interface TrackVersion {
  id: string;
  trackId: string;
  versionNumber: number;
  audioUrl: string;
  notes: string | null;
  isMaster: boolean;
  createdAt: string;
  uploadedBy?: Collaborator;
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
