"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { registerRequest } from "@/lib/api/auth";
import { registerSchema, type RegisterValues } from "./schemas";

export function RegisterForm() {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setRootError(null);
    try {
      await registerRequest(values);
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 700);
    } catch (e) {
      if (e instanceof ApiError) {
        setRootError(e.message);
        return;
      }
      setRootError("No hay conexión con el servidor. Revisá que la API esté en marcha.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {success ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          role="status"
        >
          Cuenta creada. Redirigiendo…
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-zinc-700"
          >
            Nombre
          </label>
          <input
            id="firstName"
            autoComplete="given-name"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30"
            {...form.register("firstName")}
          />
          {form.formState.errors.firstName ? (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.firstName.message}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-zinc-700"
          >
            Apellido
          </label>
          <input
            id="lastName"
            autoComplete="family-name"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30"
            {...form.register("lastName")}
          />
          {form.formState.errors.lastName ? (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.lastName.message}
            </p>
          ) : null}
        </div>
      </div>

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
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30"
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
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30"
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-zinc-700"
        >
          Repetir contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword ? (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={form.formState.isSubmitting || success}
        className="mt-2 flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {form.formState.isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
