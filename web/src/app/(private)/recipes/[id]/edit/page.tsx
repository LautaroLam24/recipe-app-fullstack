"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { RecipeForm } from "@/features/recipes/recipe-form";
import {
  getMyRecipeById,
  updateRecipe,
  uploadRecipeImage,
  toPositioned,
  type RecipeWithIngredients,
} from "@/lib/api/recipes";
import { ApiError, resolveImageUrl } from "@/lib/api/client";
import type { RecipeValues } from "@/features/recipes/schemas";

export default function EditRecipePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        ingredients: toPositioned(data.ingredients),
        steps: toPositioned(data.steps),
      });
      router.push("/recipes");
      router.refresh();
    } catch (e) {
      setServerError(
        e instanceof ApiError ? e.message : "Error al guardar los cambios.",
      );
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus("uploading");
    setUploadError(null);
    try {
      const updated = await uploadRecipeImage(id, file);
      setRecipe((prev) => (prev ? { ...prev, imageUrl: updated.imageUrl } : prev));
      setUploadStatus("idle");
    } catch (err) {
      setUploadError(
        err instanceof ApiError ? err.message : "Error al subir la imagen.",
      );
      setUploadStatus("error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const imageUrl = resolveImageUrl(recipe?.imageUrl ?? null);

  return (
    <main className="flex-1 bg-zinc-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 flex flex-col gap-6">
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
          <p className="text-sm text-red-600">No se pudo cargar la receta.</p>
        )}

        {loadStatus === "ready" && recipe && (
          <>
            {/* Image section */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-700">
                    Imagen de portada
                  </p>
                  <p className="text-xs text-zinc-400">
                    JPG, PNG o WebP · máx. 5 MB
                  </p>
                </div>
                <button
                  type="button"
                  disabled={uploadStatus === "uploading"}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                >
                  {uploadStatus === "uploading"
                    ? "Subiendo…"
                    : imageUrl
                      ? "Cambiar imagen"
                      : "Subir imagen"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {imageUrl && (
                <div className="relative h-48 w-full overflow-hidden rounded-xl">
                  <Image
                    src={imageUrl}
                    alt="Imagen de portada"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}

              {uploadStatus === "error" && uploadError && (
                <p className="text-xs text-red-600">{uploadError}</p>
              )}
            </div>

            {/* Recipe form */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <RecipeForm
                defaultValues={{
                  title: recipe.title,
                  description: recipe.description,
                  ingredients: recipe.ingredients.map((ing) => ({
                    text: ing.text,
                  })),
                  steps: recipe.steps.map((step) => ({ text: step.text })),
                }}
                onSubmit={handleSubmit}
                submitLabel="Guardar cambios"
                serverError={serverError}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
