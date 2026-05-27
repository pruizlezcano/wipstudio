"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useCreateProject } from "@/hooks/use-projects";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ProjectArtworkField } from "@/components/features/projects/project-artwork-field";
import { prepareProjectArtwork } from "@/lib/project-artwork";

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
}: ProjectCreateDialogProps) {
  const router = useRouter();
  const createProject = useCreateProject();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [artwork, setArtwork] = useState<string | null>(null);
  const [artworkDominantColor, setArtworkDominantColor] = useState<
    string | null
  >(null);

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setArtwork(null);
    setArtworkDominantColor(null);
  };

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
    createProject.mutate(
      {
        ...formData,
        artwork,
        artworkDominantColor,
      },
      {
        onSuccess: (project) => {
          resetForm();
          onOpenChange(false);
          router.push(`/projects/${project.id}`);
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && !createProject.isPending) {
          resetForm();
        }
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new audio collaboration project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="MY AWESOME TRACK"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <TextareaAutosize
                className="resize-none"
                id="description"
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
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createProject.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? (
                <>
                  <LoadingSpinner size="xs" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
