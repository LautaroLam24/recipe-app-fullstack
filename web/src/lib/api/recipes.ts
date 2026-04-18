import { apiJson } from "./client";

export type RecipeIngredient = {
  id: string;
  position: number;
  text: string;
};

export type Recipe = {
  id: string;
  ownerId: string;
  publicId: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type RecipeWithIngredients = Recipe & {
  ingredients: RecipeIngredient[];
};

export type RecipeInput = {
  title: string;
  description: string;
  ingredients: { position: number; text: string }[];
};

export async function createRecipe(
  input: RecipeInput,
): Promise<RecipeWithIngredients> {
  return apiJson<RecipeWithIngredients>("/recipes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listMyRecipes(): Promise<Recipe[]> {
  return apiJson<Recipe[]>("/recipes");
}

export async function getMyRecipeById(
  id: string,
): Promise<RecipeWithIngredients> {
  return apiJson<RecipeWithIngredients>(`/recipes/details/${id}`);
}

export async function updateRecipe(
  id: string,
  input: Partial<RecipeInput>,
): Promise<RecipeWithIngredients> {
  return apiJson<RecipeWithIngredients>(`/recipes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getPublicRecipe(
  publicId: string,
): Promise<RecipeWithIngredients> {
  return apiJson<RecipeWithIngredients>(`/recipes/${publicId}`);
}
