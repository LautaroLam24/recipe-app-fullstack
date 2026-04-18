"use client";

import { useAuth } from "@/features/auth/auth-context";
import Link from "next/link";

const features = [
  {
    icon: "📝",
    title: "Organizá tus recetas",
    desc: "Creá y guardá todas tus recetas en un solo lugar. Título, descripción e ingredientes ordenados.",
  },
  {
    icon: "🔗",
    title: "Compartí con un link",
    desc: "Cada receta tiene un link público único. Compartila con quien quieras, sin que necesiten cuenta.",
  },
  {
    icon: "✏️",
    title: "Editá cuando quieras",
    desc: "Actualizá ingredientes, pasos y descripción en cualquier momento. Los cambios se reflejan al instante.",
  },
];

export default function HomePage() {
  const { user, status } = useAuth();

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-white to-amber-50/50 px-4 py-24 text-center">
        <div className="flex max-w-2xl flex-col items-center gap-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
            🍳 Tu recetario personal
          </span>

          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Guardá y compartí tus{" "}
            <span className="text-amber-500">recetas favoritas</span>
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-zinc-500">
            Organizá tu colección, editala cuando quieras y compartí cada plato
            con un link único.
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

      {/* Features */}
      <section className="border-t border-zinc-100 bg-white px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-3 rounded-2xl bg-zinc-50 p-5"
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="font-semibold text-zinc-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
