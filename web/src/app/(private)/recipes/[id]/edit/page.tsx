"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { RecipeForm } from "@/features/recipes/recipe-form";
import { getMyRecipeById, updateRecipe, type RecipeWithIngredients } from "@/lib/api/recipes";
import { ApiError } from "@/lib/api/client";
import type { RecipeValues } from "@/features/recipes/schemas";

export default function EditRecipePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    getMyRecipeById(id)
      .then((data) => {
        setRecipe(data);
        setLoadStatus("ready");
      })
      .catch(() => setLoadStatus("error"));
  }, [id]);

  async function handleSubmit(data: RecipeValues) {
    setServerError(null);
    try {
      await updateRecipe(id, {
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
        e instanceof ApiError ? e.message : "Error al guardar los cambios.",
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
        <h1 className="mt-3 text-2xl font-bold text-zinc-900">
          Editar receta
        </h1>
      </div>

      {loadStatus === "loading" && (
        <p className="text-sm text-zinc-500">Cargando receta…</p>
      )}

      {loadStatus === "error" && (
        <p className="text-sm text-red-600">
          No se pudo cargar la receta.
        </p>
      )}

      {loadStatus === "ready" && recipe && (
        <RecipeForm
          defaultValues={{
            title: recipe.title,
            description: recipe.description,
            ingredients: recipe.ingredients.map((ing) => ({ text: ing.text })),
          }}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
          serverError={serverError}
        />
      )}
    </main>
  );
}
