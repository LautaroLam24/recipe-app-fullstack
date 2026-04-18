import { notFound } from "next/navigation";
import { getPublicRecipe } from "@/lib/api/recipes";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ publicId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  try {
    const recipe = await getPublicRecipe(publicId);
    return { title: recipe.title };
  } catch {
    return { title: "Receta no encontrada" };
  }
}

export default async function PublicRecipePage({ params }: Props) {
  const { publicId } = await params;

  let recipe;
  try {
    recipe = await getPublicRecipe(publicId);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">{recipe.title}</h1>
        <p className="mt-3 text-zinc-700 whitespace-pre-wrap">
          {recipe.description}
        </p>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-zinc-900">Ingredientes</h2>
        <ul className="flex flex-col gap-2">
          {recipe.ingredients.map((ing) => (
            <li key={ing.id} className="flex gap-3 text-sm text-zinc-700">
              <span className="shrink-0 text-zinc-400">{ing.position + 1}.</span>
              <span>{ing.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
