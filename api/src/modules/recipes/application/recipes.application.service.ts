import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  RECIPE_REPOSITORY,
  type RecipeRepository,
} from '../domain/ports/recipe.repository';
import type { RecipeWithIngredients } from '../domain/recipe.types';

export type CreateRecipeInput = {
  title: string;
  description: string;
  ingredients: { position: number; text: string }[];
  steps: { position: number; text: string }[];
};

export type UpdateRecipeInput = {
  title?: string;
  description?: string;
  ingredients?: { position: number; text: string }[];
  steps?: { position: number; text: string }[];
};

@Injectable()
export class RecipesApplicationService {
  constructor(
    @Inject(RECIPE_REPOSITORY) private readonly recipes: RecipeRepository,
  ) {}

  private async assertOwnership(
    userId: string,
    recipeId: string,
  ): Promise<RecipeWithIngredients> {
    const recipe = await this.recipes.findById(recipeId);
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    if (recipe.ownerId !== userId) {
      throw new ForbiddenException('You do not own this recipe');
    }
    return recipe;
  }

  async createRecipe(ownerId: string, input: CreateRecipeInput) {
    const publicId = nanoid(10);
    return this.recipes.create({
      ownerId,
      publicId,
      title: input.title.trim(),
      description: input.description.trim(),
      ingredients: input.ingredients,
      steps: input.steps,
    });
  }

  async listMyRecipes(ownerId: string) {
    return this.recipes.findManyByOwner(ownerId);
  }

  async updateRecipe(
    userId: string,
    recipeId: string,
    input: UpdateRecipeInput,
  ) {
    await this.assertOwnership(userId, recipeId);
    return this.recipes.update(recipeId, {
      title: input.title?.trim(),
      description: input.description?.trim(),
      ingredients: input.ingredients,
      steps: input.steps,
    });
  }

  async getMyRecipe(userId: string, recipeId: string) {
    return this.assertOwnership(userId, recipeId);
  }

  async updateRecipeImage(userId: string, recipeId: string, imageUrl: string) {
    await this.assertOwnership(userId, recipeId);
    return this.recipes.update(recipeId, { imageUrl });
  }

  async getPublicRecipe(publicId: string) {
    const recipe = await this.recipes.findByPublicId(publicId);
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    return recipe;
  }

  async deleteRecipe(userId: string, recipeId: string): Promise<void> {
    await this.assertOwnership(userId, recipeId);
    await this.recipes.delete(recipeId);
  }

  async getPublicFeed() {
    return this.recipes.findAll();
  }
}
