import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Ingresá con tu email y contraseña."
    >
      <LoginForm />
    </AuthShell>
  );
}
