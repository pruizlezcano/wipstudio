import { z } from "zod";

export const createTrackVersionSchema = z.object({
  audioUrl: z.string().min(1), // S3 object key
  notes: z.string().optional(),
});

export const updateTrackVersionSchema = z.object({
  notes: z.string().optional(),
});
