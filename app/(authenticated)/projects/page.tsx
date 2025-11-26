"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import type { Project } from "@/types";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { PageHeader } from "@/components/common/page-header";
import { ProjectList } from "@/components/features/projects/project-list";
import { ProjectEmptyState } from "@/components/features/projects/project-empty-state";
import { ProjectCreateDialog } from "@/components/features/projects/project-create-dialog";
import { ProjectEditDialog } from "@/components/features/projects/project-edit-dialog";
import { ProjectDeleteDialog } from "@/components/features/projects/project-delete-dialog";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-12 max-w-6xl px-6 min-h-screen">
      <PageHeader
        title="PROJECTS"
        subtitle="AUDIO COLLABORATION WORKSPACE"
        action={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        }
      />

      {!projects || projects.length === 0 ? (
        <ProjectEmptyState onCreate={() => setIsCreateDialogOpen(true)} />
      ) : (
        <ProjectList
          projects={projects}
          onEdit={setEditingProject}
          onDelete={setDeletingProject}
        />
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
