"use client";

import { useAuth } from "@/features/auth/auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function AppNav() {
  const { user, status, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (status === "loading") {
    return <div className="h-8 w-24 animate-pulse rounded-lg bg-zinc-100" />;
  }

  if (user) {
    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-zinc-100"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white">
            {initials}
          </span>
          <span className="hidden font-medium text-zinc-700 sm:block">
            {user.firstName}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-zinc-400"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
            <Link
              href="/recipes"
              onClick={() => setOpen(false)}
              className="flex items-center px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Mis recetas
            </Link>
            <Link
              href="/recipes/new"
              onClick={() => setOpen(false)}
              className="flex items-center px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Nueva receta
            </Link>
            <div className="my-1 border-t border-zinc-100" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void logout();
              }}
              className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-3 text-sm">
      {pathname !== "/login" && (
        <Link
          href="/login"
          className="font-medium text-zinc-600 hover:text-zinc-900"
        >
          Iniciar sesión
        </Link>
      )}
      {pathname !== "/register" && (
        <Link
          href="/register"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-700"
        >
          Registrarse
        </Link>
      )}
    </nav>
  );
}
