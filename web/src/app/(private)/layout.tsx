import { PrivateGate } from "@/features/auth/private-session";
import { Suspense, type ReactNode } from "react";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-zinc-500">Cargando…</p>
        </div>
      }
    >
      <PrivateGate>{children}</PrivateGate>
    </Suspense>
  );
}