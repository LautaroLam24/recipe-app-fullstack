import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { nanoid } from 'nanoid';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';
import { RecipesApplicationService } from '../application/recipes.application.service';
import { createRecipeSchema } from './create-recipe.schema';
import { parseBody } from './parse-body';
import { updateRecipeSchema } from './update-recipe.schema';

const imageStorage = diskStorage({
  destination: './uploads',
  filename: (_req, _file, cb) => {
    cb(null, `${nanoid(12)}${extname(_file.originalname)}`);
  },
});

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

  @Patch(':id/image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('image', {
      storage: imageStorage,
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se recibió ninguna imagen');
    return this.recipes.updateRecipeImage(user.userId, id, `/uploads/${file.filename}`);
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
