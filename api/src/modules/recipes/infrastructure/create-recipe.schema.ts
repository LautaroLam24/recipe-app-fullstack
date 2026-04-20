import { z } from 'zod';
import { ingredientSchema, stepSchema } from './recipe-field-schemas';

export const createRecipeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(stepSchema).min(1),
});
