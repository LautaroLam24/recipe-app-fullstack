export type UserPublic = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithSecret = UserPublic & { passwordHash: string };

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findByEmailForAuth(email: string): Promise<UserWithSecret | null>;
  findByIdPublic(id: string): Promise<UserPublic | null>;
  create(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
  }): Promise<UserPublic>;
}
