import { Response } from 'express';

export const AUTH_COOKIE_NAME = 'auth';

export function setAuthCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeMs,
  });
}

export function clearAuthCookie(res: Response): void {
  const opts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
  res.clearCookie(AUTH_COOKIE_NAME, opts);
}
