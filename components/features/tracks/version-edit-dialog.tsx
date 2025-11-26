"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TextareaAutosize } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateVersion } from "@/hooks/use-tracks";

interface VersionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  versionId: string | null;
  currentNotes: string | null;
}

export function VersionEditDialog({
  open,
  onOpenChange,
  trackId,
  versionId,
  currentNotes,
}: VersionEditDialogProps) {
  const [notes, setNotes] = useState(currentNotes || "");
  const updateVersion = useUpdateVersion();

  // Update notes when dialog opens with new version
  useEffect(() => {
    if (open && currentNotes !== null) {
      setNotes(currentNotes || "");
    }
  }, [open, currentNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionId) return;

    await updateVersion.mutateAsync({
      trackId,
      versionId,
      notes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Version Notes</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="editVersionNotes">Notes</Label>
            <TextareaAutosize
              className="resize-none"
              id="editVersionNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter version notes"
              minRows={1}
              maxRows={10}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
