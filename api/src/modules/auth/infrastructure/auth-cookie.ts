import { Response } from 'express';

export const AUTH_COOKIE_NAME = 'auth';

function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export function setAuthCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
): void {
  res.cookie(AUTH_COOKIE_NAME, token, { ...baseCookieOptions(), maxAge: maxAgeMs });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions());
}
