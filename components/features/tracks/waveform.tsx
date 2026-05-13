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
  projectName: string;
  comments?: Comment[];
  onTimeClick?: (time: number) => void;
  onCommentClick?: (commentId: string) => void;
  onWaveSurferReady?: (versionId: string, waveSurfer: WaveSurfer) => void;
  onActivateVersion?: (
    version: TrackVersion,
    waveSurfer: WaveSurfer,
    startTime: number,
    autoPlay: boolean
  ) => void;
}

const WaveformTimer = memo(({ waveSurfer }: { waveSurfer: WaveSurfer }) => {
  const [currentTime, setCurrentTime] = useState(() =>
    waveSurfer.getCurrentTime()
  );
  const [duration, setDuration] = useState(() => waveSurfer.getDuration());

  const [prevWaveSurfer, setPrevWaveSurfer] = useState(waveSurfer);
  if (waveSurfer !== prevWaveSurfer) {
    setPrevWaveSurfer(waveSurfer);
    setCurrentTime(waveSurfer.getCurrentTime());
    setDuration(waveSurfer.getDuration());
  }

  useEffect(() => {
    const handleTimeUpdate = () => setCurrentTime(waveSurfer.getCurrentTime());
    const handleReady = () => setDuration(waveSurfer.getDuration());

    waveSurfer.on("timeupdate", handleTimeUpdate);
    waveSurfer.on("ready", handleReady);

    return () => {
      waveSurfer.un("timeupdate", handleTimeUpdate);
      waveSurfer.un("ready", handleReady);
    };
  }, [waveSurfer]);

  if (duration === 0) return null;

  return (
    <span className="text-xs sm:text-sm text-muted-foreground tabular-nums font-mono">
      {formatTime(currentTime)}/{formatTime(duration)}
    </span>
  );
});

WaveformTimer.displayName = "WaveformTimer";

