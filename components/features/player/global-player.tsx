"use client";

import { usePlayerStore } from "@/stores/playerStore";
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import WavesurferPlayer from "@wavesurfer/react";
import Link from "next/link";
import { formatTime } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useRef, useEffect } from "react";

export const GlobalPlayer = () => {
  const {
    waveSurfer,
    track,
    version,
    projectName,
    duration,
    currentTime,
    url,
    isPlaying,
    isLoading,
    shouldAutoPlay,
    hasEverPlayed,
    setWaveSurfer,
    setDuration,
    setCurrentTime,
    setIsPlaying,
    setIsLoading,
    setShouldAutoPlay,
    peaksCache,
    setPeaks,
  } = usePlayerStore();

  // Track which version has been autoplayed to prevent double-play
  const autoPlayedVersionRef = useRef<string | null>(null);
  const autoPlayRequestedRef = useRef<boolean>(false);

  // Reset tracking when version changes
  useEffect(() => {
    if (version && autoPlayedVersionRef.current !== version.id) {
      autoPlayedVersionRef.current = null;
      autoPlayRequestedRef.current = false;
    }
  }, [version]);

  // Update Media Session API metadata when track/version changes
  useEffect(() => {
    if (!track || !version) return;

    if ("mediaSession" in navigator) {
      const title = `${track.name} (v${version.versionNumber})`;
      const artist = version.uploadedBy?.name || "Unknown Artist";
      const album = projectName || "WIPStudio";

      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: artist,
        album: album,
      });

      // Set up action handlers for media controls
      navigator.mediaSession.setActionHandler("play", () => {
        waveSurfer?.play();
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        waveSurfer?.pause();
      });

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime && waveSurfer) {
          waveSurfer.setTime(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler("seekbackward", () => {
        if (waveSurfer) {
          const newTime = Math.max(0, waveSurfer.getCurrentTime() - 10);
          waveSurfer.setTime(newTime);
        }
      });

      navigator.mediaSession.setActionHandler("seekforward", () => {
        if (waveSurfer) {
          const newTime = Math.min(
            waveSurfer.getDuration(),
            waveSurfer.getCurrentTime() + 10
          );
          waveSurfer.setTime(newTime);
        }
      });
    }

    return () => {
      // Clean up media session when component unmounts
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("seekto", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
      }
    };
  }, [track, version, waveSurfer, projectName]);

  const handlePlayPause = () => {
    if (waveSurfer) waveSurfer.playPause();
  };

  const handleSeek = (value: number[]) => {
    if (waveSurfer) {
      waveSurfer.seekTo(value[0] / 100);
    }
  };

  if (!track || !version || !hasEverPlayed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-40">
      <div className="container mx-auto max-w-6xl px-3 sm:px-6 py-2 sm:py-4 flex items-center gap-2 sm:gap-6">
        <Button
          onClick={handlePlayPause}
          size="icon"
          variant="ghost"
          className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
        >
          {isLoading ? (
            <LoadingSpinner size="xs" />
          ) : isPlaying ? (
            <PauseIcon className="size-4 sm:size-5" />
          ) : (
            <PlayIcon className="size-4 sm:size-5" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
            <Link
              href={`/projects/${track.projectId}/tracks/${track.id}`}
              className="text-xs sm:text-sm font-semibold truncate hover:underline transition-all"
            >
              {track.name}
            </Link>
            <span className="text-[10px] sm:text-xs text-muted-foreground/80 shrink-0 bg-muted px-1 sm:px-1.5 py-0.5 rounded font-mono">
              v{version.versionNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums font-mono shrink-0">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[(currentTime / duration) * 100 || 0]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              showThumbs={false}
              className="flex-1"
            />
            <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums font-mono shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
      <WavesurferPlayer
        key={version.id}
        height={0}
        url={url ?? ""}
        peaks={peaksCache[version.id]}
        onReady={(ws) => {
          setWaveSurfer(ws);
          setIsLoading(false);
          setDuration(ws.getDuration());
          ws.setTime(currentTime);

          // Cache peaks if not already present
          if (!peaksCache[version.id]) {
            try {
              const peaks = ws.exportPeaks();
              if (peaks && peaks.length > 0) {
                setPeaks(version.id, peaks);
              }
            } catch (e) {
              console.error("Failed to export peaks:", e);
            }
          }

          // If autoplay was requested for this version, play it (even on second onReady)
          if (shouldAutoPlay || autoPlayRequestedRef.current) {
            if (!autoPlayRequestedRef.current) {
              autoPlayRequestedRef.current = true;
              setShouldAutoPlay(false);
            }

            ws.play().catch((error) => {
              console.error("Failed to autoplay:", error);
            });
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeupdate={() => setCurrentTime(waveSurfer?.getCurrentTime() || 0)}
      />
    </div>
  );
};
