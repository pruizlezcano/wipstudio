"use client";

import { useRouter } from "next/navigation";
import { PlayIcon, PauseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/playerStore";
import type { Track, TrackVersion } from "@/types";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface TrackListItemProps {
  track: Track;
  projectId: string;
}

export function TrackListItem({ track, projectId }: TrackListItemProps) {
  const router = useRouter();
  const {
    loadVersion,
    version: playerVersion,
    isPlaying: playerIsPlaying,
    isLoading: playerIsLoading,
    waveSurfer: playerWaveSurfer,
  } = usePlayerStore();

  const handlePlayPause = (e: React.MouseEvent) => {
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
    };

    // Check if this version is currently loaded and ready
    const isThisVersionLoaded =
      playerWaveSurfer && playerVersion?.id === version.id;

    if (isThisVersionLoaded) {
      // Same version already loaded and ready, just toggle play/pause
      if (playerIsPlaying) {
        playerWaveSurfer.pause();
      } else {
        playerWaveSurfer.play();
      }
    } else {
      // Different version or no player loaded yet, load it with autoplay
      loadVersion(track, version, true, 0);
    }
  };

  const isThisTrackPlaying =
    playerVersion?.id === track.defaultVersion?.id && playerIsPlaying;
  const isThisTrackLoading =
    playerVersion?.id === track.defaultVersion?.id && playerIsLoading;

  return (
    <div
      className="border border-border bg-card hover:border-foreground transition-colors cursor-pointer flex items-center justify-between p-4 gap-4"
      onClick={() => router.push(`/projects/${projectId}/tracks/${track.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          {track.defaultVersion && (
            <Button
              onClick={handlePlayPause}
              size="icon"
              variant="ghost"
              className="h-8 w-8"
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
          <div className="flex items-baseline gap-3">
            <h3 className="text-sm font-bold uppercase tracking-tight truncate">
              {track.name}
            </h3>
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              {track.versionCount} versions
            </span>
          </div>
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
