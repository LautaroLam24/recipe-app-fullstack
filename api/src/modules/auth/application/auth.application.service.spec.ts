import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthApplicationService } from './auth.application.service';
import type { UserRepository } from '../domain/ports/user.repository';
import type { PasswordHasher } from '../domain/ports/password-hasher';
import type { JwtService } from '@nestjs/jwt';

const mockUser = {
  id: 'user-1',
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  passwordHash: 'hashed-password',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const publicUser = {
  id: mockUser.id,
  firstName: mockUser.firstName,
  lastName: mockUser.lastName,
  email: mockUser.email,
  createdAt: mockUser.createdAt,
  updatedAt: mockUser.updatedAt,
};

function makeService() {
  const users: jest.Mocked<UserRepository> = {
    findByEmailForAuth: jest.fn(),
    findByIdPublic: jest.fn(),
    create: jest.fn(),
  };

  const passwords: jest.Mocked<PasswordHasher> = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  const jwt = { signAsync: jest.fn() } as unknown as jest.Mocked<JwtService>;

  const service = new AuthApplicationService(users, passwords, jwt);

  return { service, users, passwords, jwt };
}

describe('AuthApplicationService', () => {
  describe('register', () => {
    it('normalizes email to lowercase and trimmed before lookup', async () => {
      const { service, users, passwords, jwt } = makeService();
      users.findByEmailForAuth.mockResolvedValue(null);
      passwords.hash.mockResolvedValue('hash');
      users.create.mockResolvedValue(publicUser as any);
      jwt.signAsync.mockResolvedValue('token' as any);

      await service.register({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: '  JUAN@EXAMPLE.COM  ',
        password: 'pass',
        confirmPassword: 'pass',
      });

      expect(users.findByEmailForAuth).toHaveBeenCalledWith('juan@example.com');
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'juan@example.com' }),
      );
    });

    it('trims firstName and lastName before saving', async () => {
      const { service, users, passwords, jwt } = makeService();
      users.findByEmailForAuth.mockResolvedValue(null);
      passwords.hash.mockResolvedValue('hash');
      users.create.mockResolvedValue(publicUser as any);
      jwt.signAsync.mockResolvedValue('token' as any);

      await service.register({
        firstName: '  Juan  ',
        lastName: '  Pérez  ',
        email: 'juan@example.com',
        password: 'pass',
        confirmPassword: 'pass',
      });

      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Juan', lastName: 'Pérez' }),
      );
    });

    it('throws ConflictException if email is already registered', async () => {
      const { service, users } = makeService();
      users.findByEmailForAuth.mockResolvedValue(mockUser as any);

      await expect(
        service.register({
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
          password: 'pass',
          confirmPassword: 'pass',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes the password before saving', async () => {
      const { service, users, passwords, jwt } = makeService();
      users.findByEmailForAuth.mockResolvedValue(null);
      passwords.hash.mockResolvedValue('hashed-pass');
      users.create.mockResolvedValue(publicUser as any);
      jwt.signAsync.mockResolvedValue('token' as any);

      await service.register({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        password: 'plain-pass',
        confirmPassword: 'plain-pass',
      });

      expect(passwords.hash).toHaveBeenCalledWith('plain-pass');
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: 'hashed-pass' }),
      );
    });

    it('returns user and accessToken on success', async () => {
      const { service, users, passwords, jwt } = makeService();
      users.findByEmailForAuth.mockResolvedValue(null);
      passwords.hash.mockResolvedValue('hash');
      users.create.mockResolvedValue(publicUser as any);
      jwt.signAsync.mockResolvedValue('signed-token' as any);

      const result = await service.register({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        password: 'pass',
        confirmPassword: 'pass',
      });

      expect(result.user).toEqual(publicUser);
      expect(result.accessToken).toBe('signed-token');
    });
  });

  describe('login', () => {
    it('normalizes email before lookup', async () => {
      const { service, users, passwords, jwt } = makeService();
      users.findByEmailForAuth.mockResolvedValue(mockUser as any);
      passwords.verify.mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('token' as any);

      await service.login({ email: '  JUAN@EXAMPLE.COM  ', password: 'pass' });

      expect(users.findByEmailForAuth).toHaveBeenCalledWith('juan@example.com');
    });

    it('throws UnauthorizedException if user not found', async () => {
      const { service, users } = makeService();
      users.findByEmailForAuth.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password is wrong', async () => {
      const { service, users, passwords } = makeService();
      users.findByEmailForAuth.mockResolvedValue(mockUser as any);
      passwords.verify.mockResolvedValue(false);

      await expect(
        service.login({ email: 'juan@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('does not include passwordHash in the returned user', async () => {
      const { service, users, passwords, jwt } = makeService();
      users.findByEmailForAuth.mockResolvedValue(mockUser as any);
      passwords.verify.mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('token' as any);

      const result = await service.login({
        email: 'juan@example.com',
        password: 'pass',
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('returns user and accessToken on success', async () => {
      const { service, users, passwords, jwt } = makeService();
      users.findByEmailForAuth.mockResolvedValue(mockUser as any);
      passwords.verify.mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('signed-token' as any);

      const result = await service.login({
        email: 'juan@example.com',
        password: 'pass',
      });

      expect(result.user.id).toBe('user-1');
      expect(result.accessToken).toBe('signed-token');
    });
  });

  describe('me', () => {
    it('returns the public user when found', async () => {
      const { service, users } = makeService();
      users.findByIdPublic.mockResolvedValue(publicUser as any);

      const result = await service.me('user-1');
      expect(result).toEqual(publicUser);
    });

    it('throws UnauthorizedException if user not found', async () => {
      const { service, users } = makeService();
      users.findByIdPublic.mockResolvedValue(null);

      await expect(service.me('ghost-id')).rejects.toThrow(UnauthorizedException);
    });
  });
});
