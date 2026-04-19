import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/lib/api/recipes";
import { getApiBaseUrl } from "@/lib/api/client";

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
  const imageUrl = recipe.imageUrl
    ? `${getApiBaseUrl()}${recipe.imageUrl}`
    : null;

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white transition-shadow hover:shadow-md">
      <div className="flex gap-4 p-5">
        <div className="flex flex-1 flex-col gap-2 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-[15px] font-semibold leading-tight text-zinc-900">
              {recipe.title}
            </h2>
            <time className="shrink-0 pt-0.5 text-xs tabular-nums text-zinc-400">
              {formatDate(recipe.createdAt)}
            </time>
          </div>
          {recipe.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-zinc-500">
              {recipe.description}
            </p>
          )}
        </div>

        {imageUrl && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={imageUrl}
              alt={recipe.title}
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
        <Link
          href={`/recipes/${recipe.id}/edit`}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          Editar
        </Link>
        <Link
          href={`/r/${recipe.publicId}`}
          target="_blank"
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600"
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
