"use client";

import { useState, useEffect } from "react";
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

interface TrackEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  currentName: string;
}

export function TrackEditDialog({
  open,
  onOpenChange,
  trackId,
  currentName,
}: TrackEditDialogProps) {
  const [name, setName] = useState(currentName);
  const updateTrack = useUpdateTrack();

  // Update name when dialog opens with new track
  useEffect(() => {
    if (open) {
      setName(currentName);
    }
  }, [open, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateTrack.mutateAsync({
      id: trackId,
      data: { name },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
              required
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
