import { z } from "zod";

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
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  projectId: z.uuid("Invalid project ID"),
});

// Multipart upload validation schemas
export const initiateMultipartUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
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
