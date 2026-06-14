import { z } from "zod";

export const MAX_VERSION_NOTES_LENGTH = 1000;

export const createTrackVersionSchema = z.object({
  audioUrl: z.string().min(1), // S3 object key
  waveformPeaks: z.array(z.array(z.number())).optional(),
  notes: z.string().max(MAX_VERSION_NOTES_LENGTH).optional(),
});

export const updateTrackVersionSchema = z.object({
  notes: z.string().max(MAX_VERSION_NOTES_LENGTH).optional(),
});

export const setMasterVersionSchema = z.object({
  isMaster: z.boolean(),
});
