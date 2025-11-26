"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadTrack } from "@/hooks/use-tracks";

interface TrackUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function TrackUploadDialog({
  open,
  onOpenChange,
  projectId,
}: TrackUploadDialogProps) {
  const [trackName, setTrackName] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTrack = useUploadTrack();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      // Auto-fill track name from filename if empty
      if (!trackName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setTrackName(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !trackName.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      await uploadTrack.mutateAsync({
        file: audioFile,
        trackName: trackName,
        projectId,
        onProgress: (loaded: number, total: number) => {
          setUploadProgress(Math.round((loaded / total) * 100));
        },
      });
      onOpenChange(false);
      setTrackName("");
      setAudioFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload New Track</DialogTitle>
          <DialogDescription>
            Add a new track to this project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="track-name">Track Name</Label>
            <Input
              id="track-name"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="Enter track name"
              required
            />
          </div>
          <div>
            <Label htmlFor="audio-file">Audio File</Label>
            <Input
              id="audio-file"
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              required
            />
            {audioFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {audioFile.name} (
                {(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-full" />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !audioFile}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
