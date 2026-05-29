type AudioData = {
  channelData: Float32Array[];
  sampleRate: number;
};
import { getS3FileBuffer } from "@/lib/storage/s3";

export type WaveformPeaks = number[][];
export type WaveformCacheData = {
  peaks: WaveformPeaks;
  duration: number;
};

type AudioDecoder = (src: ArrayBuffer | Uint8Array) => Promise<AudioData>;

const DEFAULT_MAX_LENGTH = 8000;
const DEFAULT_PRECISION = 10000;
const DEFAULT_CHANNELS = 2;

export function exportWaveformPeaks(
  audioData: Pick<AudioData, "channelData">,
  {
    channels = DEFAULT_CHANNELS,
    maxLength = DEFAULT_MAX_LENGTH,
    precision = DEFAULT_PRECISION,
  }: {
    channels?: number;
    maxLength?: number;
    precision?: number;
  } = {}
): WaveformPeaks {
  if (!audioData.channelData.length) {
    return [];
  }

  const channelCount = Math.min(channels, audioData.channelData.length);
  const peaks: WaveformPeaks = [];

  for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
    const channel = audioData.channelData[channelIndex];
    const channelPeaks: number[] = [];
    const segmentSize = channel.length / maxLength;

    for (let peakIndex = 0; peakIndex < maxLength; peakIndex += 1) {
      const start = Math.floor(peakIndex * segmentSize);
      const end = Math.ceil((peakIndex + 1) * segmentSize);

      let peak = 0;
      for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
        const sample = channel[sampleIndex];
        if (Math.abs(sample) > Math.abs(peak)) {
          peak = sample;
        }
      }

      channelPeaks.push(Math.round(peak * precision) / precision);
    }

    peaks.push(channelPeaks);
  }

  return peaks;
}

export async function extractWaveformCacheFromS3Object(
  objectKey: string,
  formatHint?: string
): Promise<WaveformCacheData | null> {
  const fileBuffer = await getS3FileBuffer(objectKey);
  const decoder = await getAudioDecoder(formatHint, objectKey);
  const audioData = await decoder(fileBuffer);
  const peaks = exportWaveformPeaks(audioData);
  if (
    !peaks.length ||
    !audioData.channelData.length ||
    audioData.sampleRate <= 0
  ) {
    return null;
  }

  return {
    peaks,
    duration: audioData.channelData[0].length / audioData.sampleRate,
  };
}

async function getAudioDecoder(
  formatHint?: string,
  objectKey?: string
): Promise<AudioDecoder> {
  const normalizedFormat = normalizeAudioFormat(formatHint, objectKey);

  switch (normalizedFormat) {
    case "mp3":
      return importDecoder("@audio/decode-mp3");
    case "wav":
      return importDecoder("@audio/decode-wav");
    case "flac":
      return importDecoder("@audio/decode-flac");
    case "aiff":
      return importDecoder("@audio/decode-aiff");
    case "aac":
    case "m4a":
    case "mp4":
      return importDecoder("@audio/decode-aac");
    case "webm":
      return importDecoder("@audio/decode-webm");
    case "ogg":
      return importDecoder("@audio/decode-vorbis");
    default:
      throw new Error(
        `No server-side audio decoder configured for format "${formatHint ?? objectKey ?? "unknown"}"`
      );
  }
}

async function importDecoder(moduleName: string): Promise<AudioDecoder> {
  const dynamicImport = new Function(
    "moduleName",
    "return import(moduleName);"
  ) as (moduleName: string) => Promise<{ default: AudioDecoder }>;

  const mod = await dynamicImport(moduleName);
  return mod.default;
}

function normalizeAudioFormat(formatHint?: string, objectKey?: string): string {
  const normalizedHint = formatHint?.toLowerCase() ?? "";

  if (normalizedHint.includes("mp3")) return "mp3";
  if (normalizedHint.includes("wav")) return "wav";
  if (normalizedHint.includes("flac")) return "flac";
  if (normalizedHint.includes("aiff")) return "aiff";
  if (normalizedHint.includes("ogg")) return "ogg";
  if (normalizedHint.includes("webm")) return "webm";
  if (
    normalizedHint.includes("m4a") ||
    normalizedHint.includes("mp4") ||
    normalizedHint.includes("aac")
  ) {
    return "aac";
  }

  const extension = objectKey?.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "mp3":
      return "mp3";
    case "wav":
    case "wave":
      return "wav";
    case "flac":
      return "flac";
    case "aif":
    case "aiff":
      return "aiff";
    case "ogg":
    case "oga":
    case "opus":
      return "ogg";
    case "m4a":
    case "mp4":
    case "aac":
      return "aac";
    case "webm":
      return "webm";
    default:
      return extension ?? "unknown";
  }
}

export function serializeWaveformPeaks(
  peaks: WaveformPeaks | null | undefined
): string | null {
  if (!peaks?.length) {
    return null;
  }

  return JSON.stringify(peaks);
}

export function parseWaveformPeaks(
  peaks: string | null | undefined
): WaveformPeaks | undefined {
  if (!peaks) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(peaks);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (channel) =>
          Array.isArray(channel) &&
          channel.every((value) => typeof value === "number")
      )
    ) {
      return parsed as WaveformPeaks;
    }
  } catch (error) {
    console.error("Failed to parse waveform peaks:", error);
  }

  return undefined;
}
