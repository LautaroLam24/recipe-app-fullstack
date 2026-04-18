"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecipeForm } from "@/features/recipes/recipe-form";
import { createRecipe } from "@/lib/api/recipes";
import { ApiError } from "@/lib/api/client";
import type { RecipeValues } from "@/features/recipes/schemas";

export default function NewRecipePage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(data: RecipeValues) {
    setServerError(null);
    try {
      await createRecipe({
        title: data.title,
        description: data.description,
        ingredients: data.ingredients.map((ing, i) => ({
          position: i,
          text: ing.text,
        })),
      });
      router.push("/recipes");
      router.refresh();
    } catch (e) {
      setServerError(
        e instanceof ApiError ? e.message : "Error al crear la receta.",
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 flex flex-col gap-6">
      <div>
        <Link
          href="/recipes"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Mis recetas
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-zinc-900">Nueva receta</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Completá los datos de tu receta.
        </p>
      </div>
      <RecipeForm
        onSubmit={handleSubmit}
        submitLabel="Crear receta"
        serverError={serverError}
      />
    </main>
  );
}
