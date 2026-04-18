"use client";

import { useAuth } from "@/features/auth/auth-context";
import Link from "next/link";

export default function RecipesPage() {
  const { user } = useAuth();
  if (!user) {
    return null;
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-zinc-500">
        <Link href="/" className="underline hover:text-zinc-800">
          Inicio
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Mis recetas</h1>
      <p className="mt-2 text-zinc-600">
        Sesión activa como{" "}
        <span className="font-medium text-zinc-900">{user.email}</span>.
      </p>
      <p className="mt-6 text-sm text-zinc-500">
        Acá irá el listado de recetas cuando implementemos el módulo.
      </p>
    </div>
  );
}
