import {
  useMutation,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/validations/project";
import type { Project, PaginatedProjectsResponse } from "@/types/project";

// Query keys
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (sortBy?: string, sortOrder?: string) =>
    [...projectKeys.lists(), { sortBy, sortOrder }] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// Sort options type
export type ProjectSortBy = "name" | "createdAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

export interface ProjectSortOptions {
  sortBy?: ProjectSortBy;
  sortOrder?: SortOrder;
}

export interface ProjectQueryOptions extends ProjectSortOptions {
  limit?: number;
}

// Fetch projects with pagination
async function fetchProjects(
  page: number,
  options?: ProjectQueryOptions
): Promise<PaginatedProjectsResponse> {
  const params = new URLSearchParams();
  if (options?.sortBy) params.set("sortBy", options.sortBy);
  if (options?.sortOrder) params.set("sortOrder", options.sortOrder);
  params.set("page", page.toString());
  if (options?.limit) params.set("limit", options.limit.toString());

  const queryString = params.toString();
  const url = `/api/projects?${queryString}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  return response.json();
}

// Fetch single project
async function fetchProject(id: string): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch project");
  }
  return response.json();
}

// Create project
async function createProject(data: CreateProjectInput): Promise<Project> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create project");
  }

  return response.json();
}

// Update project
async function updateProject({
  id,
  data,
}: {
  id: string;
  data: UpdateProjectInput;
}): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update project");
  }

  return response.json();
}

// Delete project
async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete project");
  }
}

// Hooks
export function useProjects(options?: ProjectQueryOptions) {
  return useInfiniteQuery({
    queryKey: projectKeys.list(options?.sortBy, options?.sortOrder),
    queryFn: ({ pageParam }) => fetchProjects(pageParam, options),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    refetchOnWindowFocus: true,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProject(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
    structuralSharing: true,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      // Invalidate all project list queries to refetch with current sort order
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      toast.success("Project created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (updatedProject) => {
      // Invalidate all project list queries
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // Update the detail cache
      queryClient.setQueryData(
        projectKeys.detail(updatedProject.id),
        updatedProject
      );
      toast.success("Project updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, deletedId) => {
      // Invalidate all project list queries
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // Remove detail cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });
      toast.success("Project deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
