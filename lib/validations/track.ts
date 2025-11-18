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

export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;
