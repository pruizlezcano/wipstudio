"use client";

import { useState, useRef, useEffect } from "react";
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
  preSelectedFile?: File | null;
}

export function VersionUploadDialog({
  open,
  onOpenChange,
  trackId,
  projectId,
  preSelectedFile,
}: VersionUploadDialogProps) {
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState("");
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  const [versionUploadProgress, setVersionUploadProgress] = useState(0);
  const versionFileInputRef = useRef<HTMLInputElement>(null);
  const uploadVersion = useUploadVersion();

  // Handle pre-selected file from drag and drop
  useEffect(() => {
    if (open && preSelectedFile) {
      setVersionFile(preSelectedFile);
    }
  }, [preSelectedFile, open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setVersionFile(null);
      setVersionNotes("");
      setVersionUploadProgress(0);
      if (versionFileInputRef.current) {
        versionFileInputRef.current.value = "";
      }
    }
  }, [open]);

  const handleVersionFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVersionFile(file);
    }
  };

  const handleChangeFile = () => {
    versionFileInputRef.current?.click();
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
    } finally {
      setIsUploadingVersion(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>Upload New Version</DialogTitle>
          <DialogDescription>
            Upload a new version of this track
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleUploadVersion}
          className="space-y-4 overflow-hidden"
        >
          <div className="overflow-hidden">
            <Label htmlFor="version-file">Audio File</Label>
            <input
              id="version-file"
              ref={versionFileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleVersionFileSelect}
              className="hidden"
            />
            {versionFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 p-3 border rounded-md bg-muted/50 min-w-0">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {versionFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(versionFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleChangeFile}
                    disabled={isUploadingVersion}
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
