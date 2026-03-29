import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    return prisma.user.findMany();
  }
}

export const userRepository = new UserRepository();
