"use client";

import { useRouter } from "next/navigation";
import type { Track } from "@/types";

interface TrackListItemProps {
  track: Track;
  projectId: string;
}

export function TrackListItem({ track, projectId }: TrackListItemProps) {
  const router = useRouter();

  return (
    <div
      className="border border-border bg-card hover:border-foreground transition-colors cursor-pointer flex items-center justify-between p-4 gap-4"
      onClick={() => router.push(`/projects/${projectId}/tracks/${track.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <h3 className="text-sm font-bold uppercase tracking-tight truncate">
            {track.name}
          </h3>
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            {track.versionCount} versions
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-xs font-mono text-muted-foreground">
          {new Date(
            track.lastVersionAt ?? track.createdAt
          ).toLocaleDateString()}
        </span>
        <div className="text-xs font-bold uppercase tracking-tight">VIEW →</div>
      </div>
    </div>
  );
}
