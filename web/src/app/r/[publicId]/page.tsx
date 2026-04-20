import { notFound } from "next/navigation";
import { getPublicRecipe } from "@/lib/api/recipes";
import { resolveImageUrl } from "@/lib/api/client";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

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

  const imageUrl = resolveImageUrl(recipe.imageUrl);

  return (
    <main className="flex-1 bg-zinc-50">
      {/* Hero image */}
      {imageUrl && (
        <div className="relative h-64 w-full overflow-hidden bg-zinc-100 sm:h-80">
          <Image
            src={imageUrl}
            alt={recipe.title}
            fill
            unoptimized
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl px-4 py-10 flex flex-col gap-8">
        {/* Title + description */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-zinc-900">{recipe.title}</h1>
          {recipe.description && (
            <p className="max-w-2xl text-zinc-600 leading-relaxed">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Left: ingredients */}
          <aside className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col gap-4 lg:self-start lg:sticky lg:top-20">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Ingredientes
            </h2>
            <ul className="flex flex-col gap-2">
              {recipe.ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="flex items-start gap-2.5 border-b border-zinc-50 pb-2 last:border-0 last:pb-0"
                >
                  <span className="mt-px text-zinc-300">·</span>
                  <span className="text-sm text-zinc-700 leading-snug">
                    {ing.text}
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          {/* Right: steps */}
          <div className="flex flex-col gap-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Paso a paso
            </h2>
            <ol className="flex flex-col gap-6">
              {recipe.steps.map((step) => (
                <li key={step.id} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white mt-0.5">
                    {step.position + 1}
                  </span>
                  <p className="text-sm text-zinc-700 leading-relaxed pt-1 whitespace-pre-wrap">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Backlink */}
        <div className="border-t border-zinc-200 pt-4">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            ← Compartido desde Recetario
          </Link>
        </div>
      </div>
    </main>
  );
}
