"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import WaveSurfer from "wavesurfer.js";
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
import {
  useTrack,
  useUpdateTrack,
  useDeleteTrack,
  useVersions,
  useUploadVersion,
  useUpdateVersion,
  useDeleteVersion,
} from "@/lib/hooks/use-tracks";

// Waveform component using WaveSurfer.js
function Waveform({ audioUrl }: { audioUrl: string }) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#93c5fd",
      progressColor: "#3b82f6",
      cursorColor: "#1e40af",
      barWidth: 2,
      barGap: 1,
      barRadius: 3,
      height: 120,
      normalize: true,
      backend: "WebAudio",
    });

    wavesurferRef.current = wavesurfer;

    // Load audio
    wavesurfer.load(audioUrl);

    // Event listeners
    wavesurfer.on("ready", () => {
      setIsLoading(false);
      setDuration(wavesurfer.getDuration());
    });

    wavesurfer.on("play", () => {
      setIsPlaying(true);
    });

    wavesurfer.on("pause", () => {
      setIsPlaying(false);
    });

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
    });

    wavesurfer.on("error", (error) => {
      console.error("WaveSurfer error:", error);
      setIsLoading(false);
    });

    // Cleanup
    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <div 
        ref={waveformRef} 
        className="border rounded-lg overflow-hidden bg-slate-50"
      />
      {isLoading && (
        <div className="text-sm text-muted-foreground text-center">
          Loading waveform...
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button
          onClick={handlePlayPause}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>
        {!isLoading && duration > 0 && (
          <span className="text-sm text-muted-foreground">
            Duration: {formatTime(duration)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TrackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trackId = params.trackId as string;
  const projectId = params.id as string;

  const { data: track, isLoading: trackLoading } = useTrack(trackId);
  const { data: versions, isLoading: versionsLoading } = useVersions(trackId);
  const updateTrack = useUpdateTrack();
  const deleteTrack = useDeleteTrack();
  const uploadVersion = useUploadVersion();
  const updateVersion = useUpdateVersion();
  const deleteVersion = useDeleteVersion();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState("");
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const versionFileInputRef = useRef<HTMLInputElement>(null);

  const [editingVersion, setEditingVersion] = useState<{
    versionId: string;
    notes: string;
  } | null>(null);
  const [isEditVersionDialogOpen, setIsEditVersionDialogOpen] = useState(false);

  const handleEditTrack = () => {
    if (track) {
      setEditedName(track.name);
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!track) return;

    await updateTrack.mutateAsync({
      id: track.id,
      data: { name: editedName },
    });
    setIsEditDialogOpen(false);
  };

  const handleDeleteTrack = async () => {
    if (!track) return;
    await deleteTrack.mutateAsync(track.id);
    router.push(`/projects/${projectId}`);
  };

  const handleVersionFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVersionFile(file);
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
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
      setIsUploadDialogOpen(false);
      setVersionFile(null);
      setVersionNotes("");
      if (versionFileInputRef.current) {
        versionFileInputRef.current.value = "";
      }
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const handleEditVersion = (versionId: string, currentNotes: string | null) => {
    setEditingVersion({
      versionId,
      notes: currentNotes || "",
    });
    setIsEditVersionDialogOpen(true);
  };

  const handleUpdateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVersion) return;

    await updateVersion.mutateAsync({
      trackId,
      versionId: editingVersion.versionId,
      notes: editingVersion.notes,
    });
    setIsEditVersionDialogOpen(false);
    setEditingVersion(null);
  };

  const handleDeleteVersion = async (versionId: string) => {
    await deleteVersion.mutateAsync({ trackId, versionId });
  };

  if (trackLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading track...</p>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Track not found</p>
        <Button onClick={() => router.push(`/projects/${projectId}`)} className="mt-4">
          Back to Project
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}`)}
          className="mb-4"
        >
          ← Back to Project
        </Button>

        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{track.name}</h1>
            <p className="text-muted-foreground">
              Created {new Date(track.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditTrack}>
              Rename
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Track</Button>
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
                  <AlertDialogAction onClick={handleDeleteTrack}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {track.latestVersion ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Latest Version (v{track.latestVersion.versionNumber})</CardTitle>
              <CardDescription>
                Uploaded {new Date(track.latestVersion.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {track.latestVersion.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes:</p>
                  <p className="text-sm text-muted-foreground">
                    {track.latestVersion.notes}
                  </p>
                </div>
              )}
              
              <Waveform audioUrl={track.latestVersion.audioUrl} />
            </CardContent>
          </Card>

          {/* Version History */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
                All Versions ({versions?.length || 0})
              </h2>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                + New Version
              </Button>
            </div>

            {versionsLoading ? (
              <p>Loading versions...</p>
            ) : versions && versions.length > 0 ? (
              <div className="space-y-4">
                {versions.map((version) => (
                  <Card key={version.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Version {version.versionNumber}
                          </CardTitle>
                          <CardDescription>
                            {new Date(version.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleEditVersion(version.id, version.notes)
                            }
                          >
                            Edit Notes
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Version</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete version{" "}
                                  {version.versionNumber}? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteVersion(version.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {version.notes && (
                        <p className="text-sm text-muted-foreground">
                          {version.notes}
                        </p>
                      )}
                      <audio controls className="w-full">
                        <source src={version.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No versions found</p>
            )}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No versions available</p>
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
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
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

      {/* Upload Version Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Version</DialogTitle>
            <DialogDescription>
              Upload a new version of this track
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadVersion} className="space-y-4">
            <div>
              <Label htmlFor="version-file">Audio File</Label>
              <Input
                id="version-file"
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
              <Label htmlFor="version-notes">Notes (Optional)</Label>
              <Textarea
                id="version-notes"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder="What changed in this version..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
                disabled={isUploadingVersion}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploadingVersion || !versionFile}
              >
                {isUploadingVersion ? "Uploading..." : "Upload"}
              </Button>
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
