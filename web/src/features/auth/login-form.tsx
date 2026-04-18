"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { loginRequest } from "@/lib/api/auth";
import { useAuth } from "@/features/auth/auth-context";
import { loginSchema, type LoginValues } from "./schemas";
import { resolveReturnPath } from "./return-path";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [rootError, setRootError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setRootError(null);
    try {
      await loginRequest(values);
      await refresh();
      setSuccess(true);
      setTimeout(() => {
        const dest = resolveReturnPath(searchParams.get("from"));
        router.push(dest);
        router.refresh();
      }, 600);
    } catch (e) {
      if (e instanceof ApiError) {
        setRootError(e.message);
        return;
      }
      setRootError("No hay conexión con el servidor. Revisá que la API esté en marcha.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {success ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          role="status"
        >
          Sesión iniciada. Redirigiendo…
        </div>
      ) : null}

      {rootError ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {rootError}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-700"
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={form.formState.isSubmitting || success}
        className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {form.formState.isSubmitting ? "Entrando…" : "Iniciar sesión"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        ¿No tenés cuenta?{" "}
        <Link
          href={
            searchParams.get("from")
              ? `/register?from=${encodeURIComponent(searchParams.get("from")!)}`
              : "/register"
          }
          className="font-medium text-zinc-900 underline"
        >
          Registrate
        </Link>
      </p>
    </form>
  );
}
