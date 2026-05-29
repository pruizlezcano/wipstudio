import { PaginationInfo } from "./pagination";
import { Member } from "./member";

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
    peaks?: number[][];
    duration?: number;
    isMaster: boolean;
    uploadedBy?: Member;
  } | null;
}

export interface TrackVersion {
  id: string;
  trackId: string;
  versionNumber: number;
  audioUrl: string;
  peaks?: number[][];
  duration?: number;
  notes: string | null;
  isMaster: boolean;
  createdAt: string;
  uploadedBy?: Member;
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
