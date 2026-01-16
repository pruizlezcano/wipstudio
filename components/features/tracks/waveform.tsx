"use client";

import { useState, useEffect, memo } from "react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import WavesurferPlayer from "@wavesurfer/react";
import WaveSurfer from "wavesurfer.js";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { usePlayerStore } from "@/stores/playerStore";
import type { Track, TrackVersion, Comment } from "@/types";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WaveformProps {
  track: Track;
  version: TrackVersion;
  comments?: Comment[];
  onTimeClick?: (time: number) => void;
  onCommentClick?: (commentId: string) => void;
}

export const Waveform = memo(
  function Waveform({
    track,
    version,
    comments,
    onTimeClick,
    onCommentClick,
  }: WaveformProps) {
    const {
      waveSurfer: playerWaveSurfer,
      version: playerVersion,
      setIsPlaying: setPlayerIsPlaying,
      isPlaying: playerIsPlaying,
      isLoading: playerIsLoading,
      loadVersion,
      peaksCache,
      setPeaks,
    } = usePlayerStore();
    const [waveSurfer, setWaveSurfer] = useState<WaveSurfer>();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { theme } = useTheme();

    // Sync global player with local player
    useEffect(() => {
      if (playerWaveSurfer && waveSurfer && playerVersion?.id === version.id) {
        const cleanupEvents = () => {
          playerWaveSurfer.un("play", () => {});
          playerWaveSurfer.un("pause", () => {});
          playerWaveSurfer.un("timeupdate", () => {});
          waveSurfer.un("click", () => {});
        };

        cleanupEvents();

        // Global player handlers
        const handleGlobalPlay = () => {
          setIsPlaying(true);
          const currentTime = playerWaveSurfer.getCurrentTime();
          waveSurfer.setTime(currentTime);
        };

        const handleGlobalPause = () => {
          setIsPlaying(false);
          waveSurfer.pause();
        };

        const handleGlobalTimeUpdate = () => {
          waveSurfer.setTime(playerWaveSurfer.getCurrentTime());
        };

        // Local player handlers
        const handleLocalClick = (time: number) => {
          const absoluteTime = time * waveSurfer.getDuration();
          playerWaveSurfer.setTime(absoluteTime);
          onTimeClick?.(absoluteTime);
        };

        // Listen to global player events
        playerWaveSurfer.on("play", handleGlobalPlay);
        playerWaveSurfer.on("pause", handleGlobalPause);
        playerWaveSurfer.on("timeupdate", handleGlobalTimeUpdate);

        // Listen to local player events
        waveSurfer.on("click", handleLocalClick);

        // Initial sync
        if (playerIsPlaying) {
          handleGlobalPlay();
        }

        return cleanupEvents;
      }
    }, [
      onTimeClick,
      playerIsPlaying,
      playerVersion,
      playerWaveSurfer,
      waveSurfer,
      version,
    ]);

    const handlePlayPause = () => {
      // If no player loaded yet, or different version, load it
      if (!playerWaveSurfer || playerVersion?.id !== version.id) {
        loadVersion(track, version, true);
      } else {
        // Same version already loaded, just toggle play/pause
        if (playerIsPlaying) {
          playerWaveSurfer.pause();
          setPlayerIsPlaying(false);
        } else {
          playerWaveSurfer.play();
          setPlayerIsPlaying(true);
        }
      }
    };

    // Get top-level comments with timestamps
    const timestampComments = comments?.filter(
      (c) => c.timestamp !== null && !c.parentId
    );

    return (
      <div className="space-y-3">
        <div className="relative">
          {isLoading && (
            <div className="z-10 flex items-center justify-center h-30">
              <LoadingSpinner size="md" />
            </div>
          )}
          {waveSurfer && !isLoading && (
            <div className="flex">
              {timestampComments?.map((comment) => (
                <div
                  key={comment.id}
                  className="absolute z-10"
                  style={{
                    left: `${(comment.timestamp! / waveSurfer.getDuration()) * 100}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCommentClick?.(comment.id);
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger className="transform -translate-x-1/2 hover:scale-110 hover:z-50 transition-transform cursor-pointer">
                      {comment.user ? (
                        <UserAvatar user={comment.user} className="size-5" />
                      ) : (
                        <div className="size-5 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground text-xs">
                          ?
                        </div>
                      )}
                    </TooltipTrigger>
                    <TooltipContent className="max-w-60">
                      <p className="overflow-hidden whitespace-nowrap text-ellipsis">
                        {comment.content}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
          <WavesurferPlayer
            height={isLoading ? 0 : 120}
            waveColor={theme === "dark" ? "hsl(0 0% 35%)" : "hsl(0 0% 65%)"}
            progressColor={theme === "dark" ? "hsl(0 0% 85%)" : "hsl(0 0% 25%)"}
            cursorColor={theme === "dark" ? "hsl(0 0% 85%)" : "hsl(0 0% 25%)"}
            url={version.audioUrl}
            peaks={version ? peaksCache[version.id] : undefined}
            onReady={(ws) => {
              ws.setVolume(0);
              setWaveSurfer(ws);
              setIsLoading(false);

              // Cache peaks if not already present
              if (version && !peaksCache[version.id]) {
                try {
                  const peaks = ws.exportPeaks();
                  if (peaks && peaks.length > 0) {
                    setPeaks(version.id, peaks);
                  }
                } catch (e) {
                  console.error("Failed to export peaks:", e);
                }
              }

              // Add click handler that always works, independent of global player
              ws.on("click", (relativeTime) => {
                const absoluteTime = relativeTime * ws.getDuration();
                onTimeClick?.(absoluteTime);
              });
            }}
            onPlay={() => {
              if (playerVersion?.id !== version.id) {
                loadVersion(track, version, true);
              }
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePlayPause}
            variant="outline"
            size="sm"
            disabled={playerIsLoading && playerVersion?.id === version.id}
          >
            {isPlaying && playerVersion?.id === version.id ? "Pause" : "Play"}
          </Button>
          {waveSurfer && waveSurfer.getDuration() > 0 && (
            <span className="text-sm text-muted-foreground">
              {formatTime(waveSurfer.getCurrentTime())} /{" "}
              {formatTime(waveSurfer.getDuration())}
            </span>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent re-renders
    // Only re-render if version ID or comments actually changed
    const prevComments = prevProps.comments ?? [];
    const nextComments = nextProps.comments ?? [];

    return (
      prevProps.version.id === nextProps.version.id &&
      prevProps.track.id === nextProps.track.id &&
      prevComments.length === nextComments.length &&
      prevComments.every((c, i) => c.id === nextComments[i]?.id)
    );
  }
);
