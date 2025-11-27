/**
 * File validation utility that checks actual file content (magic bytes)
 * to prevent malicious uploads disguised with fake extensions/MIME types
 */

export interface FileSignature {
  // Magic bytes that identify the file type
  signature: number[][];
  // Offset where to check for the signature (usually 0)
  offset: number;
  // Human-readable name
  name: string;
}

// Audio file signatures (magic bytes)
// These are the first bytes of legitimate audio files
const AUDIO_SIGNATURES: FileSignature[] = [
  // MP3 with ID3v2 tag
  {
    signature: [[0x49, 0x44, 0x33]], // "ID3"
    offset: 0,
    name: "MP3 (ID3)",
  },
  // MP3 without ID3 tag (MPEG frame sync)
  {
    signature: [
      [0xff, 0xfb], // MPEG-1 Layer 3
      [0xff, 0xfa], // MPEG-1 Layer 3
      [0xff, 0xf3], // MPEG-2 Layer 3
      [0xff, 0xf2], // MPEG-2 Layer 3
    ],
    offset: 0,
    name: "MP3 (MPEG)",
  },
  // WAV (RIFF header)
  {
    signature: [[0x52, 0x49, 0x46, 0x46]], // "RIFF"
    offset: 0,
    name: "WAV",
  },
  // FLAC
  {
    signature: [[0x66, 0x4c, 0x61, 0x43]], // "fLaC"
    offset: 0,
    name: "FLAC",
  },
  // OGG (Ogg, Opus, Vorbis)
  {
    signature: [[0x4f, 0x67, 0x67, 0x53]], // "OggS"
    offset: 0,
    name: "OGG",
  },
  // M4A/MP4/AAC (Apple/QuickTime container)
  {
    signature: [
      [0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41], // "ftypM4A"
      [0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d], // "ftypisom"
      [0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32], // "ftypmp42"
    ],
    offset: 4, // After the 4-byte size field
    name: "M4A/MP4",
  },
  // AIFF
  {
    signature: [[0x46, 0x4f, 0x52, 0x4d]], // "FORM"
    offset: 0,
    name: "AIFF",
  },
  // WebM (Matroska-based)
  {
    signature: [[0x1a, 0x45, 0xdf, 0xa3]], // EBML header
    offset: 0,
    name: "WebM",
  },
];

/**
 * Check if a byte sequence matches any of the provided signatures
 */
function matchesSignature(
  buffer: Buffer,
  signatures: number[][],
  offset: number
): boolean {
  return signatures.some((sig) => {
    if (buffer.length < offset + sig.length) {
      return false;
    }
    return sig.every((byte, index) => buffer[offset + index] === byte);
  });
}

/**
 * Validate if a buffer contains audio file content
 * @param buffer - The file header buffer (first ~50 bytes is usually enough)
 * @returns Object with validation result and detected format
 */
export function validateAudioFile(buffer: Buffer): {
  isValid: boolean;
  format?: string;
  error?: string;
} {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      error: "Empty or invalid buffer",
    };
  }

  // Check against all known audio signatures
  for (const fileSignature of AUDIO_SIGNATURES) {
    if (
      matchesSignature(buffer, fileSignature.signature, fileSignature.offset)
    ) {
      return {
        isValid: true,
        format: fileSignature.name,
      };
    }
  }

  // Special case: WAV files need additional validation
  // RIFF header should be followed by "WAVE" at offset 8
  if (buffer.length >= 12) {
    const isRiff =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46;
    const isWave =
      buffer[8] === 0x57 &&
      buffer[9] === 0x41 &&
      buffer[10] === 0x56 &&
      buffer[11] === 0x45;

    if (isRiff && isWave) {
      return {
        isValid: true,
        format: "WAV (RIFF/WAVE)",
      };
    }
  }

  // Special case: AIFF files need additional validation
  // FORM header should be followed by "AIFF" or "AIFC" at offset 8
  if (buffer.length >= 12) {
    const isForm =
      buffer[0] === 0x46 &&
      buffer[1] === 0x4f &&
      buffer[2] === 0x52 &&
      buffer[3] === 0x4d;
    const isAiff =
      (buffer[8] === 0x41 &&
        buffer[9] === 0x49 &&
        buffer[10] === 0x46 &&
        buffer[11] === 0x46) || // "AIFF"
      (buffer[8] === 0x41 &&
        buffer[9] === 0x49 &&
        buffer[10] === 0x46 &&
        buffer[11] === 0x43); // "AIFC"

    if (isForm && isAiff) {
      return {
        isValid: true,
        format: "AIFF",
      };
    }
  }

  return {
    isValid: false,
    error: "File content does not match any known audio format signature",
  };
}

/**
 * Get a human-readable error message for validation failure
 */
export function getValidationErrorMessage(detectedBytes: Buffer): string {
  const bytesToCheck = detectedBytes.subarray(0, 8);
  const hexBytes = Array.from(bytesToCheck)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");

  return `Invalid audio file. The file content does not match any supported audio format. File signature: ${hexBytes}`;
}
