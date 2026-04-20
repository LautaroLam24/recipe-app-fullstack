"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { getPublicFeed, type PublicFeedRecipe } from "@/lib/api/recipes";
import { getApiBaseUrl } from "@/lib/api/client";
import Link from "next/link";
import Image from "next/image";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FeedCard({ recipe }: { recipe: PublicFeedRecipe }) {
  const imageUrl = recipe.imageUrl
    ? `${getApiBaseUrl()}${recipe.imageUrl}`
    : null;

  return (
    <Link
      href={`/r/${recipe.publicId}`}
      className="group flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-shadow hover:shadow-md"
    >
      {imageUrl ? (
        <div className="relative h-44 w-full bg-zinc-100 overflow-hidden">
          <Image
            src={imageUrl}
            alt={recipe.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-zinc-50 text-4xl">
          🍽️
        </div>
      )}

      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-semibold text-zinc-900 leading-snug line-clamp-1">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">
            {recipe.description}
          </p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            {recipe.owner.firstName} {recipe.owner.lastName}
          </span>
          <time className="text-xs tabular-nums text-zinc-400">
            {formatDate(recipe.createdAt)}
          </time>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { user, status } = useAuth();
  const [feed, setFeed] = useState<PublicFeedRecipe[]>([]);
  const [feedStatus, setFeedStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    getPublicFeed()
      .then((data) => {
        setFeed(data);
        setFeedStatus("ready");
      })
      .catch(() => setFeedStatus("ready"));
  }, []);

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="bg-linear-to-b from-white to-amber-50/50 px-4 py-14 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
            🍳 Tu recetario personal
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Guardá y compartí tus{" "}
            <span className="text-amber-500">recetas favoritas</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-zinc-500">
            Explorá las recetas de la comunidad o creá las tuyas y compartí cada
            plato con un link único.
          </p>
          {status !== "loading" && (
            <div className="flex flex-col gap-3 sm:flex-row">
              {user ? (
                <>
                  <Link
                    href="/recipes"
                    className="rounded-xl bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-700"
                  >
                    Mis recetas →
                  </Link>
                  <Link
                    href="/recipes/new"
                    className="rounded-xl border border-zinc-300 px-6 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    + Nueva receta
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="rounded-xl bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-700"
                  >
                    Empezar gratis →
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl border border-zinc-300 px-6 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    Iniciar sesión
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Feed */}
      <section className="flex-1 border-t border-zinc-100 bg-zinc-50 px-4 py-10">
        <div className="mx-auto max-w-5xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">
              Recetas de la comunidad
            </h2>
            {feedStatus === "ready" && feed.length > 0 && (
              <span className="text-sm text-zinc-400">
                {feed.length} {feed.length === 1 ? "receta" : "recetas"}
              </span>
            )}
          </div>

          {feedStatus === "loading" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl bg-zinc-200"
                />
              ))}
            </div>
          )}

          {feedStatus === "ready" && feed.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 py-16 text-center">
              <span className="text-4xl">🍽️</span>
              <p className="text-sm text-zinc-500">
                Todavía no hay recetas publicadas.{" "}
                {!user && (
                  <Link href="/register" className="text-amber-600 hover:underline">
                    ¡Sé el primero!
                  </Link>
                )}
              </p>
            </div>
          )}

          {feedStatus === "ready" && feed.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {feed.map((recipe) => (
                <FeedCard key={recipe.publicId} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
