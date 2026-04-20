"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listMyRecipes, deleteRecipe, type Recipe } from "@/lib/api/recipes";
import { RecipeCard } from "@/features/recipes/recipe-card";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    listMyRecipes()
      .then((data) => {
        setRecipes(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const count = recipes.length;

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta receta? Esta acción no se puede deshacer.")) return;
    try {
      await deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("No se pudo eliminar la receta. Intentá de nuevo.");
    }
  }

  return (
    <main className="flex-1 bg-zinc-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Mis recetas</h1>
            {status === "ready" && (
              <p className="mt-0.5 text-sm text-zinc-500">
                {count > 0
                  ? `${count} receta${count !== 1 ? "s" : ""}`
                  : "Todavía sin recetas"}
              </p>
            )}
          </div>
          <Link
            href="/recipes/new"
            className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            + Nueva receta
          </Link>
        </div>

        {/* Loading skeleton */}
        {status === "loading" && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-zinc-200/70"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            No se pudieron cargar las recetas. Intentá de nuevo.
          </div>
        )}

        {/* Empty state */}
        {status === "ready" && count === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <span className="text-4xl" aria-hidden="true">
              🍽️
            </span>
            <div>
              <p className="font-medium text-zinc-900">
                Todavía no tenés recetas
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Creá tu primera receta y empezá tu colección.
              </p>
            </div>
            <Link
              href="/recipes/new"
              className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              + Crear primera receta
            </Link>
          </div>
        )}

        {/* List */}
        {status === "ready" && count > 0 && (
          <div className="flex flex-col gap-4">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} onDelete={() => handleDelete(r.id)} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
