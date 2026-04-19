import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-zinc-100 bg-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-white">
              R
            </span>
            <span className="font-semibold text-zinc-800">Recetario</span>
          </Link>
          <p className="text-sm text-zinc-400">
            Organizá y compartí tus recetas favoritas.
          </p>
        </div>
        <p className="text-xs text-zinc-400">
          © 2026 — Lautaro Lamaita
        </p>
      </div>
    </footer>
  );
}
