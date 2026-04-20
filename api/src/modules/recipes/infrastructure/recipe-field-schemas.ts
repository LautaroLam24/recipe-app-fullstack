import { z } from 'zod';

export const ingredientSchema = z.object({
  position: z.number().int().min(0),
  text: z.string().min(1).max(500),
});

export const stepSchema = z.object({
  position: z.number().int().min(0),
  text: z.string().min(1).max(2000),
});
