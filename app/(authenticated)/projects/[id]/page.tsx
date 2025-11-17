"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProject } from "@/lib/hooks/use-projects";
import {
  useTracks,
  useUploadTrack,
  useUpdateTrack,
  useDeleteTrack,
} from "@/lib/hooks/use-tracks";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tracks, isLoading: tracksLoading } = useTracks(projectId);
  const uploadTrack = useUploadTrack();
  const updateTrack = useUpdateTrack();
  const deleteTrack = useDeleteTrack();

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingTrack, setEditingTrack] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill track name from file name
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTrackName(nameWithoutExt);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !trackName) return;

    setIsUploading(true);
    try {
      await uploadTrack.mutateAsync({
        file: selectedFile,
        trackName,
        projectId,
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setTrackName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditTrack = (trackId: string, currentName: string) => {
    setEditingTrack({ id: trackId, name: currentName });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;

    await updateTrack.mutateAsync({
      id: editingTrack.id,
      data: { name: editingTrack.name },
    });
    setIsEditDialogOpen(false);
    setEditingTrack(null);
  };

  const handleDeleteTrack = async (trackId: string) => {
    await deleteTrack.mutateAsync(trackId);
  };

  if (projectLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Project not found</p>
        <Button onClick={() => router.push("/projects")} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push("/projects")}
              className="mb-4"
            >
              ← Back to Projects
            </Button>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Tracks</h2>
            <Dialog
              open={isUploadDialogOpen}
              onOpenChange={setIsUploadDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>Upload Track</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Track</DialogTitle>
                  <DialogDescription>
                    Upload an audio file to add to this project
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="file">Audio File</Label>
                    <Input
                      id="file"
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileSelect}
                      required
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {selectedFile.name} (
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="trackName">Track Name</Label>
                    <Input
                      id="trackName"
                      value={trackName}
                      onChange={(e) => setTrackName(e.target.value)}
                      placeholder="Enter track name"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsUploadDialogOpen(false)}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUploading || !selectedFile}
                    >
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {tracksLoading ? (
            <p>Loading tracks...</p>
          ) : tracks && tracks.length > 0 ? (
            <div className="grid gap-4">
              {tracks.map((track) => (
                <Card key={track.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{track.name}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTrack(track.id, track.name)}
                        >
                          Rename
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Track</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;
                                {track.name}
                                &quot;? This action cannot be undone and will
                                also delete the audio file.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTrack(track.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Uploaded {new Date(track.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <audio controls className="w-full">
                      <source src={track.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No tracks yet. Upload your first track to get started.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Edit Track Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Track</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateTrack} className="space-y-4">
                <div>
                  <Label htmlFor="editTrackName">Track Name</Label>
                  <Input
                    id="editTrackName"
                    value={editingTrack?.name || ""}
                    onChange={(e) =>
                      setEditingTrack(
                        editingTrack
                          ? { ...editingTrack, name: e.target.value }
                          : null
                      )
                    }
                    placeholder="Enter track name"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
  );
}
