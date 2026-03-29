import { Request, Response } from 'express';
import { userRepository } from '../repositories/user.repository';
import { calculateBalance } from '../../transactions/use-cases/calculate-balance.usecase';

export class UserController {
  async list(req: Request, res: Response) {
    const users = await userRepository.findAll();

    // Calcula o saldo em tempo real (Event Sourcing) para cada usuário
    const usersWithBalances = await Promise.all(
      users.map(async (user) => {
        const balance = await calculateBalance(user.id);
        return {
          ...user,
          balance,
        };
      })
    );

    return res.json(usersWithBalances);
  }
}

export const userController = new UserController();
