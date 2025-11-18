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
import { Textarea } from "@/components/ui/textarea";
import { useProject } from "@/lib/hooks/use-projects";
import {
  useTracks,
  useUploadTrack,
  useUpdateTrack,
  useDeleteTrack,
  useVersions,
  useUploadVersion,
  useUpdateVersion,
  useDeleteVersion,
  type Track,
} from "@/lib/hooks/use-tracks";

// TrackCard component
function TrackCard({
  track,
  projectId,
  expandedTrackId,
  setExpandedTrackId,
  uploadingVersionFor,
  setUploadingVersionFor,
  versionFile,
  versionNotes,
  setVersionNotes,
  isUploadingVersion,
  versionFileInputRef,
  handleVersionFileSelect,
  handleUploadVersion,
  handleEditTrack,
  handleDeleteTrack,
  handleEditVersion,
  handleDeleteVersion,
}: {
  track: Track;
  projectId: string;
  expandedTrackId: string | null;
  setExpandedTrackId: (id: string | null) => void;
  uploadingVersionFor: string | null;
  setUploadingVersionFor: (id: string | null) => void;
  versionFile: File | null;
  versionNotes: string;
  setVersionNotes: (notes: string) => void;
  isUploadingVersion: boolean;
  versionFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleVersionFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUploadVersion: (e: React.FormEvent, trackId: string) => void;
  handleEditTrack: (trackId: string, currentName: string) => void;
  handleDeleteTrack: (trackId: string) => void;
  handleEditVersion: (
    trackId: string,
    versionId: string,
    currentNotes: string | null
  ) => void;
  handleDeleteVersion: (trackId: string, versionId: string) => void;
}) {
  const { data: versions, isLoading: versionsLoading } = useVersions(track.id);
  const isExpanded = expandedTrackId === track.id;

  return (
    <Card>
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
                    Are you sure you want to delete &quot;{track.name}&quot;?
                    This action cannot be undone and will delete all versions
                    and audio files.
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
          Created {new Date(track.createdAt).toLocaleDateString()}
          {track.latestVersion && (
            <span className="ml-2">
              • Version {track.latestVersion.versionNumber}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {track.latestVersion ? (
          <>
            {track.latestVersion.notes && (
              <p className="text-sm text-muted-foreground mb-3">
                {track.latestVersion.notes}
              </p>
            )}
            <audio controls className="w-full">
              <source src={track.latestVersion.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>

            {/* Version Management Section */}
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExpandedTrackId(isExpanded ? null : track.id)
                  }
                >
                  {isExpanded ? "▼" : "▶"} All Versions (
                  {versions?.length || 0})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadingVersionFor(track.id)}
                >
                  + New Version
                </Button>
              </div>

              {/* Upload new version form */}
              {uploadingVersionFor === track.id && (
                <form
                  onSubmit={(e) => handleUploadVersion(e, track.id)}
                  className="mb-4 p-4 border rounded-md space-y-3"
                >
                  <div>
                    <Label htmlFor={`version-file-${track.id}`}>
                      Audio File
                    </Label>
                    <Input
                      id={`version-file-${track.id}`}
                      ref={versionFileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleVersionFileSelect}
                      required
                    />
                    {versionFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {versionFile.name} (
                        {(versionFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`version-notes-${track.id}`}>
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id={`version-notes-${track.id}`}
                      value={versionNotes}
                      onChange={(e) => setVersionNotes(e.target.value)}
                      placeholder="What changed in this version..."
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadingVersionFor(null)}
                      disabled={isUploadingVersion}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isUploadingVersion || !versionFile}
                    >
                      {isUploadingVersion ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Versions list */}
              {isExpanded && (
                <div className="mt-2 space-y-2">
                  {versionsLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading versions...
                    </p>
                  ) : versions && versions.length > 0 ? (
                    versions.map((version) => (
                      <div
                        key={version.id}
                        className="p-3 border rounded-md space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              Version {version.versionNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(version.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleEditVersion(
                                  track.id,
                                  version.id,
                                  version.notes
                                )
                              }
                            >
                              Edit Notes
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Version
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete version{" "}
                                    {version.versionNumber}? This action cannot
                                    be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteVersion(track.id, version.id)
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        {version.notes && (
                          <p className="text-sm text-muted-foreground">
                            {version.notes}
                          </p>
                        )}
                        <audio controls className="w-full">
                          <source src={version.audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No versions found
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No versions available</p>
        )}
      </CardContent>
    </Card>
  );
}


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
  const [trackNotes, setTrackNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingTrack, setEditingTrack] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
  const [uploadingVersionFor, setUploadingVersionFor] = useState<string | null>(
    null
  );
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState("");
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const versionFileInputRef = useRef<HTMLInputElement>(null);

  const [editingVersion, setEditingVersion] = useState<{
    trackId: string;
    versionId: string;
    notes: string;
  } | null>(null);
  const [isEditVersionDialogOpen, setIsEditVersionDialogOpen] = useState(false);

  const uploadVersion = useUploadVersion();
  const updateVersion = useUpdateVersion();
  const deleteVersion = useDeleteVersion();

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
        notes: trackNotes || undefined,
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setTrackName("");
      setTrackNotes("");
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

  const handleVersionFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVersionFile(file);
    }
  };

  const handleUploadVersion = async (e: React.FormEvent, trackId: string) => {
    e.preventDefault();
    if (!versionFile) return;

    setIsUploadingVersion(true);
    try {
      await uploadVersion.mutateAsync({
        file: versionFile,
        trackId,
        projectId,
        notes: versionNotes || undefined,
      });
      setUploadingVersionFor(null);
      setVersionFile(null);
      setVersionNotes("");
      if (versionFileInputRef.current) {
        versionFileInputRef.current.value = "";
      }
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const handleEditVersion = (
    trackId: string,
    versionId: string,
    currentNotes: string | null
  ) => {
    setEditingVersion({
      trackId,
      versionId,
      notes: currentNotes || "",
    });
    setIsEditVersionDialogOpen(true);
  };

  const handleUpdateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVersion) return;

    await updateVersion.mutateAsync({
      trackId: editingVersion.trackId,
      versionId: editingVersion.versionId,
      notes: editingVersion.notes,
    });
    setIsEditVersionDialogOpen(false);
    setEditingVersion(null);
  };

  const handleDeleteVersion = async (trackId: string, versionId: string) => {
    await deleteVersion.mutateAsync({ trackId, versionId });
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
                  <div>
                    <Label htmlFor="trackNotes">Notes (Optional)</Label>
                    <Textarea
                      id="trackNotes"
                      value={trackNotes}
                      onChange={(e) => setTrackNotes(e.target.value)}
                      placeholder="Add notes about this initial version..."
                      rows={3}
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
                <TrackCard
                  key={track.id}
                  track={track}
                  projectId={projectId}
                  expandedTrackId={expandedTrackId}
                  setExpandedTrackId={setExpandedTrackId}
                  uploadingVersionFor={uploadingVersionFor}
                  setUploadingVersionFor={setUploadingVersionFor}
                  versionFile={versionFile}
                  versionNotes={versionNotes}
                  setVersionNotes={setVersionNotes}
                  isUploadingVersion={isUploadingVersion}
                  versionFileInputRef={versionFileInputRef}
                  handleVersionFileSelect={handleVersionFileSelect}
                  handleUploadVersion={handleUploadVersion}
                  handleEditTrack={handleEditTrack}
                  handleDeleteTrack={handleDeleteTrack}
                  handleEditVersion={handleEditVersion}
                  handleDeleteVersion={handleDeleteVersion}
                />
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

          {/* Edit Version Dialog */}
          <Dialog
            open={isEditVersionDialogOpen}
            onOpenChange={setIsEditVersionDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Version Notes</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateVersion} className="space-y-4">
                <div>
                  <Label htmlFor="editVersionNotes">Notes</Label>
                  <Textarea
                    id="editVersionNotes"
                    value={editingVersion?.notes || ""}
                    onChange={(e) =>
                      setEditingVersion(
                        editingVersion
                          ? { ...editingVersion, notes: e.target.value }
                          : null
                      )
                    }
                    placeholder="Enter version notes"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditVersionDialogOpen(false)}
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
