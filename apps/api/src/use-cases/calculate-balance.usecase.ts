import { transactionRepository } from '../repositories/transaction.repository';

export async function calculateBalance(userId: string): Promise<number> {
  const [depositTotal, withdrawTotal, transferInTotal, transferOutTotal] = await Promise.all([
    transactionRepository.sumAmountByType(userId, 'deposit'),
    transactionRepository.sumAmountByType(userId, 'withdraw'),
    transactionRepository.sumAmountByTransferType(userId, 'in'),
    transactionRepository.sumAmountByTransferType(userId, 'out'),
  ]);

  return depositTotal + transferInTotal - withdrawTotal - transferOutTotal;
}
