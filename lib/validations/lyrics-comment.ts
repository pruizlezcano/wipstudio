import { z } from "zod";

export const createLyricsCommentSchema = z.object({
  id: z.string(),
  content: z.string().min(1).max(1000),
  parentId: z.string().optional(),
  // Position fields (only for top-level comments)
  rangeFrom: z.number().int().min(0).optional(),
  rangeTo: z.number().int().min(0).optional(),
  rangeText: z.string().optional(),
});

export const updateLyricsCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export type CreateLyricsCommentInput = z.infer<typeof createLyricsCommentSchema>;
export type UpdateLyricsCommentInput = z.infer<typeof updateLyricsCommentSchema>;
