import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateRecipeData,
  RecipeRepository,
  UpdateRecipeData,
} from '../domain/ports/recipe.repository';
import type { PublicFeedRecipe, Recipe, RecipeWithIngredients } from '../domain/recipe.types';

const publicSelect = {
  id: true,
  ownerId: true,
  publicId: true,
  title: true,
  description: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
};

const withIngredientsSelect = {
  ...publicSelect,
  ingredients: {
    orderBy: { position: 'asc' as const },
    select: { id: true, position: true, text: true },
  },
  steps: {
    orderBy: { position: 'asc' as const },
    select: { id: true, position: true, text: true },
  },
};

@Injectable()
export class PrismaRecipeRepository implements RecipeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRecipeData): Promise<RecipeWithIngredients> {
    return this.prisma.recipe.create({
      data: {
        ownerId: data.ownerId,
        publicId: data.publicId,
        title: data.title,
        description: data.description,
        ingredients: { create: data.ingredients },
        steps: { create: data.steps },
      },
      select: withIngredientsSelect,
    }) as Promise<RecipeWithIngredients>;
  }

  async findManyByOwner(ownerId: string): Promise<Recipe[]> {
    return this.prisma.recipe.findMany({
      where: { ownerId },
      select: publicSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<RecipeWithIngredients | null> {
    return this.prisma.recipe.findUnique({
      where: { id },
      select: withIngredientsSelect,
    }) as Promise<RecipeWithIngredients | null>;
  }

  async findByPublicId(publicId: string): Promise<RecipeWithIngredients | null> {
    return this.prisma.recipe.findUnique({
      where: { publicId },
      select: withIngredientsSelect,
    }) as Promise<RecipeWithIngredients | null>;
  }

  async update(id: string, data: UpdateRecipeData): Promise<RecipeWithIngredients> {
    return this.prisma.$transaction(async (tx) => {
      if (data.ingredients !== undefined) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
      }
      if (data.steps !== undefined) {
        await tx.recipeStep.deleteMany({ where: { recipeId: id } });
      }
      return tx.recipe.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.ingredients !== undefined && {
            ingredients: { create: data.ingredients },
          }),
          ...(data.steps !== undefined && {
            steps: { create: data.steps },
          }),
        },
        select: withIngredientsSelect,
      });
    }) as Promise<RecipeWithIngredients>;
  }

  async findAll(): Promise<PublicFeedRecipe[]> {
    return this.prisma.recipe.findMany({
      select: {
        publicId: true,
        title: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        owner: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
