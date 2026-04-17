import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AUTH_COOKIE_NAME } from './auth-cookie';

function fromAuthCookie(req: Request): string | null {
  const raw = req.cookies?.[AUTH_COOKIE_NAME];
  return typeof raw === 'string' ? raw : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: fromAuthCookie,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: { sub: string }): { userId: string } {
    return { userId: payload.sub };
  }
}
