import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USER_REPOSITORY, type UserRepository } from '../domain/ports/user.repository';
import { PASSWORD_HASHER, type PasswordHasher } from '../domain/ports/password-hasher';

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

@Injectable()
export class AuthApplicationService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmailForAuth(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.users.create({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      passwordHash,
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return { user, accessToken };
  }

  async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();
    const found = await this.users.findByEmailForAuth(email);
    if (!found) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await this.passwords.verify(input.password, found.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const user = {
      id: found.id,
      firstName: found.firstName,
      lastName: found.lastName,
      email: found.email,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    };
    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return { user, accessToken };
  }

  async me(userId: string) {
    const user = await this.users.findByIdPublic(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
