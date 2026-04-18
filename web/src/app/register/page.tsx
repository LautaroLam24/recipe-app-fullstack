import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Completá tus datos para registrarte."
    >
      <Suspense fallback={<p className="text-sm text-zinc-500">Cargando…</p>}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
