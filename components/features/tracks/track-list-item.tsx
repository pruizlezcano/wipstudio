import Link from "next/link";
import { PlayIcon, PauseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/playerStore";
import type { Track, TrackVersion } from "@/types";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { pluralize } from "@/lib/utils";

interface TrackListItemProps {
  track: Track;
  projectId: string;
  projectName: string;
}

export function TrackListItem({
  track,
  projectId,
  projectName,
}: TrackListItemProps) {
  const {
    loadVersion,
    version: playerVersion,
    isPlaying: playerIsPlaying,
    isLoading: playerIsLoading,
    waveSurfer: playerWaveSurfer,
  } = usePlayerStore();

  const handlePlayPause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent navigation when clicking play button

    if (!track.defaultVersion) return;

    // Create a full TrackVersion object from defaultVersion
    const version: TrackVersion = {
      id: track.defaultVersion.id,
      trackId: track.id,
      versionNumber: track.defaultVersion.versionNumber,
      audioUrl: track.defaultVersion.audioUrl,
      isMaster: track.defaultVersion.isMaster,
      notes: null,
      createdAt: track.createdAt,
      uploadedBy: track.defaultVersion.uploadedBy,
    };

    const isThisTrackLoaded =
      playerWaveSurfer && playerVersion?.trackId === track.id;

    if (isThisTrackLoaded) {
      // Track loaded and ready, just toggle play/pause
      if (playerIsPlaying) {
        playerWaveSurfer.pause();
      } else {
        playerWaveSurfer.play();
      }
    } else {
      // Different track or no player loaded yet, load it with autoplay
      loadVersion(track, version, projectName, true, 0);
    }
  };

  const isThisTrackPlaying =
    playerVersion?.trackId === track.id && playerIsPlaying;
  const isThisTrackLoading =
    playerVersion?.trackId === track.id && playerIsLoading;

  return (
    <Link
      href={`/projects/${projectId}/tracks/${track.id}`}
      className="border border-border bg-card hover:border-foreground transition-colors flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 gap-2 sm:gap-4 no-underline text-foreground"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {track.defaultVersion && (
            <Button
              onClick={handlePlayPause}
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 relative z-10"
            >
              {isThisTrackLoading ? (
                <LoadingSpinner size="xs" />
              ) : isThisTrackPlaying ? (
                <PauseIcon className="size-4" />
              ) : (
                <PlayIcon className="size-4" />
              )}
            </Button>
          )}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-tight truncate">
              {track.name}
            </h3>
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              {pluralize(track.versionCount, "version")}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pl-10 sm:pl-0">
        <span className="text-xs font-mono text-muted-foreground">
          {new Date(
            track.lastVersionAt ?? track.createdAt
          ).toLocaleDateString()}
        </span>
        <div className="text-xs font-bold uppercase tracking-tight">VIEW →</div>
      </div>
    </Link>
  );
}
