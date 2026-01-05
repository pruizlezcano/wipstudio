"use client";

import { usePlayerStore } from "@/stores/playerStore";
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import WavesurferPlayer from "@wavesurfer/react";
import Link from "next/link";
import { formatTime } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/loading-spinner";

export const GlobalPlayer = () => {
  const {
    waveSurfer,
    track,
    version,
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
  } = usePlayerStore();

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
      <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center gap-6">
        <Button onClick={handlePlayPause} size="icon" variant="ghost">
          {isLoading ? (
            <LoadingSpinner size="xs" />
          ) : isPlaying ? (
            <PauseIcon className="size-5" />
          ) : (
            <PlayIcon className="size-5" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href={`/projects/${track.projectId}/tracks/${track.id}`}
              className="text-sm font-semibold truncate hover:underline transition-all"
            >
              {track.name}
            </Link>
            <span className="text-xs text-muted-foreground/80 shrink-0 bg-muted px-1.5 py-0.5 rounded font-mono">
              v{version.versionNumber}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums font-mono">
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
            <span className="text-xs text-muted-foreground tabular-nums font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <WavesurferPlayer
          key={version.id}
          height={0}
          url={url ?? ""}
          onReady={(ws) => {
            setWaveSurfer(ws);
            setIsLoading(false);
            setDuration(ws.getDuration());
            if (shouldAutoPlay) {
              ws.play();
              setShouldAutoPlay(false);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeupdate={() => setCurrentTime(waveSurfer?.getCurrentTime() || 0)}
        />
      </div>
    </div>
  );
};
