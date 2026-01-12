"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import {
  useProjects,
  type ProjectSortBy,
  type SortOrder,
} from "@/hooks/use-projects";
import type { Project } from "@/types";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { PageHeader } from "@/components/common/page-header";
import { ProjectList } from "@/components/features/projects/project-list";
import { ProjectEmptyState } from "@/components/features/projects/project-empty-state";
import { ProjectCreateDialog } from "@/components/features/projects/project-create-dialog";
import { ProjectEditDialog } from "@/components/features/projects/project-edit-dialog";
import { ProjectDeleteDialog } from "@/components/features/projects/project-delete-dialog";

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name (A-Z)" },
  { value: "name:desc", label: "Name (Z-A)" },
  { value: "updatedAt:desc", label: "Recently updated" },
] as const;

const PROJECTS_PER_PAGE = 20;

export default function ProjectsPage() {
  const [sortValue, setSortValue] = useState("createdAt:desc");
  const [sortBy, sortOrder] = sortValue.split(":") as [
    ProjectSortBy,
    SortOrder,
  ];
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data: projectsData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProjects({
    sortBy,
    sortOrder,
    limit: PROJECTS_PER_PAGE,
  });

  const projects = projectsData?.pages.flatMap((page) => page.data) ?? [];

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-12 max-w-6xl px-6 min-h-screen">
      <PageHeader
        title="PROJECTS"
        subtitle="AUDIO COLLABORATION WORKSPACE"
        action={
          <div className="flex items-center gap-3">
            <Select value={sortValue} onValueChange={setSortValue}>
              <SelectTrigger
                size="sm"
                className="w-[180px] py-5 border-foreground"
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        }
      />

      {!projects || projects.length === 0 ? (
        <ProjectEmptyState onCreate={() => setIsCreateDialogOpen(true)} />
      ) : (
        <>
          <ProjectList
            projects={projects}
            onEdit={setEditingProject}
            onDelete={setDeletingProject}
          />
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isFetchingNextPage && <LoadingSpinner />}
          </div>
        </>
      )}

      <ProjectCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <ProjectEditDialog
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
      />

      <ProjectDeleteDialog
        project={deletingProject}
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      />
    </div>
  );
}
