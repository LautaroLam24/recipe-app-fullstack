import Link from "next/link";
import type { Recipe } from "@/lib/api/recipes";

type Props = {
  recipe: Recipe;
};

export function RecipeCard({ recipe }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div>
        <h2 className="font-semibold text-zinc-900">{recipe.title}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
          {recipe.description}
        </p>
      </div>
      <div className="flex gap-4 text-sm">
        <Link
          href={`/recipes/${recipe.id}/edit`}
          className="font-medium text-zinc-900 underline hover:text-zinc-600"
        >
          Editar
        </Link>
        <Link
          href={`/r/${recipe.publicId}`}
          target="_blank"
          className="text-zinc-500 hover:text-zinc-900"
        >
          Ver link público ↗
        </Link>
      </div>
    </div>
  );
}
