import { z } from 'zod';

const baseTransactionSchema = z.object({
  id: z.string({ required_error: 'ID da transação é obrigatório.' }),
  amount: z
    .number({ required_error: 'Valor é obrigatório.' })
    .positive('O valor da transação deve ser positivo.'),
  timestamp: z
    .string({ required_error: 'Timestamp é obrigatório.' })
    .datetime({ message: 'Timestamp deve ser um formato ISO-8601 válido.' }),
});

const depositOrWithdrawSchema = z.object({
  type: z.enum(['deposit', 'withdraw']),
  user_id: z
    .string({ required_error: 'user_id é obrigatório para depósitos e saques.' })
    .uuid('user_id deve ser um UUID válido.'),
  from_user_id: z.undefined().optional(),
  to_user_id: z.undefined().optional(),
});

const transferSchema = z.object({
  type: z.literal('transfer'),
  user_id: z.undefined().optional(),
  from_user_id: z
    .string({ required_error: 'from_user_id é obrigatório para transferências.' })
    .uuid('from_user_id deve ser um UUID válido.'),
  to_user_id: z
    .string({ required_error: 'to_user_id é obrigatório para transferências.' })
    .uuid('to_user_id deve ser um UUID válido.'),
});

export const transactionSchema = z.intersection(
  baseTransactionSchema,
  z.discriminatedUnion('type', [depositOrWithdrawSchema, transferSchema])
);

export type TransactionPayload = z.infer<typeof transactionSchema>;
