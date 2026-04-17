import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository, UserPublic, UserWithSecret } from '../domain/ports/user.repository';

const publicSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

const authSelect = {
  ...publicSelect,
  passwordHash: true,
} as const;

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailForAuth(email: string): Promise<UserWithSecret | null> {
    const row = await this.prisma.user.findUnique({
      where: { email },
      select: authSelect,
    });
    return row;
  }

  async findByIdPublic(id: string): Promise<UserPublic | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicSelect,
    });
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
  }): Promise<UserPublic> {
    return this.prisma.user.create({
      data,
      select: publicSelect,
    });
  }
}
