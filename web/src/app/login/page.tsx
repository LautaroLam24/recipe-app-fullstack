import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Ingresá con tu email y contraseña."
    >
      <Suspense fallback={<p className="text-sm text-zinc-500">Cargando…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
