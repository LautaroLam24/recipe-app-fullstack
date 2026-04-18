import Link from "next/link";
import type { Recipe } from "@/lib/api/recipes";

type Props = {
  recipe: Recipe;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RecipeCard({ recipe }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-semibold leading-tight text-zinc-900">
            {recipe.title}
          </h2>
          <span className="mt-0.5 shrink-0 text-xs text-zinc-400">
            {formatDate(recipe.createdAt)}
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-500">
          {recipe.description}
        </p>
      </div>

      <div className="flex items-center gap-1 border-t border-zinc-100 pt-3">
        <Link
          href={`/recipes/${recipe.id}/edit`}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Editar
        </Link>
        <Link
          href={`/r/${recipe.publicId}`}
          target="_blank"
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100"
        >
          Link público
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
