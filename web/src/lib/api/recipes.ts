import { apiJson, apiUpload } from "./client";

export type RecipeIngredient = {
  id: string;
  position: number;
  text: string;
};

export type RecipeStep = {
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
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecipeWithIngredients = Recipe & {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

export type RecipeInput = {
  title: string;
  description: string;
  ingredients: { position: number; text: string }[];
  steps: { position: number; text: string }[];
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

export type PublicFeedRecipe = {
  publicId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  createdAt: string;
  owner: { firstName: string; lastName: string };
};

export async function deleteRecipe(id: string): Promise<void> {
  await apiJson<void>(`/recipes/${id}`, { method: "DELETE" });
}

export async function getPublicFeed(): Promise<PublicFeedRecipe[]> {
  return apiJson<PublicFeedRecipe[]>("/recipes/feed");
}

export async function uploadRecipeImage(
  id: string,
  file: File,
): Promise<RecipeWithIngredients> {
  const formData = new FormData();
  formData.append("image", file);
  return apiUpload<RecipeWithIngredients>(`/recipes/${id}/image`, formData);
}
