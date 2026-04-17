import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Completá tus datos para registrarte."
    >
      <RegisterForm />
    </AuthShell>
  );
}
