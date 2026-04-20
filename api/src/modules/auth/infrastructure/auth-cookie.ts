import { Response } from 'express';

export const AUTH_COOKIE_NAME = 'auth';

function baseCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    secure: isProd,
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
