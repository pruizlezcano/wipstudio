"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  preSelectedFile?: File | null;
}

export function TrackUploadDialog({
  open,
  onOpenChange,
  projectId,
  preSelectedFile,
}: TrackUploadDialogProps) {
  const router = useRouter();
  const [trackName, setTrackName] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTrack = useUploadTrack();

  // Handle pre-selected file from drag and drop
  useEffect(() => {
    if (open && preSelectedFile) {
      setAudioFile(preSelectedFile);
      // Auto-fill track name from filename if empty
      if (!trackName) {
        const nameWithoutExt = preSelectedFile.name.replace(/\.[^/.]+$/, "");
        setTrackName(nameWithoutExt);
      }
    }
  }, [preSelectedFile, trackName, open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTrackName("");
      setAudioFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

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

  const handleChangeFile = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !trackName.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const createdTrack = await uploadTrack.mutateAsync({
        file: audioFile,
        trackName: trackName,
        projectId,
        onProgress: (loaded: number, total: number) => {
          setUploadProgress(Math.round((loaded / total) * 100));
        },
      });
      // Navigate to the newly created track
      router.push(`/projects/${projectId}/tracks/${createdTrack.id}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>Upload New Track</DialogTitle>
          <DialogDescription>Add a new track to this project</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-hidden">
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
          <div className="overflow-hidden">
            <Label htmlFor="audio-file">Audio File</Label>
            <input
              id="audio-file"
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {audioFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 p-3 border rounded-md bg-muted/50 min-w-0">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {audioFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleChangeFile}
                    disabled={isUploading}
                    className="shrink-0"
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleChangeFile}
                className="w-full"
              >
                Select Audio File
              </Button>
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
