"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listMyRecipes, type Recipe } from "@/lib/api/recipes";
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

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Mis recetas</h1>
        <Link
          href="/recipes/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + Nueva receta
        </Link>
      </div>

      {status === "loading" && (
        <p className="text-sm text-zinc-500">Cargando recetas…</p>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600">
          No se pudieron cargar las recetas.
        </p>
      )}

      {status === "ready" && recipes.length === 0 && (
        <p className="text-sm text-zinc-500">
          Todavía no tenés recetas.{" "}
          <Link href="/recipes/new" className="underline hover:text-zinc-900">
            Creá la primera.
          </Link>
        </p>
      )}

      {status === "ready" && recipes.length > 0 && (
        <div className="flex flex-col gap-4">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </main>
  );
}
