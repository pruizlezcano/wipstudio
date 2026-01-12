import { PaginationInfo } from "./pagination";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProjectsResponse {
  data: Project[];
  pagination: PaginationInfo;
}
