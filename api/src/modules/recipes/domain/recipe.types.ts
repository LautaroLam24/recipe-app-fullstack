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
  createdAt: Date;
  updatedAt: Date;
};

export type RecipeWithIngredients = Recipe & {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};
