import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { v4 as uuid } from 'uuid';
import { app } from '../server';
import { prisma } from '../lib/prisma';

describe('Integration Tests - Full Stack with Real Database', () => {
  let userId: string;
  let userId2: string;

  beforeAll(async () => {
    userId = uuid();
    userId2 = uuid();
  });

  beforeEach(async () => {
    await prisma.invalidTransaction.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.createMany({
      data: [
        { id: userId, name: 'Alice Test' },
        { id: userId2, name: 'Bob Test' },
      ],
    });
  });

  // ─── Users ───

  describe('GET /users', () => {
    it('deve retornar usuários com saldo zero sem transações', async () => {
      const res = await request(app).get('/users');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({ name: 'Alice Test', balance: 0 });
      expect(res.body[1]).toMatchObject({ name: 'Bob Test', balance: 0 });
    });

    it('deve calcular saldo corretamente após depósitos', async () => {
      await request(app)
        .post('/transactions')
        .send({
          id: `tx-dep-${uuid()}`,
          type: 'deposit',
          amount: 1500,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      const res = await request(app).get('/users');

      const alice = res.body.find((u: { id: string }) => u.id === userId);
      const bob = res.body.find((u: { id: string }) => u.id === userId2);

      expect(alice.balance).toBe(1500);
      expect(bob.balance).toBe(0);
    });
  });

  // ─── Transactions ───

  describe('POST /transactions', () => {
    it('deve processar deposit válido', async () => {
      const txId = `tx-${uuid()}`;
      const res = await request(app).post('/transactions').send({
        id: txId,
        type: 'deposit',
        amount: 500,
        timestamp: new Date().toISOString(),
        user_id: userId,
      });

      expect(res.status).toBe(202);

      const saved = await prisma.transaction.findUnique({ where: { id: txId } });
      expect(saved).not.toBeNull();
      expect(saved!.type).toBe('deposit');
    });

    it('deve processar withdraw com saldo suficiente', async () => {
      await request(app)
        .post('/transactions')
        .send({
          id: `tx-dep-${uuid()}`,
          type: 'deposit',
          amount: 1000,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      const txId = `tx-wdr-${uuid()}`;
      const res = await request(app).post('/transactions').send({
        id: txId,
        type: 'withdraw',
        amount: 300,
        timestamp: new Date().toISOString(),
        user_id: userId,
      });

      expect(res.status).toBe(202);

      const saved = await prisma.transaction.findUnique({ where: { id: txId } });
      expect(saved).not.toBeNull();
    });

    it('deve salvar como inválido quando withdraw excede saldo', async () => {
      const res = await request(app)
        .post('/transactions')
        .send({
          id: `tx-wdr-${uuid()}`,
          type: 'withdraw',
          amount: 9999,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      expect(res.status).toBe(202);

      const invalid = await prisma.invalidTransaction.findMany();
      expect(invalid).toHaveLength(1);
      expect(invalid[0].reason).toContain('Saldo insuficiente');
    });

    it('deve processar transfer entre dois usuários', async () => {
      await request(app)
        .post('/transactions')
        .send({
          id: `tx-dep-${uuid()}`,
          type: 'deposit',
          amount: 2000,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      const txId = `tx-tfr-${uuid()}`;
      const res = await request(app).post('/transactions').send({
        id: txId,
        type: 'transfer',
        amount: 800,
        timestamp: new Date().toISOString(),
        from_user_id: userId,
        to_user_id: userId2,
      });

      expect(res.status).toBe(202);

      const users = await request(app).get('/users');
      const alice = users.body.find((u: { id: string }) => u.id === userId);
      const bob = users.body.find((u: { id: string }) => u.id === userId2);

      expect(alice.balance).toBe(1200);
      expect(bob.balance).toBe(800);
    });

    it('deve respeitar idempotência - não processar mesmo ID duas vezes', async () => {
      const txId = `tx-idem-${uuid()}`;

      await request(app).post('/transactions').send({
        id: txId,
        type: 'deposit',
        amount: 100,
        timestamp: new Date().toISOString(),
        user_id: userId,
      });

      await request(app).post('/transactions').send({
        id: txId,
        type: 'deposit',
        amount: 100,
        timestamp: new Date().toISOString(),
        user_id: userId,
      });

      const count = await prisma.transaction.count({ where: { id: txId } });
      expect(count).toBe(1);

      const users = await request(app).get('/users');
      const alice = users.body.find((u: { id: string }) => u.id === userId);
      expect(alice.balance).toBe(100);
    });

    it('deve salvar transação inválida quando Zod falha', async () => {
      const res = await request(app)
        .post('/transactions')
        .send({
          id: `tx-bad-${uuid()}`,
          type: 'pix',
          amount: 100,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      expect(res.status).toBe(202);

      const invalid = await prisma.invalidTransaction.findMany();
      expect(invalid).toHaveLength(1);
    });
  });

  // ─── Resume ───

  describe('GET /transactions/resume', () => {
    it('deve retornar transações válidas com dados de usuário', async () => {
      await request(app)
        .post('/transactions')
        .send({
          id: `tx-dep-${uuid()}`,
          type: 'deposit',
          amount: 100,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      const res = await request(app).get('/transactions/resume');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ type: 'deposit' });
      expect(res.body[0].user).toMatchObject({ name: 'Alice Test' });
    });
  });

  // ─── Invalid ───

  describe('GET /transactions/invalid', () => {
    it('deve retornar transações inválidas', async () => {
      await request(app)
        .post('/transactions')
        .send({
          id: `tx-inv-${uuid()}`,
          type: 'withdraw',
          amount: 9999,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      const res = await request(app).get('/transactions/invalid');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].reason).toContain('Saldo insuficiente');
    });
  });

  // ─── Delete ───

  describe('DELETE /transactions/:id', () => {
    it('deve deletar transação e recalcular saldo', async () => {
      const txId = `tx-del-${uuid()}`;

      await request(app).post('/transactions').send({
        id: txId,
        type: 'deposit',
        amount: 500,
        timestamp: new Date().toISOString(),
        user_id: userId,
      });

      const beforeDelete = await request(app).get('/users');
      const aliceBefore = beforeDelete.body.find((u: { id: string }) => u.id === userId);
      expect(aliceBefore.balance).toBe(500);

      const res = await request(app).delete(`/transactions/${txId}`);
      expect(res.status).toBe(204);

      const afterDelete = await request(app).get('/users');
      const aliceAfter = afterDelete.body.find((u: { id: string }) => u.id === userId);
      expect(aliceAfter.balance).toBe(0);
    });

    it('deve retornar 404 ao deletar transação inexistente', async () => {
      const res = await request(app).delete('/transactions/nonexistent-id');
      expect(res.status).toBe(404);
    });
  });

  // ─── Requests Malformados ───

  describe('Requests Malformados', () => {
    it('deve processar body vazio como inválido (não crashar)', async () => {
      const res = await request(app).post('/transactions').send({});

      expect(res.status).toBe(202);

      const invalid = await prisma.invalidTransaction.findMany();
      expect(invalid.length).toBeGreaterThan(0);
    });

    it('deve processar type ausente como inválido', async () => {
      const res = await request(app)
        .post('/transactions')
        .send({
          id: `tx-${uuid()}`,
          amount: 100,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      expect(res.status).toBe(202);

      const invalid = await prisma.invalidTransaction.findMany();
      expect(invalid[0].reason).toContain('Erro de validação');
    });

    it('deve processar amount como string como inválido', async () => {
      const res = await request(app)
        .post('/transactions')
        .send({
          id: `tx-${uuid()}`,
          type: 'deposit',
          amount: 'cem',
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      expect(res.status).toBe(202);

      const invalid = await prisma.invalidTransaction.findMany();
      expect(invalid.length).toBeGreaterThan(0);
    });

    it('deve processar user_id sem UUID como inválido', async () => {
      const res = await request(app)
        .post('/transactions')
        .send({
          id: `tx-${uuid()}`,
          type: 'deposit',
          amount: 100,
          timestamp: new Date().toISOString(),
          user_id: 'not-a-uuid',
        });

      expect(res.status).toBe(202);

      const invalid = await prisma.invalidTransaction.findMany();
      expect(invalid[0].reason).toContain('UUID');
    });

    it('deve processar JSON malformado como erro 500', async () => {
      const res = await request(app)
        .post('/transactions')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(res.status).toBe(500);
    });
  });

  // ─── Edge Cases de Saldo ───

  describe('Edge Cases de Saldo', () => {
    it('deve permitir withdraw com saldo exatamente igual', async () => {
      await request(app)
        .post('/transactions')
        .send({
          id: `tx-dep-${uuid()}`,
          type: 'deposit',
          amount: 100,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      const txId = `tx-wdr-${uuid()}`;
      const res = await request(app).post('/transactions').send({
        id: txId,
        type: 'withdraw',
        amount: 100,
        timestamp: new Date().toISOString(),
        user_id: userId,
      });

      expect(res.status).toBe(202);

      const users = await request(app).get('/users');
      const alice = users.body.find((u: { id: string }) => u.id === userId);
      expect(alice.balance).toBe(0);
    });

    it('deve permitir transfer para si mesmo (withdraw + deposit cancelam)', async () => {
      await request(app)
        .post('/transactions')
        .send({
          id: `tx-dep-${uuid()}`,
          type: 'deposit',
          amount: 500,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      const txId = `tx-tfr-${uuid()}`;
      const res = await request(app).post('/transactions').send({
        id: txId,
        type: 'transfer',
        amount: 200,
        timestamp: new Date().toISOString(),
        from_user_id: userId,
        to_user_id: userId,
      });

      expect(res.status).toBe(202);

      const users = await request(app).get('/users');
      const alice = users.body.find((u: { id: string }) => u.id === userId);
      // 500 - 200 (out) + 200 (in) = 500
      expect(alice.balance).toBe(500);
    });

    it('deve processar withdraw de 0 como inválido (Zod positive)', async () => {
      const res = await request(app)
        .post('/transactions')
        .send({
          id: `tx-${uuid()}`,
          type: 'withdraw',
          amount: 0,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      expect(res.status).toBe(202);

      const invalid = await prisma.invalidTransaction.findMany();
      expect(invalid[0].reason).toContain('positivo');
    });

    it('deve lidar com saldo negativo após transferência insuficiente', async () => {
      await request(app)
        .post('/transactions')
        .send({
          id: `tx-dep-${uuid()}`,
          type: 'deposit',
          amount: 100,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      await request(app)
        .post('/transactions')
        .send({
          id: `tx-tfr-${uuid()}`,
          type: 'transfer',
          amount: 200,
          timestamp: new Date().toISOString(),
          from_user_id: userId,
          to_user_id: userId2,
        });

      const invalid = await prisma.invalidTransaction.findMany();
      expect(invalid[0].reason).toContain('Saldo insuficiente');

      // Saldo de Alice não deve ter mudado
      const users = await request(app).get('/users');
      const alice = users.body.find((u: { id: string }) => u.id === userId);
      expect(alice.balance).toBe(100);
    });
  });

  // ─── Concorrência ───

  describe('Concorrência', () => {
    it('deve processar múltiplos depósitos simultâneos corretamente', async () => {
      const deposits = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/transactions')
          .send({
            id: `tx-conc-${i}-${uuid()}`,
            type: 'deposit',
            amount: 100,
            timestamp: new Date().toISOString(),
            user_id: userId,
          })
      );

      await Promise.all(deposits);

      const users = await request(app).get('/users');
      const alice = users.body.find((u: { id: string }) => u.id === userId);
      expect(alice.balance).toBe(500);
    });

    it('deve processar withdraw e deposit simultâneos mantendo consistência', async () => {
      // Setup: deposit inicial
      await request(app)
        .post('/transactions')
        .send({
          id: `tx-dep-${uuid()}`,
          type: 'deposit',
          amount: 1000,
          timestamp: new Date().toISOString(),
          user_id: userId,
        });

      // 3 withdrawals de 100 cada + 1 deposit de 500
      const ops = [
        request(app)
          .post('/transactions')
          .send({
            id: `tx-wdr-1-${uuid()}`,
            type: 'withdraw',
            amount: 100,
            timestamp: new Date().toISOString(),
            user_id: userId,
          }),
        request(app)
          .post('/transactions')
          .send({
            id: `tx-wdr-2-${uuid()}`,
            type: 'withdraw',
            amount: 100,
            timestamp: new Date().toISOString(),
            user_id: userId,
          }),
        request(app)
          .post('/transactions')
          .send({
            id: `tx-wdr-3-${uuid()}`,
            type: 'withdraw',
            amount: 100,
            timestamp: new Date().toISOString(),
            user_id: userId,
          }),
        request(app)
          .post('/transactions')
          .send({
            id: `tx-dep-new-${uuid()}`,
            type: 'deposit',
            amount: 500,
            timestamp: new Date().toISOString(),
            user_id: userId,
          }),
      ];

      await Promise.all(ops);

      const users = await request(app).get('/users');
      const alice = users.body.find((u: { id: string }) => u.id === userId);
      // 1000 - 300 + 500 = 1200
      expect(alice.balance).toBe(1200);
    });
  });
});
