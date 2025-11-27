import { z } from "zod";

// Allowed audio MIME types
const ALLOWED_AUDIO_MIMETYPES = [
  "audio/mpeg",           // MP3
  "audio/mp3",            // MP3 (alternative)
  "audio/wav",            // WAV
  "audio/wave",           // WAV (alternative)
  "audio/x-wav",          // WAV (alternative)
  "audio/aiff",           // AIFF
  "audio/x-aiff",         // AIFF (alternative)
  "audio/flac",           // FLAC
  "audio/x-flac",         // FLAC (alternative)
  "audio/ogg",            // OGG
  "audio/aac",            // AAC
  "audio/mp4",            // M4A/MP4 audio
  "audio/x-m4a",          // M4A (alternative)
  "audio/webm",           // WebM audio
  "audio/opus",           // Opus
  "audio/x-ms-wma",       // WMA
] as const;

// Allowed audio file extensions
const ALLOWED_AUDIO_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".wave",
  ".aiff",
  ".aif",
  ".flac",
  ".ogg",
  ".oga",
  ".aac",
  ".m4a",
  ".mp4",
  ".webm",
  ".opus",
  ".wma",
] as const;

// Validation helper for audio file type
const audioFileTypeValidator = z.string().refine(
  (fileType) => ALLOWED_AUDIO_MIMETYPES.includes(fileType as any),
  {
    message: `Invalid audio file type. Allowed types: ${ALLOWED_AUDIO_MIMETYPES.join(", ")}`,
  }
);

// Validation helper for audio file extension
const audioFileNameValidator = z.string().min(1, "File name is required").refine(
  (fileName) => {
    const extension = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
    return ALLOWED_AUDIO_EXTENSIONS.includes(extension as any);
  },
  {
    message: `Invalid audio file extension. Allowed extensions: ${ALLOWED_AUDIO_EXTENSIONS.join(", ")}`,
  }
);

export const createTrackSchema = z.object({
  name: z.string().min(1, "Track name is required").max(100, "Track name must be less than 100 characters"),
  projectId: z.uuid("Invalid project ID"),
  // Initial version data
  audioUrl: z.string().min(1, "Audio URL is required"), // S3 object key
  notes: z.string().optional(),
});

export const updateTrackSchema = z.object({
  name: z.string().min(1, "Track name is required").max(100, "Track name must be less than 100 characters").optional(),
});

export const uploadRequestSchema = z.object({
  fileName: audioFileNameValidator,
  fileType: audioFileTypeValidator,
  projectId: z.uuid("Invalid project ID"),
});

// Multipart upload validation schemas
export const initiateMultipartUploadSchema = z.object({
  fileName: audioFileNameValidator,
  fileType: audioFileTypeValidator,
  projectId: z.uuid("Invalid project ID"),
});

export const getChunkUrlsSchema = z.object({
  objectKey: z.string().min(1, "Object key is required"),
  uploadId: z.string().min(1, "Upload ID is required"),
  projectId: z.uuid("Invalid project ID"),
  partNumbers: z.array(z.number().int().positive()).min(1, "At least one part number is required"),
});

export const completeMultipartUploadSchema = z.object({
  objectKey: z.string().min(1, "Object key is required"),
  uploadId: z.string().min(1, "Upload ID is required"),
  projectId: z.uuid("Invalid project ID"),
  parts: z.array(z.object({
    PartNumber: z.number().int().positive(),
    ETag: z.string().min(1, "ETag is required"),
  })).min(1, "At least one part is required"),
});

export const abortMultipartUploadSchema = z.object({
  objectKey: z.string().min(1, "Object key is required"),
  uploadId: z.string().min(1, "Upload ID is required"),
  projectId: z.uuid("Invalid project ID"),
});

export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;
export type InitiateMultipartUploadInput = z.infer<typeof initiateMultipartUploadSchema>;
export type GetChunkUrlsInput = z.infer<typeof getChunkUrlsSchema>;
export type CompleteMultipartUploadInput = z.infer<typeof completeMultipartUploadSchema>;
export type AbortMultipartUploadInput = z.infer<typeof abortMultipartUploadSchema>;
