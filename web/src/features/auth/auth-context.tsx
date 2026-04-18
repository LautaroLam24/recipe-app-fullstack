"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  fetchCurrentUser,
  logoutRequest,
  type AuthUser,
} from "@/lib/api/auth";

type AuthStatus = "loading" | "ready" | "error";

export type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  retry: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") {
      setStatus("loading");
      setErrorMessage(null);
    }
    try {
      const next = await fetchCurrentUser();
      setUser(next);
      setStatus("ready");
      setErrorMessage(null);
    } catch {
      setStatus("error");
      setErrorMessage(
        "No se pudo verificar la sesión. ¿La API está disponible?",
      );
    }
  }, []);

  useEffect(() => {
    void load("initial");
  }, [load]);

  const refresh = useCallback(async () => {
    await load("refresh");
  }, [load]);

  const retry = useCallback(async () => {
    await load("initial");
  }, [load]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Limpiar sesión local aunque falle el API.
    }
    setUser(null);
    setStatus("ready");
    setErrorMessage(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      status,
      refresh,
      logout,
      retry,
    }),
    [user, status, refresh, logout, retry],
  );

  if (status === "error") {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12">
          <p className="text-center text-sm text-red-700">{errorMessage}</p>
          <button
            type="button"
            onClick={() => void retry()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Reintentar
          </button>
        </div>
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
