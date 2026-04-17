import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthApplicationService } from '../application/auth.application.service';
import {
  clearAuthCookie,
  setAuthCookie,
} from './auth-cookie';
import { CurrentUser } from './current-user.decorator';
import { loginSchema } from './login.schema';
import { parseBody } from './parse-body';
import { registerSchema } from './register.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthApplicationService,
    private readonly config: ConfigService,
  ) {}

  private cookieMaxAgeMs(): number {
    return Number(this.config.get('COOKIE_MAX_AGE_MS', 604800000));
  }

  @Post('register')
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const dto = parseBody(registerSchema, body);
    const { user, accessToken } = await this.auth.register(dto);
    setAuthCookie(res, accessToken, this.cookieMaxAgeMs());
    return { user };
  }

  @Post('login')
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const dto = parseBody(loginSchema, body);
    const { user, accessToken } = await this.auth.login(dto);
    setAuthCookie(res, accessToken, this.cookieMaxAgeMs());
    return { user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@CurrentUser() user: { userId: string }) {
    return this.auth.me(user.userId);
  }
}
