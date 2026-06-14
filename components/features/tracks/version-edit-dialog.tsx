"use client";

import { useState } from "react";
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
import { MAX_VERSION_NOTES_LENGTH } from "@/lib/validations/track-version";

interface VersionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  versionId: string | null;
  currentNotes: string | null;
}

interface VersionEditDialogFormProps {
  trackId: string;
  versionId: string | null;
  currentNotes: string | null;
  onOpenChange: (open: boolean) => void;
}

function VersionEditDialogForm({
  trackId,
  versionId,
  currentNotes,
  onOpenChange,
}: VersionEditDialogFormProps) {
  const [notes, setNotes] = useState(currentNotes || "");
  const updateVersion = useUpdateVersion();

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
    <>
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
            maxLength={MAX_VERSION_NOTES_LENGTH}
            minRows={1}
            maxRows={10}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {notes.length}/{MAX_VERSION_NOTES_LENGTH}
          </p>
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
    </>
  );
}

export function VersionEditDialog({
  open,
  onOpenChange,
  trackId,
  versionId,
  currentNotes,
}: VersionEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <VersionEditDialogForm
          key={`${versionId ?? "new"}:${currentNotes ?? ""}`}
          trackId={trackId}
          versionId={versionId}
          currentNotes={currentNotes}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
