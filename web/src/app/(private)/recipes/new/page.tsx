"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { RecipeForm } from "@/features/recipes/recipe-form";
import { createRecipe, uploadRecipeImage } from "@/lib/api/recipes";
import { ApiError } from "@/lib/api/client";
import type { RecipeValues } from "@/features/recipes/schemas";

export default function NewRecipePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(data: RecipeValues) {
    setServerError(null);
    try {
      const recipe = await createRecipe({
        title: data.title,
        description: data.description,
        ingredients: data.ingredients.map((ing, i) => ({
          position: i,
          text: ing.text,
        })),
        steps: data.steps.map((step, i) => ({
          position: i,
          text: step.text,
        })),
      });

      if (pendingImage) {
        await uploadRecipeImage(recipe.id, pendingImage);
      }

      router.push("/recipes");
      router.refresh();
    } catch (e) {
      setServerError(
        e instanceof ApiError ? e.message : "Error al crear la receta.",
      );
    }
  }

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
          <h1 className="mt-3 text-2xl font-bold text-zinc-900">Nueva receta</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Completá los datos de tu receta.
          </p>
        </div>

        {/* Image section */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-700">
                Imagen de portada
              </p>
              <p className="text-xs text-zinc-400">
                JPG, PNG o WebP · máx. 5 MB · opcional
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              {previewUrl ? "Cambiar imagen" : "Subir imagen"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {previewUrl && (
            <div className="relative h-48 w-full overflow-hidden rounded-xl">
              <Image
                src={previewUrl}
                alt="Vista previa"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <RecipeForm
            onSubmit={handleSubmit}
            submitLabel="Crear receta"
            serverError={serverError}
          />
        </div>
      </div>
    </main>
  );
}
