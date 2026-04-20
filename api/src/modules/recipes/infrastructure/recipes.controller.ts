import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';
import { RecipesApplicationService } from '../application/recipes.application.service';
import { CloudinaryService } from './cloudinary.service';
import { createRecipeSchema } from './create-recipe.schema';
import { parseBody } from '../../../shared/parse-body';
import { updateRecipeSchema } from './update-recipe.schema';

function imageFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new BadRequestException('Solo se permiten imágenes'), false);
  }
  cb(null, true);
}

@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipes: RecipesApplicationService,
    private readonly cloudinary: CloudinaryService,
  ) {}

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

  @Patch(':id/image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se recibió ninguna imagen');
    const url = await this.cloudinary.upload(file);
    return this.recipes.updateRecipeImage(user.userId, id, url);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  async remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    await this.recipes.deleteRecipe(user.userId, id);
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

  @Get('feed')
  getPublicFeed() {
    return this.recipes.getPublicFeed();
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
