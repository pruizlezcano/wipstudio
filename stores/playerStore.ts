import { create } from "zustand";
import type { Track, TrackVersion } from "@/types/track";
import WaveSurfer from "wavesurfer.js";

interface PlayerState {
  track: Track | null;
  version: TrackVersion | null;
  waveSurfer: WaveSurfer | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  url: string | null;
  isLoading: boolean;
  shouldAutoPlay: boolean;
  hasEverPlayed: boolean;
  peaksCache: Record<string, number[][]>;
  setTrack: (track: Track) => void;
  setVersion: (version: TrackVersion) => void;
  setWaveSurfer: (waveSurfer: WaveSurfer) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setUrl: (url: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setShouldAutoPlay: (shouldAutoPlay: boolean) => void;
  setPeaks: (versionId: string, peaks: number[][]) => void;
  loadVersion: (
    track: Track,
    version: TrackVersion,
    autoPlay?: boolean
  ) => void;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  track: null,
  version: null,
  waveSurfer: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  url: null,
  isLoading: true,
  shouldAutoPlay: false,
  hasEverPlayed: false,
  peaksCache: {},
  setTrack: (track: Track) => set({ track }),
  setVersion: (version: TrackVersion) => set({ version }),
  setWaveSurfer: (waveSurfer: WaveSurfer) => set({ waveSurfer }),
  setDuration: (duration: number) => set({ duration }),
  setCurrentTime: (currentTime: number) => set({ currentTime }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  setUrl: (url: string) => set({ url }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setShouldAutoPlay: (shouldAutoPlay: boolean) => set({ shouldAutoPlay }),
  setPeaks: (versionId: string, peaks: number[] | number[][]) =>
    set((state) => ({
      peaksCache: { ...state.peaksCache, [versionId]: peaks },
    })),
  loadVersion: (track: Track, version: TrackVersion, autoPlay = false) => {
    const { waveSurfer } = get();
    if (waveSurfer && waveSurfer.isPlaying()) {
      waveSurfer.pause();
    }
    set({
      track,
      version,
      url: version.audioUrl,
      isLoading: true,
      isPlaying: false,
      currentTime: 0,
      shouldAutoPlay: autoPlay,
      hasEverPlayed: true,
    });
  },
  clearPlayer: () => {
    const { waveSurfer } = get();
    if (waveSurfer) {
      if (waveSurfer.isPlaying()) {
        waveSurfer.pause();
      }
      waveSurfer.destroy();
    }
    set({
      track: null,
      version: null,
      waveSurfer: null,
      duration: 0,
      currentTime: 0,
      isPlaying: false,
      url: null,
      isLoading: true,
      shouldAutoPlay: false,
      hasEverPlayed: false,
    });
  },
}));
