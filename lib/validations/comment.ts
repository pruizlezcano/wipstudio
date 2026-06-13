import { z } from "zod";

export const MAX_COMMENT_LENGTH = 1000;

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(MAX_COMMENT_LENGTH, "Comment too long"),
  timestamp: z.number().min(0).optional(), // Audio timestamp in seconds
  parentId: z.string().optional(), // For threaded replies
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(MAX_COMMENT_LENGTH, "Comment too long"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
