"use client";

import { useAuth } from "@/features/auth/auth-context";
import Link from "next/link";

export function AppNav() {
  const { user, status, logout } = useAuth();

  if (status === "loading") {
    return (
      <span className="text-sm text-zinc-400" aria-live="polite">
        …
      </span>
    );
  }

  if (user) {
    return (
      <nav className="flex flex-wrap items-center justify-end gap-4 text-sm">
        <Link
          href="/recipes"
          className="font-medium text-zinc-700 hover:text-zinc-900"
        >
          Mis recetas
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="font-medium text-zinc-700 underline decoration-zinc-400 hover:text-zinc-900"
        >
          Cerrar sesión
        </button>
      </nav>
    );
  }

  return (
    <nav className="flex flex-wrap items-center justify-end gap-4 text-sm">
      <Link
        href="/login"
        className="font-medium text-zinc-700 hover:text-zinc-900"
      >
        Iniciar sesión
      </Link>
      <Link
        href="/register"
        className="font-medium text-zinc-900 underline hover:text-zinc-700"
      >
        Registrarse
      </Link>
    </nav>
  );
}
