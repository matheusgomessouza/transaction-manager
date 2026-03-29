import { logger } from '../../../lib/logger';
import { transactionSchema } from '../schemas/transaction.schema';
import { calculateBalance } from './calculate-balance.usecase';
import { transactionRepository } from '../repositories/transaction.repository';
import { userRepository } from '../../users/repositories/user.repository';

// Estratégia de Retry simples para falhas transitórias de banco de dados
async function withRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (attempt === retries) throw error;
      logger.warn(`Falha transitória detectada. Tentativa ${attempt} de ${retries}. Retentando...`);
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt)); // Exponential backoff simplificado
    }
  }
  throw new Error('Unreachable');
}

export async function processTransaction(payload: unknown): Promise<void> {
  try {
    // 1. Validação Estrutural (Zod)
    const validation = transactionSchema.safeParse(payload);
    if (!validation.success) {
      const errorMessage = `Erro de validação: ${validation.error.errors.map((e) => e.message).join(', ')}`;
      await saveInvalidTransaction(payload, errorMessage);
      return;
    }

    const data = validation.data;

    // 2. Garantia de Idempotência
    const existingTransaction = await transactionRepository.findById(data.id);

    if (existingTransaction) {
      logger.info({ txId: data.id }, 'Transação ignorada: ID já processado (Idempotência).');
      return;
    }

    // 3. Validação de Regras de Negócio
    let reasonToInvalidate: string | null = null;

    if (data.type === 'deposit' || data.type === 'withdraw') {
      // O Zod já garantiu que user_id existe neste ponto, mas o TypeScript não inferiu perfeitamente o discriminate union
      // para acessar propriedades diretamente sem um type guard mais específico.
      // Por isso utilizamos data as any apenas para o bypass do TS localmente na leitura do schema válido,
      // ou criamos guards mais fortes.

      const userId = data.type === 'deposit' || data.type === 'withdraw' ? data.user_id : null;

      if (userId) {
        const userExists = await userRepository.findById(userId);
        if (!userExists) reasonToInvalidate = 'Usuário não encontrado.';

        if (!reasonToInvalidate && data.type === 'withdraw') {
          const balance = await calculateBalance(userId);
          if (balance < data.amount) reasonToInvalidate = 'Saldo insuficiente para saque.';
        }
      }
    } else if (data.type === 'transfer') {
      const fromUserId = data.from_user_id;
      const toUserId = data.to_user_id;

      if (fromUserId && toUserId) {
        const [fromUser, toUser] = await Promise.all([
          userRepository.findById(fromUserId),
          userRepository.findById(toUserId),
        ]);

        if (!fromUser) reasonToInvalidate = 'Usuário de origem (from_user_id) não encontrado.';
        else if (!toUser) reasonToInvalidate = 'Usuário de destino (to_user_id) não encontrado.';
        else {
          const balance = await calculateBalance(fromUserId);
          if (balance < data.amount) reasonToInvalidate = 'Saldo insuficiente para transferência.';
        }
      }
    }

    // 4. Se quebrou regra de negócio, salva como inválida
    if (reasonToInvalidate) {
      await saveInvalidTransaction(payload, reasonToInvalidate);
      logger.warn(
        { txId: data.id, reason: reasonToInvalidate },
        'Transação classificada como inválida por regra de negócio.'
      );
      return;
    }

    // 5. Persistir Transação Válida (com Retry)
    await withRetry(async () => {
      // Aqui usamos type assertions seguras (as) porque já validamos as propriedades no bloco acima
      const userId = data.type === 'deposit' || data.type === 'withdraw' ? data.user_id : null;
      const fromUserId = data.type === 'transfer' ? data.from_user_id : null;
      const toUserId = data.type === 'transfer' ? data.to_user_id : null;

      await transactionRepository.save({
        id: data.id,
        type: data.type,
        amount: data.amount,
        timestamp: new Date(data.timestamp),
        userId: userId ?? null,
        fromUserId: fromUserId ?? null,
        toUserId: toUserId ?? null,
      });
    });

    logger.info({ txId: data.id }, 'Transação processada e salva com sucesso.');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error({ error: errorMessage, payload }, 'Erro crítico ao processar transação.');
    throw error;
  }
}

async function saveInvalidTransaction(payload: unknown, reason: string): Promise<void> {
  await transactionRepository.saveInvalid(payload, reason);
}
