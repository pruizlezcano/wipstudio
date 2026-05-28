import { z } from "zod";

const dominantColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Dominant color must be a valid hex color");

const MAX_ARTWORK_LENGTH = 1_900_000;

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  artwork: z
    .string()
    .startsWith("data:image/", "Artwork must be an image data URL")
    .max(MAX_ARTWORK_LENGTH, "Artwork is too large")
    .nullable()
    .optional(),
  artworkDominantColor: dominantColorSchema.nullable().optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  artwork: z
    .string()
    .startsWith("data:image/", "Artwork must be an image data URL")
    .max(MAX_ARTWORK_LENGTH, "Artwork is too large")
    .nullable()
    .optional(),
  artworkDominantColor: dominantColorSchema.nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
