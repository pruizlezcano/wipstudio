import { PaginationInfo } from "./pagination";
import { Member } from "./member";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  lastVersionAt: string | null;
  members: Member[];
  isOwner?: boolean;
}

export interface PaginatedProjectsResponse {
  data: Project[];
  pagination: PaginationInfo;
}
