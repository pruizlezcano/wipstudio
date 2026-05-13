import { create } from "zustand";
import type { Track, TrackVersion } from "@/types/track";
import WaveSurfer from "wavesurfer.js";

const externalWaveSurfers = new Set<WaveSurfer>();
let handoffWaveSurfer: WaveSurfer | null = null;

const silenceWaveSurfer = (waveSurfer: WaveSurfer) => {
  waveSurfer.pause();
  waveSurfer.setMuted(true);
  waveSurfer.setVolume(0);
};

interface PlayerState {
  track: Track | null;
  version: TrackVersion | null;
  projectName: string | null;
  waveSurfer: WaveSurfer | null;
  usesExternalWaveSurfer: boolean;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  url: string | null;
  isLoading: boolean;
  shouldAutoPlay: boolean;
  hasEverPlayed: boolean;
  peaksCache: Record<string, number[][]>;
  setWaveSurfer: (waveSurfer: WaveSurfer) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setShouldAutoPlay: (shouldAutoPlay: boolean) => void;
  setPeaks: (versionId: string, peaks: number[] | number[][]) => void;
  registerExternalWaveSurfer: (waveSurfer: WaveSurfer) => void;
  unregisterExternalWaveSurfer: (waveSurfer: WaveSurfer) => void;
  guardSingleActiveAudio: (activeWaveSurfer: WaveSurfer | null) => void;
  activateExternalWaveSurfer: (
    track: Track,
    version: TrackVersion,
    projectName: string,
    waveSurfer: WaveSurfer,
    startTime?: number
  ) => void;
  handoffToInternalPlayer: (
    track: Track,
    version: TrackVersion,
    projectName: string,
    autoPlay?: boolean,
    startTime?: number
  ) => void;
  loadVersion: (
    track: Track,
    version: TrackVersion,
    projectName: string,
    autoPlay?: boolean,
    startTime?: number
  ) => void;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  track: null,
  version: null,
  projectName: null,
  waveSurfer: null,
  usesExternalWaveSurfer: false,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  url: null,
  isLoading: true,
  shouldAutoPlay: false,
  hasEverPlayed: false,
  peaksCache: {},
  setWaveSurfer: (waveSurfer: WaveSurfer) => set({ waveSurfer }),
  setDuration: (duration: number) => set({ duration }),
  setCurrentTime: (currentTime: number) => set({ currentTime }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setShouldAutoPlay: (shouldAutoPlay: boolean) => set({ shouldAutoPlay }),
  setPeaks: (versionId: string, peaks: number[] | number[][]) =>
    set((state) => ({
      peaksCache: {
        ...state.peaksCache,
        [versionId]: Array.isArray(peaks[0])
          ? (peaks as number[][])
          : [peaks as number[]],
      },
    })),
  registerExternalWaveSurfer: (waveSurfer: WaveSurfer) => {
    externalWaveSurfers.add(waveSurfer);
    silenceWaveSurfer(waveSurfer);
  },
  unregisterExternalWaveSurfer: (waveSurfer: WaveSurfer) => {
    externalWaveSurfers.delete(waveSurfer);
  },
  guardSingleActiveAudio: (activeWaveSurfer: WaveSurfer | null) => {
    const { waveSurfer: currentWaveSurfer } = get();

    externalWaveSurfers.forEach((waveSurfer) => {
      if (waveSurfer !== activeWaveSurfer) {
        silenceWaveSurfer(waveSurfer);
      }
    });

    if (currentWaveSurfer && currentWaveSurfer !== activeWaveSurfer) {
      silenceWaveSurfer(currentWaveSurfer);
    }

    if (handoffWaveSurfer && handoffWaveSurfer !== activeWaveSurfer) {
      silenceWaveSurfer(handoffWaveSurfer);
      handoffWaveSurfer = null;
    }

    if (activeWaveSurfer) {
      activeWaveSurfer.setMuted(false);
      activeWaveSurfer.setVolume(1);
    }
  },
  activateExternalWaveSurfer: (
    track: Track,
    version: TrackVersion,
    projectName: string,
    waveSurfer: WaveSurfer,
    startTime = 0
  ) => {
    get().guardSingleActiveAudio(waveSurfer);

    set({
      track,
      version,
      projectName,
      waveSurfer,
      usesExternalWaveSurfer: true,
      duration: waveSurfer.getDuration(),
      currentTime: startTime,
      isPlaying: false,
      url: null,
      isLoading: false,
      shouldAutoPlay: false,
      hasEverPlayed: true,
    });
  },
  handoffToInternalPlayer: (
    track: Track,
    version: TrackVersion,
    projectName: string,
    autoPlay = false,
    startTime = 0
  ) => {
    const { waveSurfer, usesExternalWaveSurfer, guardSingleActiveAudio } = get();

    if (waveSurfer && usesExternalWaveSurfer && autoPlay) {
      handoffWaveSurfer = waveSurfer;
    } else {
      handoffWaveSurfer = null;
      guardSingleActiveAudio(null);
    }

    set({
      track,
      version,
      projectName,
      waveSurfer: null,
      usesExternalWaveSurfer: false,
      url: version.audioUrl,
      isLoading: true,
      isPlaying: false,
      currentTime: startTime,
      shouldAutoPlay: autoPlay,
      hasEverPlayed: true,
    });
  },
  loadVersion: (
    track: Track,
    version: TrackVersion,
    projectName: string,
    autoPlay = false,
    startTime = 0
  ) => {
    const { waveSurfer, usesExternalWaveSurfer, guardSingleActiveAudio } = get();
    handoffWaveSurfer = null;
    guardSingleActiveAudio(null);

    if (waveSurfer) {
      silenceWaveSurfer(waveSurfer);

      if (!usesExternalWaveSurfer) {
        waveSurfer.destroy();
      }
    }
    set({
      track,
      version,
      projectName,
      waveSurfer: null,
      usesExternalWaveSurfer: false,
      url: version.audioUrl,
      isLoading: true,
      isPlaying: false,
      currentTime: startTime,
      shouldAutoPlay: autoPlay,
      hasEverPlayed: true,
    });
  },
  clearPlayer: () => {
    const { waveSurfer, usesExternalWaveSurfer, guardSingleActiveAudio } = get();
    handoffWaveSurfer = null;
    guardSingleActiveAudio(null);

    if (waveSurfer && !usesExternalWaveSurfer) {
      silenceWaveSurfer(waveSurfer);
      waveSurfer.destroy();
    }
    set({
      track: null,
      version: null,
      projectName: null,
      waveSurfer: null,
      usesExternalWaveSurfer: false,
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
