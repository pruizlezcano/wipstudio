"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateTrack } from "@/hooks/use-tracks";
import { MAX_TRACK_NAME_LENGTH } from "@/lib/validations/track";

interface TrackEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  currentName: string;
}

interface TrackEditDialogFormProps {
  trackId: string;
  currentName: string;
  onOpenChange: (open: boolean) => void;
}

function TrackEditDialogForm({
  trackId,
  currentName,
  onOpenChange,
}: TrackEditDialogFormProps) {
  const [name, setName] = useState(currentName);
  const updateTrack = useUpdateTrack();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateTrack.mutateAsync({
      id: trackId,
      data: { name },
    });
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Rename Track</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="editTrackName">Track Name</Label>
          <Input
            id="editTrackName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter track name"
            maxLength={MAX_TRACK_NAME_LENGTH}
            required
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {name.length}/{MAX_TRACK_NAME_LENGTH}
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

export function TrackEditDialog({
  open,
  onOpenChange,
  trackId,
  currentName,
}: TrackEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <TrackEditDialogForm
          key={`${trackId}:${currentName}`}
          trackId={trackId}
          currentName={currentName}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
