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

describe('TransactionController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── POST /transactions ───

  describe('POST /transactions', () => {
    it('deve retornar 202 ao processar deposit válido', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Alice' });
      prismaMock.transaction.create.mockResolvedValue({ id: 'tx-1' });

      const res = await request(app).post('/transactions').send({
        id: 'tx-1',
        type: 'deposit',
        amount: 500,
        timestamp: '2026-01-01T00:00:00.000Z',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(res.status).toBe(202);
      expect(res.body.message).toContain('processadas');
    });

    it('deve retornar 202 ao processar array de transações', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Alice' });
      prismaMock.transaction.create.mockResolvedValue({ id: 'tx' });

      const res = await request(app)
        .post('/transactions')
        .send([
          {
            id: 'tx-1',
            type: 'deposit',
            amount: 100,
            timestamp: '2026-01-01T00:00:00.000Z',
            user_id: '550e8400-e29b-41d4-a716-446655440000',
          },
          {
            id: 'tx-2',
            type: 'deposit',
            amount: 200,
            timestamp: '2026-01-01T00:01:00.000Z',
            user_id: '550e8400-e29b-41d4-a716-446655440000',
          },
        ]);

      expect(res.status).toBe(202);
    });

    it('deve processar transação inválida por regra de negócio sem retornar erro 500', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.invalidTransaction.create.mockResolvedValue({ id: 'inv-1' });

      const res = await request(app).post('/transactions').send({
        id: 'tx-bad',
        type: 'deposit',
        amount: 100,
        timestamp: '2026-01-01T00:00:00.000Z',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
      });

      // Não é erro do servidor, a transação foi processada (salva como inválida)
      expect(res.status).toBe(202);
      expect(prismaMock.invalidTransaction.create).toHaveBeenCalled();
    });
  });

  // ─── GET /transactions/resume ───

  describe('GET /transactions/resume', () => {
    it('deve retornar array vazio quando não há transações', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([]);

      const res = await request(app).get('/transactions/resume');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('deve retornar transações válidas', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        {
          id: 'tx-1',
          type: 'deposit',
          amount: 500,
          timestamp: '2026-01-01T00:00:00.000Z',
          userId: 'user-1',
          fromUserId: null,
          toUserId: null,
          user: { id: 'user-1', name: 'Alice' },
          fromUser: null,
          toUser: null,
        },
      ]);

      const res = await request(app).get('/transactions/resume');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ id: 'tx-1', type: 'deposit' });
    });
  });

  // ─── GET /transactions/invalid ───

  describe('GET /transactions/invalid', () => {
    it('deve retornar transações inválidas', async () => {
      prismaMock.invalidTransaction.findMany.mockResolvedValue([
        { id: 'inv-1', payload: { bad: 'data' }, reason: 'Usuário não encontrado.' },
      ]);

      const res = await request(app).get('/transactions/invalid');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].reason).toBe('Usuário não encontrado.');
    });
  });

  // ─── DELETE /transactions/:id ───

  describe('DELETE /transactions/:id', () => {
    it('deve deletar transação existente e retornar 204', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue({ id: 'tx-1' });
      prismaMock.transaction.delete.mockResolvedValue({ id: 'tx-1' });

      const res = await request(app).delete('/transactions/tx-1');

      expect(res.status).toBe(204);
      expect(prismaMock.transaction.delete).toHaveBeenCalledWith({ where: { id: 'tx-1' } });
    });

    it('deve retornar 404 quando transação não existe', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null);

      const res = await request(app).delete('/transactions/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('não encontrada');
    });
  });

  // ─── Health Check ───

  describe('GET /health', () => {
    it('deve retornar status ok', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });
});
