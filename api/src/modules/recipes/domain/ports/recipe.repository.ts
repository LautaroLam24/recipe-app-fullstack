import type { Recipe, RecipeWithIngredients } from '../recipe.types';

export const RECIPE_REPOSITORY = Symbol('RECIPE_REPOSITORY');

export type CreateRecipeData = {
  ownerId: string;
  publicId: string;
  title: string;
  description: string;
  ingredients: { position: number; text: string }[];
  steps: { position: number; text: string }[];
};

export type UpdateRecipeData = {
  title?: string;
  description?: string;
  imageUrl?: string;
  ingredients?: { position: number; text: string }[];
  steps?: { position: number; text: string }[];
};

export interface RecipeRepository {
  create(data: CreateRecipeData): Promise<RecipeWithIngredients>;
  findManyByOwner(ownerId: string): Promise<Recipe[]>;
  findById(id: string): Promise<RecipeWithIngredients | null>;
  findByPublicId(publicId: string): Promise<RecipeWithIngredients | null>;
  update(id: string, data: UpdateRecipeData): Promise<RecipeWithIngredients>;
}
