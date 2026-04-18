import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';
import { RecipesApplicationService } from '../application/recipes.application.service';
import { createRecipeSchema } from './create-recipe.schema';
import { parseBody } from './parse-body';
import { updateRecipeSchema } from './update-recipe.schema';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipes: RecipesApplicationService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(
    @CurrentUser() user: { userId: string },
    @Body() body: unknown,
  ) {
    const dto = parseBody(createRecipeSchema, body);
    return this.recipes.createRecipe(user.userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  listMine(@CurrentUser() user: { userId: string }) {
    return this.recipes.listMyRecipes(user.userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = parseBody(updateRecipeSchema, body);
    return this.recipes.updateRecipe(user.userId, id, dto);
  }

  @Get('details/:id')
  @UseGuards(AuthGuard('jwt'))
  getMyById(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.recipes.getMyRecipe(user.userId, id);
  }

  @Get(':publicId')
  getPublic(@Param('publicId') publicId: string) {
    return this.recipes.getPublicRecipe(publicId);
  }
}
