import { z } from "zod";

export const createTrackVersionSchema = z.object({
  audioUrl: z.string().min(1), // S3 object key
  waveformPeaks: z.array(z.array(z.number())).optional(),
  notes: z.string().optional(),
});

export const updateTrackVersionSchema = z.object({
  notes: z.string().optional(),
});

export const setMasterVersionSchema = z.object({
  isMaster: z.boolean(),
});
