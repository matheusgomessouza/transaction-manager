import { prisma } from '../../../lib/prisma';
import { Transaction, InvalidTransaction, Prisma } from '@prisma/client';

export class TransactionRepository {
  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { id },
    });
  }

  async save(data: Prisma.TransactionUncheckedCreateInput): Promise<Transaction> {
    return prisma.transaction.create({
      data,
    });
  }

  async saveInvalid(payload: unknown, reason: string): Promise<InvalidTransaction> {
    return prisma.invalidTransaction.create({
      data: {
        payload: payload as Prisma.InputJsonValue,
        reason,
      },
    });
  }

  async findValidTransactions(): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      orderBy: { timestamp: 'desc' },
      include: {
        user: true,
        fromUser: true,
        toUser: true,
      },
    });
  }

  async findInvalidTransactions(): Promise<InvalidTransaction[]> {
    return prisma.invalidTransaction.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async sumAmountByType(userId: string, type: 'deposit' | 'withdraw'): Promise<number> {
    const result = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, type },
    });
    return result._sum.amount?.toNumber() || 0;
  }

  async sumAmountByTransferType(userId: string, transferDirection: 'in' | 'out'): Promise<number> {
    const whereClause = transferDirection === 'in' ? { toUserId: userId } : { fromUserId: userId };

    const result = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...whereClause, type: 'transfer' },
    });
    return result._sum.amount?.toNumber() || 0;
  }

  async deleteById(id: string): Promise<Transaction | null> {
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.transaction.delete({ where: { id } });
  }
}

export const transactionRepository = new TransactionRepository();
