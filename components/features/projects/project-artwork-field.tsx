"use client";

import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createProjectTint } from "@/lib/project-artwork";

interface ProjectArtworkFieldProps {
  artwork: string | null;
  artworkDominantColor: string | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}

export function ProjectArtworkField({
  artwork,
  artworkDominantColor,
  onFileSelected,
  onRemove,
}: ProjectArtworkFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="project-artwork">Artwork</Label>
      <input
        id="project-artwork"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelected(file);
          }
          event.target.value = "";
        }}
      />
      <label
        htmlFor="project-artwork"
        className="block cursor-pointer overflow-hidden border border-border bg-card"
        style={createProjectTint(artworkDominantColor, 1.2)}
      >
        {artwork ? (
          <div className="flex items-center justify-between p-3">
            <Image
              src={artwork}
              alt="Project artwork preview"
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 border border-border object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="shrink-0"
              onClick={(event) => {
                event.preventDefault();
                onRemove();
              }}
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-14 w-14 items-center justify-center border border-dashed border-border bg-background/60">
              <ImagePlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-tight">
                Add project artwork
              </p>
            </div>
          </div>
        )}
      </label>
    </div>
  );
}
