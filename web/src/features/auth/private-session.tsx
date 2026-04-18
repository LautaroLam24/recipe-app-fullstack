"use client";

import { useAuth } from "@/features/auth/auth-context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

function buildLoginRedirect(pathname: string, search: string): string {
  const path = pathname + (search ? `?${search}` : "");
  return `/login?from=${encodeURIComponent(path)}`;
}

/**
 * Protege rutas bajo (private): usa el mismo usuario que resolvió AuthProvider con /auth/me.
 */
export function PrivateGate({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    if (status !== "ready") {
      return;
    }
    if (user) {
      return;
    }
    router.replace(buildLoginRedirect(pathname, search));
  }, [status, user, pathname, search, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-zinc-500">Cargando sesión…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-zinc-500">Redirigiendo al inicio de sesión…</p>
      </div>
    );
  }

  return <>{children}</>;
}
