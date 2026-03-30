import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDecimal = (value: number) => ({ toNumber: () => value });

const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      transaction: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        aggregate: vi.fn(),
      },
      invalidTransaction: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock('../../../lib/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { processTransaction } from './process-transaction.usecase';
import { calculateBalance } from './calculate-balance.usecase';

describe('processTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Validação Zod ───

  it('deve salvar como inválido quando payload é null', async () => {
    await processTransaction(null);

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalledWith({
      data: {
        payload: null,
        reason: expect.stringContaining('Expected object'),
      },
    });
    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
  });

  it('deve salvar como inválido quando type é desconhecido', async () => {
    await processTransaction({
      id: 'tx-1',
      type: 'pix',
      amount: 100,
      timestamp: '2026-01-01T00:00:00.000Z',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalled();
    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
  });

  it('deve salvar como inválido quando amount é negativo', async () => {
    await processTransaction({
      id: 'tx-1',
      type: 'deposit',
      amount: -50,
      timestamp: '2026-01-01T00:00:00.000Z',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalled();
  });

  it('deve salvar como inválido quando timestamp não é ISO-8601', async () => {
    await processTransaction({
      id: 'tx-1',
      type: 'deposit',
      amount: 100,
      timestamp: 'not-a-date',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalled();
  });

  it('deve salvar como inválido quando deposit não tem user_id', async () => {
    await processTransaction({
      id: 'tx-1',
      type: 'deposit',
      amount: 100,
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalled();
  });

  it('deve salvar como inválido quando transfer não tem from_user_id', async () => {
    await processTransaction({
      id: 'tx-1',
      type: 'transfer',
      amount: 100,
      timestamp: '2026-01-01T00:00:00.000Z',
      to_user_id: '550e8400-e29b-41d4-a716-446655440001',
    });

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalled();
  });

  // ─── Idempotência ───

  it('deve ignorar transação com ID já processado', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue({ id: 'tx-existing' });

    await processTransaction({
      id: 'tx-existing',
      type: 'deposit',
      amount: 100,
      timestamp: '2026-01-01T00:00:00.000Z',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
    expect(prismaMock.invalidTransaction.create).not.toHaveBeenCalled();
  });

  // ─── Regras de Negócio: Usuário não existe ───

  it('deve salvar como inválido quando user de deposit não existe', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);

    await processTransaction({
      id: 'tx-1',
      type: 'deposit',
      amount: 100,
      timestamp: '2026-01-01T00:00:00.000Z',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalledWith({
      data: {
        payload: expect.anything(),
        reason: 'Usuário não encontrado.',
      },
    });
  });

  it('deve salvar como inválido quando user de withdraw não existe', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);

    await processTransaction({
      id: 'tx-2',
      type: 'withdraw',
      amount: 50,
      timestamp: '2026-01-01T00:00:00.000Z',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalledWith({
      data: {
        payload: expect.anything(),
        reason: 'Usuário não encontrado.',
      },
    });
  });

  // ─── Regras de Negócio: Saldo insuficiente ───

  it('deve salvar como inválido quando withdraw excede saldo', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Alice' });
    prismaMock.transaction.aggregate.mockResolvedValue({
      _sum: { amount: { toNumber: () => 30 } },
    });

    await processTransaction({
      id: 'tx-3',
      type: 'withdraw',
      amount: 100,
      timestamp: '2026-01-01T00:00:00.000Z',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalledWith({
      data: {
        payload: expect.anything(),
        reason: 'Saldo insuficiente para saque.',
      },
    });
  });

  it('deve salvar como inválido quando transfer excede saldo do remetente', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: 'from-user', name: 'Alice' })
      .mockResolvedValueOnce({ id: 'to-user', name: 'Bob' });
    prismaMock.transaction.aggregate.mockResolvedValue({
      _sum: { amount: { toNumber: () => 10 } },
    });

    await processTransaction({
      id: 'tx-4',
      type: 'transfer',
      amount: 500,
      timestamp: '2026-01-01T00:00:00.000Z',
      from_user_id: '550e8400-e29b-41d4-a716-446655440000',
      to_user_id: '550e8400-e29b-41d4-a716-446655440001',
    });

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalledWith({
      data: {
        payload: expect.anything(),
        reason: 'Saldo insuficiente para transferência.',
      },
    });
  });

  it('deve salvar como inválido quando transfer com from_user inexistente', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'to-user', name: 'Bob' });

    await processTransaction({
      id: 'tx-5',
      type: 'transfer',
      amount: 100,
      timestamp: '2026-01-01T00:00:00.000Z',
      from_user_id: '550e8400-e29b-41d4-a716-446655440000',
      to_user_id: '550e8400-e29b-41d4-a716-446655440001',
    });

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalledWith({
      data: {
        payload: expect.anything(),
        reason: 'Usuário de origem (from_user_id) não encontrado.',
      },
    });
  });

  it('deve salvar como inválido quando transfer com to_user inexistente', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: 'from-user', name: 'Alice' })
      .mockResolvedValueOnce(null);

    await processTransaction({
      id: 'tx-6',
      type: 'transfer',
      amount: 100,
      timestamp: '2026-01-01T00:00:00.000Z',
      from_user_id: '550e8400-e29b-41d4-a716-446655440000',
      to_user_id: '550e8400-e29b-41d4-a716-446655440001',
    });

    expect(prismaMock.invalidTransaction.create).toHaveBeenCalledWith({
      data: {
        payload: expect.anything(),
        reason: 'Usuário de destino (to_user_id) não encontrado.',
      },
    });
  });

  // ─── Sucesso ───

  it('deve processar deposit válido com sucesso', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Alice' });
    prismaMock.transaction.create.mockResolvedValue({ id: 'tx-ok' });

    await processTransaction({
      id: 'tx-ok',
      type: 'deposit',
      amount: 1500,
      timestamp: '2026-01-01T00:00:00.000Z',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(prismaMock.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'tx-ok',
        type: 'deposit',
        amount: 1500,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        fromUserId: null,
        toUserId: null,
      }),
    });
    expect(prismaMock.invalidTransaction.create).not.toHaveBeenCalled();
  });

  it('deve processar withdraw válido com saldo suficiente', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Alice' });
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: mockDecimal(5000) } })
      .mockResolvedValueOnce({ _sum: { amount: mockDecimal(0) } })
      .mockResolvedValueOnce({ _sum: { amount: mockDecimal(0) } })
      .mockResolvedValueOnce({ _sum: { amount: mockDecimal(0) } });
    prismaMock.transaction.create.mockResolvedValue({ id: 'tx-w' });

    await processTransaction({
      id: 'tx-w',
      type: 'withdraw',
      amount: 200,
      timestamp: '2026-01-01T00:00:00.000Z',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(prismaMock.transaction.create).toHaveBeenCalled();
    expect(prismaMock.invalidTransaction.create).not.toHaveBeenCalled();
  });

  it('deve processar transfer válida com saldo suficiente', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: 'from-user', name: 'Alice' })
      .mockResolvedValueOnce({ id: 'to-user', name: 'Bob' });
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: mockDecimal(10000) } })
      .mockResolvedValueOnce({ _sum: { amount: mockDecimal(0) } })
      .mockResolvedValueOnce({ _sum: { amount: mockDecimal(0) } })
      .mockResolvedValueOnce({ _sum: { amount: mockDecimal(0) } });
    prismaMock.transaction.create.mockResolvedValue({ id: 'tx-t' });

    await processTransaction({
      id: 'tx-t',
      type: 'transfer',
      amount: 500,
      timestamp: '2026-01-01T00:00:00.000Z',
      from_user_id: '550e8400-e29b-41d4-a716-446655440000',
      to_user_id: '550e8400-e29b-41d4-a716-446655440001',
    });

    expect(prismaMock.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'tx-t',
        type: 'transfer',
        amount: 500,
        userId: null,
        fromUserId: '550e8400-e29b-41d4-a716-446655440000',
        toUserId: '550e8400-e29b-41d4-a716-446655440001',
      }),
    });
    expect(prismaMock.invalidTransaction.create).not.toHaveBeenCalled();
  });
});

describe('calculateBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar 0 quando não há transações', async () => {
    prismaMock.transaction.aggregate.mockResolvedValue({
      _sum: { amount: { toNumber: () => 0 } },
    });

    const balance = await calculateBalance('user-1');

    expect(balance).toBe(0);
  });

  it('deve calcular saldo de depósitos corretamente', async () => {
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 1500 } } }) // deposits
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } }) // withdraws
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } }) // transfer in
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } }); // transfer out

    const balance = await calculateBalance('user-1');

    expect(balance).toBe(1500);
  });

  it('deve calcular saldo com depósitos, saques e transferências', async () => {
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 2000 } } }) // deposits
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 300 } } }) // withdraws
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 500 } } }) // transfer in
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 200 } } }); // transfer out

    const balance = await calculateBalance('user-1');

    // 2000 - 300 + 500 - 200 = 2000
    expect(balance).toBe(2000);
  });

  it('deve retornar saldo negativo quando saques excedem depósitos', async () => {
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 100 } } })
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 500 } } })
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } })
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } });

    const balance = await calculateBalance('user-1');

    expect(balance).toBe(-400);
  });
});
