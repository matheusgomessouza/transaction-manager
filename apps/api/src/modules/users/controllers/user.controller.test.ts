import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

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

vi.mock('../../../lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { app } from '../../../server';

describe('UserController - GET /users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar lista vazia quando não há usuários', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.transaction.aggregate.mockResolvedValue({
      _sum: { amount: { toNumber: () => 0 } },
    });

    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('deve retornar usuários com saldo calculado', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        name: 'Alice',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'user-2',
        name: 'Bob',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    // Alice: deposit 1500
    prismaMock.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 1500 } } }) // user-1 deposits
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } }) // user-1 withdraws
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } }) // user-1 transfer in
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } }) // user-1 transfer out
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } }) // user-2 deposits
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } }) // user-2 withdraws
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } }) // user-2 transfer in
      .mockResolvedValueOnce({ _sum: { amount: { toNumber: () => 0 } } }); // user-2 transfer out

    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ id: 'user-1', name: 'Alice', balance: 1500 });
    expect(res.body[1]).toMatchObject({ id: 'user-2', name: 'Bob', balance: 0 });
  });

  it('deve retornar 500 quando o banco falha', async () => {
    prismaMock.user.findMany.mockRejectedValue(new Error('DB connection failed'));

    const res = await request(app).get('/users');

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ status: 'error', message: 'Internal server error' });
  });
});
