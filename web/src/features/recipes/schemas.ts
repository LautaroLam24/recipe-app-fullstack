import { z } from "zod";

export const recipeSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(200),
  description: z.string().min(1, "La descripción es obligatoria").max(2000),
  ingredients: z
    .array(
      z.object({
        text: z
          .string()
          .min(1, "El ingrediente no puede estar vacío")
          .max(500),
      }),
    )
    .min(1, "Agregá al menos un ingrediente"),
  steps: z
    .array(
      z.object({
        text: z
          .string()
          .min(1, "El paso no puede estar vacío")
          .max(2000),
      }),
    )
    .min(1, "Agregá al menos un paso"),
});

export type RecipeValues = z.infer<typeof recipeSchema>;
