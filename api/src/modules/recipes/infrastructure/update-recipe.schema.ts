import { z } from 'zod';
import { ingredientSchema, stepSchema } from './recipe-field-schemas';

export const updateRecipeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  ingredients: z.array(ingredientSchema).min(1).optional(),
  steps: z.array(stepSchema).min(1).optional(),
});
