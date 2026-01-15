import { PaginationInfo } from "./pagination";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lastVersionAt: string | null;
}

export interface PaginatedProjectsResponse {
  data: Project[];
  pagination: PaginationInfo;
}
