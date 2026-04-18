"use client";

import { useFieldArray, type Control, type FieldErrors } from "react-hook-form";
import type { RecipeValues } from "./schemas";

type Props = {
  control: Control<RecipeValues>;
  errors: FieldErrors<RecipeValues>;
};

export function IngredientFields({ control, errors }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">
          Ingredientes
        </label>
        <button
          type="button"
          onClick={() => append({ text: "" })}
          className="text-xs text-zinc-500 underline hover:text-zinc-900"
        >
          + Agregar
        </button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <span className="mt-2 w-5 shrink-0 text-right text-xs text-zinc-400">
            {index + 1}.
          </span>
          <div className="flex-1">
            <input
              {...control.register(`ingredients.${index}.text`)}
              placeholder={`Ingrediente ${index + 1}`}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            {errors.ingredients?.[index]?.text && (
              <p className="mt-1 text-xs text-red-600">
                {errors.ingredients[index].text?.message}
              </p>
            )}
          </div>
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Eliminar ingrediente"
              className="mt-2 text-zinc-400 hover:text-red-500"
            >
              ×
            </button>
          )}
        </div>
      ))}

      {errors.ingredients?.root?.message && (
        <p className="text-xs text-red-600">
          {errors.ingredients.root.message}
        </p>
      )}
    </div>
  );
}
