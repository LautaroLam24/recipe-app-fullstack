import { z } from 'zod';

export const updateRecipeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  ingredients: z
    .array(
      z.object({
        position: z.number().int().min(0),
        text: z.string().min(1).max(500),
      }),
    )
    .min(1)
    .optional(),
});
