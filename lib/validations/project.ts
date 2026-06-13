import { z } from "zod";

export const MAX_PROJECT_NAME_LENGTH = 100;
export const MAX_PROJECT_DESCRIPTION_LENGTH = 500;

const dominantColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Dominant color must be a valid hex color");

const MAX_ARTWORK_LENGTH = 1_900_000;

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(
      MAX_PROJECT_NAME_LENGTH,
      `Project name must be less than ${MAX_PROJECT_NAME_LENGTH} characters`
    ),
  description: z
    .string()
    .max(
      MAX_PROJECT_DESCRIPTION_LENGTH,
      `Description must be less than ${MAX_PROJECT_DESCRIPTION_LENGTH} characters`
    )
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
    .max(
      MAX_PROJECT_NAME_LENGTH,
      `Project name must be less than ${MAX_PROJECT_NAME_LENGTH} characters`
    )
    .optional(),
  description: z
    .string()
    .max(
      MAX_PROJECT_DESCRIPTION_LENGTH,
      `Description must be less than ${MAX_PROJECT_DESCRIPTION_LENGTH} characters`
    )
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
