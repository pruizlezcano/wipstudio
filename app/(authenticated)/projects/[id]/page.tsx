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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProject } from "@/lib/hooks/use-projects";
import { useTracks, useUploadTrack, type Track } from "@/lib/hooks/use-tracks";

// Simple TrackCard component for grid view
function TrackCard({ track, projectId }: { track: Track; projectId: string }) {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/projects/${projectId}/tracks/${track.id}`)}
    >
      <CardHeader>
        <CardTitle>{track.name}</CardTitle>
        <CardDescription>
          Created {new Date(track.createdAt).toLocaleDateString()}
          {track.latestVersion && (
            <span className="ml-2">
              • Version {track.latestVersion.versionNumber}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      {track.latestVersion?.notes && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {track.latestVersion.notes}
          </p>
        </CardContent>
      )}
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

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState("");
  const [trackNotes, setTrackNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
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
                <Button type="submit" disabled={isUploading || !selectedFile}>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} projectId={projectId} />
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
    </div>
  );
}
