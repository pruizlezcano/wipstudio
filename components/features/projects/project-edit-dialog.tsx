"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextareaAutosize } from "@/components/ui/textarea";
import { useUpdateProject } from "@/hooks/use-projects";
import type { Project } from "@/types";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ProjectArtworkField } from "@/components/features/projects/project-artwork-field";
import { prepareProjectArtwork } from "@/lib/project-artwork";
import { ProjectDeleteDialog } from "./project-delete-dialog";

interface ProjectEditDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

interface ProjectEditDialogFormProps {
  project: Project;
  onOpenChange: (open: boolean) => void;
  onDeleteProject: () => void;
}

function ProjectEditDialogForm({
  project,
  onOpenChange,
  onDeleteProject,
}: ProjectEditDialogFormProps) {
  const updateProject = useUpdateProject();
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
  });
  const [artwork, setArtwork] = useState<string | null>(project.artwork);
  const [artworkDominantColor, setArtworkDominantColor] = useState<
    string | null
  >(project.artworkDominantColor);

  const handleArtworkSelected = async (file: File) => {
    try {
      const preparedArtwork = await prepareProjectArtwork(file);
      setArtwork(preparedArtwork.artwork);
      setArtworkDominantColor(preparedArtwork.artworkDominantColor);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process artwork."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    updateProject.mutate(
      {
        id: project.id,
        data: {
          ...formData,
          artwork,
          artworkDominantColor,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogDescription>Update your project details.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="edit-name">Project Name</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="MY AWESOME TRACK"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="edit-description">Description</Label>
          <TextareaAutosize
            className="resize-none"
            id="edit-description"
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
            placeholder="Describe your project..."
            minRows={1}
            maxRows={8}
          />
        </div>
        <ProjectArtworkField
          artwork={artwork}
          artworkDominantColor={artworkDominantColor}
          onFileSelected={handleArtworkSelected}
          onRemove={() => {
            setArtwork(null);
            setArtworkDominantColor(null);
          }}
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="destructive"
          onClick={onDeleteProject}
          disabled={updateProject.isPending}
          className="mr-auto"
        >
          Delete Project
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={updateProject.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={updateProject.isPending}>
          {updateProject.isPending ? (
            <>
              <LoadingSpinner size="xs" />
              Updating...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProjectEditDialog({
  project,
  open,
  onOpenChange,
  onDeleted,
}: ProjectEditDialogProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          {project ? (
            <ProjectEditDialogForm
              key={project.id}
              project={project}
              onOpenChange={onOpenChange}
              onDeleteProject={() => setIsDeleteDialogOpen(true)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ProjectDeleteDialog
        project={project}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleted={onDeleted}
      />
    </>
  );
}
