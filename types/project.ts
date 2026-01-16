import { PaginationInfo } from "./pagination";
import { Collaborator } from "./collaborator";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  lastVersionAt: string | null;
  owner: Collaborator;
  collaborators?: Collaborator[];
}

export interface PaginatedProjectsResponse {
  data: Project[];
  pagination: PaginationInfo;
}
