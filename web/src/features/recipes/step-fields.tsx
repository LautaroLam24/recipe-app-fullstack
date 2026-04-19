"use client";

import { useFieldArray, type Control, type FieldErrors } from "react-hook-form";
import type { RecipeValues } from "./schemas";

type Props = {
  control: Control<RecipeValues>;
  errors: FieldErrors<RecipeValues>;
};

export function StepFields({ control, errors }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps",
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">Paso a paso</label>
        <button
          type="button"
          onClick={() => append({ text: "" })}
          className="text-xs text-zinc-500 underline hover:text-zinc-900"
        >
          + Agregar paso
        </button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-3">
          <span className="mt-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-500">
            {index + 1}
          </span>
          <div className="flex-1">
            <textarea
              {...control.register(`steps.${index}.text`)}
              rows={3}
              placeholder={`Describí el paso ${index + 1}…`}
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            {errors.steps?.[index]?.text && (
              <p className="mt-1 text-xs text-red-600">
                {errors.steps[index].text?.message}
              </p>
            )}
          </div>
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Eliminar paso"
              className="mt-2.5 text-zinc-400 hover:text-red-500"
            >
              ×
            </button>
          )}
        </div>
      ))}

      {errors.steps?.root?.message && (
        <p className="text-xs text-red-600">{errors.steps.root.message}</p>
      )}
    </div>
  );
}
