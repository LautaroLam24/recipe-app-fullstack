import { ApiError, apiJson, getApiBaseUrl } from "./client";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = { user: AuthUser };

export async function loginRequest(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function registerRequest(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthResponse> {
  return apiJson<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logoutRequest(): Promise<{ ok: boolean }> {
  return apiJson<{ ok: boolean }>("/auth/logout", {
    method: "POST",
  });
}

/** Sesión vía cookie httpOnly en el API: sin cookie o JWT inválido → 401 → null. */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const url = `${getApiBaseUrl()}/auth/me`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { message: text };
    }
  }

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as AuthUser;
}
