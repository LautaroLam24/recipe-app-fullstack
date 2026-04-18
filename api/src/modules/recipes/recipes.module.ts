import { Module } from '@nestjs/common';
import { RecipesApplicationService } from './application/recipes.application.service';
import { RECIPE_REPOSITORY } from './domain/ports/recipe.repository';
import { PrismaRecipeRepository } from './infrastructure/prisma-recipe.repository';
import { RecipesController } from './infrastructure/recipes.controller';

@Module({
  controllers: [RecipesController],
  providers: [
    RecipesApplicationService,
    { provide: RECIPE_REPOSITORY, useClass: PrismaRecipeRepository },
  ],
})
export class RecipesModule {}
