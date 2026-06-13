import { z } from "zod";

export const MAX_LYRICS_COMMENT_LENGTH = 1000;

export const createLyricsCommentSchema = z.object({
  id: z.string(),
  content: z.string().min(1).max(MAX_LYRICS_COMMENT_LENGTH),
  parentId: z.string().optional(),
  // Position fields (only for top-level comments)
  rangeFrom: z.number().int().min(0).optional(),
  rangeTo: z.number().int().min(0).optional(),
  rangeText: z.string().optional(),
});

export const updateLyricsCommentSchema = z.object({
  content: z.string().min(1).max(MAX_LYRICS_COMMENT_LENGTH),
});

export type CreateLyricsCommentInput = z.infer<
  typeof createLyricsCommentSchema
>;
export type UpdateLyricsCommentInput = z.infer<
  typeof updateLyricsCommentSchema
>;
