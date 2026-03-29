import { Request, Response } from 'express';
import { processTransaction } from '../use-cases/process-transaction.usecase';
import { transactionRepository } from '../repositories/transaction.repository';

export class TransactionController {
  async process(req: Request, res: Response) {
    const payload = req.body;

    // A API pode receber um array de transações ou uma única transação
    const transactions = Array.isArray(payload) ? payload : [payload];

    // Processa todas as transações (em paralelo se quisermos otimizar, mas sequencial é mais seguro para logs iniciais)
    const results = await Promise.allSettled(transactions.map((tx) => processTransaction(tx)));

    const failed = results.filter((r) => r.status === 'rejected');

    if (failed.length > 0) {
      // Como prometemos "At-Least-Once", erros críticos de infra que deram throw devem ser avisados,
      // mas transações inválidas por regra de negócio já foram tratadas e salvas, então não estouram erro aqui.
      return res.status(207).json({
        message: 'Algumas transações sofreram falhas críticas. Verifique os logs.',
        processed: transactions.length,
        failed: failed.length,
      });
    }

    return res.status(202).json({ message: 'Transações recebidas e processadas.' });
  }

  async getResume(req: Request, res: Response) {
    const transactions = await transactionRepository.findValidTransactions();
    return res.json(transactions);
  }

  async getInvalid(req: Request, res: Response) {
    const invalidTransactions = await transactionRepository.findInvalidTransactions();
    return res.json(invalidTransactions);
  }
}

export const transactionController = new TransactionController();
