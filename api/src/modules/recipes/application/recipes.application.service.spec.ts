import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecipesApplicationService } from './recipes.application.service';
import type { RecipeRepository } from '../domain/ports/recipe.repository';
import type { RecipeWithIngredients, PublicFeedRecipe } from '../domain/recipe.types';

const baseRecipe: RecipeWithIngredients = {
  id: 'recipe-1',
  ownerId: 'user-1',
  publicId: 'abc1234567',
  title: 'Tiramisú',
  description: 'Postre italiano',
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ingredients: [{ id: 'ing-1', position: 0, text: 'Mascarpone' }],
  steps: [{ id: 'step-1', position: 0, text: 'Separar claras' }],
};

function makeService() {
  const repo: jest.Mocked<RecipeRepository> = {
    create: jest.fn(),
    findManyByOwner: jest.fn(),
    findById: jest.fn(),
    findByPublicId: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  };

  const service = new RecipesApplicationService(repo);
  return { service, repo };
}

const recipeInput = {
  title: '  Tiramisú  ',
  description: '  Postre italiano  ',
  ingredients: [{ position: 0, text: 'Mascarpone' }],
  steps: [{ position: 0, text: 'Separar claras' }],
};

describe('RecipesApplicationService', () => {
  describe('createRecipe', () => {
    it('trims title and description before saving', async () => {
      const { service, repo } = makeService();
      repo.create.mockResolvedValue(baseRecipe);

      await service.createRecipe('user-1', recipeInput);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Tiramisú', description: 'Postre italiano' }),
      );
    });

    it('generates a publicId for the new recipe', async () => {
      const { service, repo } = makeService();
      repo.create.mockResolvedValue(baseRecipe);

      await service.createRecipe('user-1', recipeInput);

      const call = repo.create.mock.calls[0][0];
      expect(typeof call.publicId).toBe('string');
      expect(call.publicId.length).toBe(10);
    });

    it('passes ownerId from the caller', async () => {
      const { service, repo } = makeService();
      repo.create.mockResolvedValue(baseRecipe);

      await service.createRecipe('user-42', recipeInput);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'user-42' }),
      );
    });

    it('returns the created recipe', async () => {
      const { service, repo } = makeService();
      repo.create.mockResolvedValue(baseRecipe);

      const result = await service.createRecipe('user-1', recipeInput);
      expect(result).toEqual(baseRecipe);
    });
  });

  describe('listMyRecipes', () => {
    it('returns recipes for the given owner', async () => {
      const { service, repo } = makeService();
      repo.findManyByOwner.mockResolvedValue([baseRecipe]);

      const result = await service.listMyRecipes('user-1');

      expect(repo.findManyByOwner).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getMyRecipe', () => {
    it('throws NotFoundException if recipe does not exist', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(null);

      await expect(service.getMyRecipe('user-1', 'ghost-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException if caller is not the owner', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(baseRecipe);

      await expect(service.getMyRecipe('other-user', 'recipe-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns the recipe if caller is the owner', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(baseRecipe);

      const result = await service.getMyRecipe('user-1', 'recipe-1');
      expect(result).toEqual(baseRecipe);
    });
  });

  describe('updateRecipe', () => {
    it('throws NotFoundException if recipe does not exist', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(null);

      await expect(
        service.updateRecipe('user-1', 'ghost-id', { title: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if caller is not the owner', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(baseRecipe);

      await expect(
        service.updateRecipe('other-user', 'recipe-1', { title: 'Nuevo' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('trims title and description before updating', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(baseRecipe);
      repo.update.mockResolvedValue(baseRecipe);

      await service.updateRecipe('user-1', 'recipe-1', {
        title: '  Nuevo título  ',
        description: '  Nueva descripción  ',
      });

      expect(repo.update).toHaveBeenCalledWith(
        'recipe-1',
        expect.objectContaining({
          title: 'Nuevo título',
          description: 'Nueva descripción',
        }),
      );
    });

    it('calls update with the correct recipeId', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(baseRecipe);
      repo.update.mockResolvedValue(baseRecipe);

      await service.updateRecipe('user-1', 'recipe-1', { title: 'X' });

      expect(repo.update).toHaveBeenCalledWith('recipe-1', expect.anything());
    });
  });

  describe('updateRecipeImage', () => {
    it('throws NotFoundException if recipe does not exist', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(null);

      await expect(
        service.updateRecipeImage('user-1', 'ghost-id', '/uploads/img.png'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if caller is not the owner', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(baseRecipe);

      await expect(
        service.updateRecipeImage('other-user', 'recipe-1', '/uploads/img.png'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('calls update with the imageUrl', async () => {
      const { service, repo } = makeService();
      repo.findById.mockResolvedValue(baseRecipe);
      repo.update.mockResolvedValue({ ...baseRecipe, imageUrl: '/uploads/img.png' });

      await service.updateRecipeImage('user-1', 'recipe-1', '/uploads/img.png');

      expect(repo.update).toHaveBeenCalledWith('recipe-1', {
        imageUrl: '/uploads/img.png',
      });
    });
  });

  describe('getPublicRecipe', () => {
    it('throws NotFoundException if recipe does not exist', async () => {
      const { service, repo } = makeService();
      repo.findByPublicId.mockResolvedValue(null);

      await expect(service.getPublicRecipe('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the recipe when found', async () => {
      const { service, repo } = makeService();
      repo.findByPublicId.mockResolvedValue(baseRecipe);

      const result = await service.getPublicRecipe('abc1234567');
      expect(result).toEqual(baseRecipe);
      expect(repo.findByPublicId).toHaveBeenCalledWith('abc1234567');
    });
  });

  describe('getPublicFeed', () => {
    it('returns all recipes from the repository', async () => {
      const { service, repo } = makeService();
      const feed: PublicFeedRecipe[] = [
        {
          publicId: 'abc1234567',
          title: 'Tiramisú',
          description: 'Postre italiano',
          imageUrl: null,
          createdAt: new Date(),
          owner: { firstName: 'Juan', lastName: 'Pérez' },
        },
      ];
      repo.findAll.mockResolvedValue(feed);

      const result = await service.getPublicFeed();
      expect(result).toEqual(feed);
      expect(repo.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
