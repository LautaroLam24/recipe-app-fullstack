import { apiJson } from "./client";

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
