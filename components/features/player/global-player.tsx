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
import WaveSurfer from "wavesurfer.js";

export const GlobalPlayer = () => {
  const {
    waveSurfer,
    track,
    version,
    projectName,
    usesExternalWaveSurfer,
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
    guardSingleActiveAudio,
  } = usePlayerStore();

  // Track which version has been autoplayed to prevent double-play
  const autoPlayedVersionRef = useRef<string | null>(null);
  const autoPlayRequestedRef = useRef<boolean>(false);
  const standbyWaveSurferRef = useRef<WaveSurfer | null>(null);
  const standbyVersionIdRef = useRef<string | null>(null);

  // Reset tracking when version changes
  useEffect(() => {
    if (version && autoPlayedVersionRef.current !== version.id) {
      autoPlayedVersionRef.current = null;
      autoPlayRequestedRef.current = false;
    }
  }, [version]);

  useEffect(() => {
    if (!version) {
      standbyWaveSurferRef.current = null;
      standbyVersionIdRef.current = null;
      return;
    }

    if (standbyVersionIdRef.current !== version.id) {
      standbyWaveSurferRef.current = null;
      standbyVersionIdRef.current = version.id;
    }
  }, [version]);

  useEffect(() => {
    if (!waveSurfer) return;

    const handleReady = () => setDuration(waveSurfer.getDuration());
    const handleTimeUpdate = () =>
      setCurrentTime(waveSurfer.getCurrentTime() || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    waveSurfer.on("ready", handleReady);
    waveSurfer.on("timeupdate", handleTimeUpdate);
    waveSurfer.on("play", handlePlay);
    waveSurfer.on("pause", handlePause);

    handleReady();
    handleTimeUpdate();

    return () => {
      waveSurfer.un("ready", handleReady);
      waveSurfer.un("timeupdate", handleTimeUpdate);
      waveSurfer.un("play", handlePlay);
      waveSurfer.un("pause", handlePause);
    };
  }, [waveSurfer, setCurrentTime, setDuration, setIsPlaying]);

  useEffect(() => {
    if (!waveSurfer || usesExternalWaveSurfer) return;

    const handlePlay = () => {
      guardSingleActiveAudio(waveSurfer);
    };

    waveSurfer.on("play", handlePlay);

    return () => {
      waveSurfer.un("play", handlePlay);
    };
  }, [guardSingleActiveAudio, usesExternalWaveSurfer, waveSurfer]);

  useEffect(() => {
    const standbyWaveSurfer = standbyWaveSurferRef.current;

    if (
      !usesExternalWaveSurfer ||
      !standbyWaveSurfer ||
      standbyVersionIdRef.current !== version?.id
    ) {
      return;
    }

    standbyWaveSurfer.setMuted(true);
    standbyWaveSurfer.setVolume(0);

    const standbyTime = standbyWaveSurfer.getCurrentTime();
    if (Math.abs(standbyTime - currentTime) > 0.1) {
      standbyWaveSurfer.setTime(currentTime);
    }

    if (standbyWaveSurfer.isPlaying()) {
      standbyWaveSurfer.pause();
    }
  }, [currentTime, usesExternalWaveSurfer, version?.id]);

  useEffect(() => {
    const standbyWaveSurfer = standbyWaveSurferRef.current;

    if (
      usesExternalWaveSurfer ||
      waveSurfer ||
      !standbyWaveSurfer ||
      standbyVersionIdRef.current !== version?.id
    ) {
      return;
    }

    setWaveSurfer(standbyWaveSurfer);
    setIsLoading(false);
    setDuration(standbyWaveSurfer.getDuration());
    standbyWaveSurfer.setTime(currentTime);

    if (shouldAutoPlay || autoPlayRequestedRef.current) {
      if (!autoPlayRequestedRef.current) {
        autoPlayRequestedRef.current = true;
        setShouldAutoPlay(false);
      }

      guardSingleActiveAudio(standbyWaveSurfer);
      standbyWaveSurfer.play().catch((error) => {
        console.error("Failed to autoplay:", error);
      });
    }
  }, [
    currentTime,
    guardSingleActiveAudio,
    setDuration,
    setIsLoading,
    setShouldAutoPlay,
    setWaveSurfer,
    shouldAutoPlay,
    usesExternalWaveSurfer,
    version?.id,
    waveSurfer,
  ]);

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
        url={url ?? version.audioUrl}
        peaks={peaksCache[version.id]}
        onReady={(ws) => {
          standbyWaveSurferRef.current = ws;
          standbyVersionIdRef.current = version.id;
          ws.setMuted(true);
          ws.setVolume(0);
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

          if (!usesExternalWaveSurfer) {
            setWaveSurfer(ws);
            setIsLoading(false);
            setDuration(ws.getDuration());

            // If autoplay was requested for this version, play it (even on second onReady)
            if (shouldAutoPlay || autoPlayRequestedRef.current) {
              if (!autoPlayRequestedRef.current) {
                autoPlayRequestedRef.current = true;
                setShouldAutoPlay(false);
              }

              guardSingleActiveAudio(ws);
              ws.play().catch((error) => {
                console.error("Failed to autoplay:", error);
              });
            }
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeupdate={() => setCurrentTime(waveSurfer?.getCurrentTime() || 0)}
      />
    </div>
  );
};
