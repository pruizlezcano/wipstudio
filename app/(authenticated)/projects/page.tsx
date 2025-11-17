"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus, Music, Loader2 } from "lucide-react";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  type Project,
} from "@/lib/hooks/use-projects";

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate(formData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setFormData({ name: "", description: "" });
      },
    });
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    updateProject.mutate(
      { id: selectedProject.id, data: formData },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedProject(null);
          setFormData({ name: "", description: "" });
        },
      }
    );
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    deleteProject.mutate(selectedProject.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedProject(null);
      },
    });
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-muted-foreground">
                Manage your audio collaboration projects
              </p>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateProject}>
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
                        placeholder="My Awesome Track"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your project..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={createProject.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProject.isPending}>
                      {createProject.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          </div>

          {!projects || projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Music className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  No projects yet. Create your first audio collaboration
                  project!
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="line-clamp-1">{project.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(project)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(project)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        View Tracks
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <form onSubmit={handleUpdateProject}>
                <DialogHeader>
                  <DialogTitle>Edit Project</DialogTitle>
                  <DialogDescription>
                    Update your project details.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Project Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="My Awesome Track"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe your project..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedProject(null);
                      setFormData({ name: "", description: "" });
                    }}
                    disabled={updateProject.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateProject.isPending}>
                    {updateProject.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Project"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the project &quot;
                  {selectedProject?.name}
                  &quot;. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedProject(null);
                  }}
                  disabled={deleteProject.isPending}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProject}
                  disabled={deleteProject.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteProject.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
  );
}
