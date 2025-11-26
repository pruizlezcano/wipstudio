import { TrackListItem } from "./track-list-item";
import type { Track } from "@/types";

interface TrackListProps {
  tracks: Track[];
  projectId: string;
}

export function TrackList({ tracks, projectId }: TrackListProps) {
  return (
    <div className="flex flex-col gap-2">
      {tracks.map((track) => (
        <TrackListItem key={track.id} track={track} projectId={projectId} />
      ))}
    </div>
  );
}
