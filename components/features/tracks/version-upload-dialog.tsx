"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { TextareaAutosize } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadVersion } from "@/hooks/use-tracks";

interface VersionUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  projectId: string;
}

export function VersionUploadDialog({
  open,
  onOpenChange,
  trackId,
  projectId,
}: VersionUploadDialogProps) {
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState("");
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [versionUploadProgress, setVersionUploadProgress] = useState(0);
  const versionFileInputRef = useRef<HTMLInputElement>(null);
  const uploadVersion = useUploadVersion();

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
    setVersionUploadProgress(0);
    try {
      await uploadVersion.mutateAsync({
        file: versionFile,
        trackId,
        projectId,
        notes: versionNotes || undefined,
        onProgress: (loaded: number, total: number) => {
          setVersionUploadProgress(Math.round((loaded / total) * 100));
        },
      });
      onOpenChange(false);
      setVersionFile(null);
      setVersionNotes("");
      setVersionUploadProgress(0);
      if (versionFileInputRef.current) {
        versionFileInputRef.current.value = "";
      }
    } finally {
      setIsUploadingVersion(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <TextareaAutosize
              id="version-notes"
              className="resize-none"
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              placeholder="What changed in this version..."
              minRows={1}
              maxRows={8}
            />
          </div>
          {isUploadingVersion && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Uploading...</span>
                <span>{versionUploadProgress}%</span>
              </div>
              <Progress value={versionUploadProgress} className="h-full" />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploadingVersion}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploadingVersion || !versionFile}>
              {isUploadingVersion ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
