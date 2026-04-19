"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { IngredientFields } from "./ingredient-fields";
import { StepFields } from "./step-fields";
import { recipeSchema, type RecipeValues } from "./schemas";

type Props = {
  defaultValues?: RecipeValues;
  onSubmit: (data: RecipeValues) => Promise<void>;
  submitLabel: string;
  serverError?: string | null;
};

export function RecipeForm({
  defaultValues,
  onSubmit,
  submitLabel,
  serverError,
}: Props) {
  const form = useForm<RecipeValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: defaultValues ?? {
      title: "",
      description: "",
      ingredients: [{ text: "" }],
      steps: [{ text: "" }],
    },
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Título</label>
        <input
          {...form.register("title")}
          placeholder="Ej: Milanesa napolitana"
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        {errors.title && (
          <p className="text-xs text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Descripción</label>
        <textarea
          {...form.register("description")}
          rows={3}
          placeholder="Una breve introducción al plato, su origen, para cuántas personas…"
          className="resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        {errors.description && (
          <p className="text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="h-px bg-zinc-100" />

      <IngredientFields control={form.control} errors={errors} />

      <div className="h-px bg-zinc-100" />

      <StepFields control={form.control} errors={errors} />

      {serverError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {isSubmitting ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