export const Waveform = memo(
  function Waveform({
    track,
    version,
    projectName,
    comments,
    onTimeClick,
    onCommentClick,
    onWaveSurferReady,
    onActivateVersion,
  }: WaveformProps) {
    const {
      waveSurfer: playerWaveSurfer,
      version: playerVersion,
      setIsPlaying: setPlayerIsPlaying,
      isPlaying: playerIsPlaying,
      isLoading: playerIsLoading,
      usesExternalWaveSurfer,
      registerExternalWaveSurfer,
      unregisterExternalWaveSurfer,
      guardSingleActiveAudio,
      loadVersion,
      peaksCache,
      setPeaks,
    } = usePlayerStore();
    const [waveSurfer, setWaveSurfer] = useState<WaveSurfer>();
    const [isLoading, setIsLoading] = useState(true);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
      if (!waveSurfer) return;

      registerExternalWaveSurfer(waveSurfer);

      return () => {
        unregisterExternalWaveSurfer(waveSurfer);
      };
    }, [registerExternalWaveSurfer, unregisterExternalWaveSurfer, waveSurfer]);

    // Derived playing state for this specific version
    const isPlaying = playerIsPlaying && playerVersion?.id === version.id;

    // Sync global player with local player
    useEffect(() => {
      if (
        !playerWaveSurfer ||
        !waveSurfer ||
        playerWaveSurfer === waveSurfer ||
        playerVersion?.id !== version.id
      ) {
        return;
      }

      const handleGlobalPlay = () => {
        if (usesExternalWaveSurfer) {
          guardSingleActiveAudio(waveSurfer);
          void waveSurfer.play();
        } else {
          waveSurfer.pause();
        }
      };

      const handleGlobalPause = () => {
        waveSurfer.pause();
      };

      const handleGlobalTimeUpdate = () => {
        const globalTime = playerWaveSurfer.getCurrentTime();
        const localTime = waveSurfer.getCurrentTime();
        // Only sync if they drift apart by more than 0.1s (handles seeks and drift)
        if (Math.abs(globalTime - localTime) > 0.1) {
          waveSurfer.setTime(globalTime);
        }
      };

      const handleLocalClick = (time: number) => {
        const absoluteTime = time * waveSurfer.getDuration();
        playerWaveSurfer.setTime(absoluteTime);
        onTimeClick?.(absoluteTime);
      };

      playerWaveSurfer.on("play", handleGlobalPlay);
      playerWaveSurfer.on("pause", handleGlobalPause);
      playerWaveSurfer.on("timeupdate", handleGlobalTimeUpdate);
      waveSurfer.on("click", handleLocalClick);

      const currentGlobalTime = playerWaveSurfer.getCurrentTime();
      waveSurfer.setTime(currentGlobalTime);
      if (playerIsPlaying && usesExternalWaveSurfer) {
        guardSingleActiveAudio(waveSurfer);
        void waveSurfer.play();
      } else {
        waveSurfer.pause();
      }

      return () => {
        playerWaveSurfer.un("play", handleGlobalPlay);
        playerWaveSurfer.un("pause", handleGlobalPause);
        playerWaveSurfer.un("timeupdate", handleGlobalTimeUpdate);
        waveSurfer.un("click", handleLocalClick);
      };
    }, [
      onTimeClick,
      playerVersion?.id,
      playerWaveSurfer,
      waveSurfer,
      version.id,
      playerIsPlaying,
      usesExternalWaveSurfer,
      guardSingleActiveAudio,
    ]);

    const handlePlayPause = () => {
      // If no player loaded yet, or different version, load it
      if (!playerWaveSurfer || playerVersion?.id !== version.id) {
        const startTime = waveSurfer?.getCurrentTime() || 0;
        if (waveSurfer && onActivateVersion) {
          onActivateVersion(version, waveSurfer, startTime, true);
        } else {
          loadVersion(track, version, projectName, true, startTime);
        }
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
            backend="WebAudio"
            height={isLoading ? 0 : 120}
            waveColor={
              resolvedTheme === "dark" ? "hsl(0 0% 35%)" : "hsl(0 0% 65%)"
            }
            progressColor={
              resolvedTheme === "dark" ? "hsl(0 0% 85%)" : "hsl(0 0% 25%)"
            }
            cursorColor={
              resolvedTheme === "dark" ? "hsl(0 0% 85%)" : "hsl(0 0% 25%)"
            }
            url={version.audioUrl}
            peaks={version ? peaksCache[version.id] : undefined}
            onReady={(ws) => {
              ws.setMuted(true);
              ws.setVolume(0);
              setWaveSurfer(ws);
              setIsLoading(false);
              onWaveSurferReady?.(version.id, ws);

              if (playerVersion?.id === version.id) {
                ws.setTime(usePlayerStore.getState().currentTime);
              }

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

                // If this is the active track, sync the global player immediately
                if (
                  playerWaveSurfer &&
                  usePlayerStore.getState().version?.id === version.id
                ) {
                  playerWaveSurfer.setTime(absoluteTime);
                }
              });
            }}
            onPlay={() => {
              if (playerVersion?.id !== version.id) {
                const startTime = waveSurfer?.getCurrentTime() || 0;
                if (waveSurfer && onActivateVersion) {
                  onActivateVersion(version, waveSurfer, startTime, true);
                } else {
                  loadVersion(track, version, projectName, true, startTime);
                }
              }
            }}
          />
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handlePlayPause}
            variant="outline"
            size="sm"
            disabled={playerIsLoading && playerVersion?.id === version.id}
            className="text-xs sm:text-sm"
          >
            {isPlaying ? "Pause" : "Play"}
          </Button>
          {waveSurfer && <WaveformTimer waveSurfer={waveSurfer} />}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Re-render if version or track changes
    // Always re-render if comments reference changes (React Query will provide new reference when data updates)
    return (
      prevProps.version.id === nextProps.version.id &&
      prevProps.track.id === nextProps.track.id &&
      prevProps.comments === nextProps.comments
    );
  }
);
