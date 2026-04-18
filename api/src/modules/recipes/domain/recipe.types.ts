export type RecipeIngredient = {
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
  createdAt: Date;
  updatedAt: Date;
};

export type RecipeWithIngredients = Recipe & {
  ingredients: RecipeIngredient[];
};
