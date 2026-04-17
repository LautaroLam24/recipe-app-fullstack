import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthApplicationService } from './application/auth.application.service';
import { PASSWORD_HASHER } from './domain/ports/password-hasher';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { AuthController } from './infrastructure/auth.controller';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthApplicationService,
    JwtStrategy,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
  ],
})
export class AuthModule {}
