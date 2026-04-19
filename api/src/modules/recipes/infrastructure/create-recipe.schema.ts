import { z } from 'zod';

const stepSchema = z.object({
  position: z.number().int().min(0),
  text: z.string().min(1).max(2000),
});

export const createRecipeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  ingredients: z
    .array(
      z.object({
        position: z.number().int().min(0),
        text: z.string().min(1).max(500),
      }),
    )
    .min(1),
  steps: z.array(stepSchema).min(1),
});
