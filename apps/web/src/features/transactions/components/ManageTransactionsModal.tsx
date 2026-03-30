import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

type TransactionType = 'deposit' | 'withdraw' | 'transfer';

type User = {
  id: string;
  name: string;
  balance: number;
};

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number | string;
  timestamp: string;
  userId: string | null;
  fromUserId: string | null;
  toUserId: string | null;
  user?: User | null;
  fromUser?: User | null;
  toUser?: User | null;
};

interface ManageTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageTransactionsModal({ isOpen, onClose }: ManageTransactionsModalProps) {
  const queryClient = useQueryClient();

  const [txType, setTxType] = useState<TransactionType>('deposit');
  const [userId, setUserId] = useState('');
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
    enabled: isOpen,
  });

  const {
    data: transactions = [],
    isLoading,
    isError,
  } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => (await api.get('/transactions/resume')).data,
    enabled: isOpen,
  });

  const createTx = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/transactions', payload);
      return res.data;
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Transaction processed.' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAmount('');
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'Failed to process transaction.' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const deleteTx = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Transaction deleted.' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'Failed to delete transaction.' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback({ type: 'error', message: 'Amount must be a positive number.' });
      return;
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date().toISOString();

    let payload: Record<string, unknown>;

    if (txType === 'deposit' || txType === 'withdraw') {
      if (!userId) {
        setFeedback({ type: 'error', message: 'Select a user.' });
        return;
      }
      payload = { id: txId, type: txType, amount: parsedAmount, timestamp, user_id: userId };
    } else {
      if (!fromUserId || !toUserId) {
        setFeedback({ type: 'error', message: 'Select sender and receiver.' });
        return;
      }
      if (fromUserId === toUserId) {
        setFeedback({ type: 'error', message: 'Sender and receiver must be different.' });
        return;
      }
      payload = {
        id: txId,
        type: 'transfer',
        amount: parsedAmount,
        timestamp,
        from_user_id: fromUserId,
        to_user_id: toUserId,
      };
    }

    createTx.mutate(payload);
  };

  const formatAmount = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `$${num.toFixed(2)}`;
  };

  const typeColor: Record<TransactionType, string> = {
    deposit: 'text-accent-green',
    withdraw: 'text-accent-error',
    transfer: 'text-accent-info',
  };

  const getUserLabel = (tx: Transaction) => {
    if (tx.type === 'transfer') {
      const from = tx.fromUser?.name ?? tx.fromUserId?.slice(0, 8) ?? '?';
      const to = tx.toUser?.name ?? tx.toUserId?.slice(0, 8) ?? '?';
      return `${from} → ${to}`;
    }
    return tx.user?.name ?? tx.userId?.slice(0, 8) ?? '—';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-page border border-borderPrimary rounded-lg w-[95vw] max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-borderPrimary">
          <h1 className="text-section-title font-semibold text-textPrimary">
            // manage_transactions
          </h1>
          <button
            onClick={onClose}
            className="text-textTertiary hover:text-textPrimary text-base transition-colors"
          >
            ✕ close
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Feedback */}
          {feedback && (
            <div
              className={`px-4 py-3 rounded text-base font-medium ${
                feedback.type === 'success'
                  ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                  : 'bg-accent-error/10 text-accent-error border border-accent-error/20'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-surface p-5 flex flex-col gap-4 rounded">
            <h2 className="text-base font-medium text-textPrimary">// add_transaction</h2>

            {/* Type selector */}
            <div className="flex gap-2">
              {(['deposit', 'withdraw', 'transfer'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxType(t)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    txType === t
                      ? 'bg-accent-green text-page'
                      : 'bg-borderSecondary text-textSecondary hover:bg-borderPrimary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* User fields */}
            {txType === 'deposit' || txType === 'withdraw' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-small text-textTertiary">user_id</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-borderSecondary text-textPrimary text-sm rounded px-3 py-2 outline-none font-mono"
                >
                  <option value="">select_user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (${u.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-small text-textTertiary">from_user_id</label>
                  <select
                    value={fromUserId}
                    onChange={(e) => setFromUserId(e.target.value)}
                    className="bg-borderSecondary text-textPrimary text-sm rounded px-3 py-2 outline-none font-mono"
                  >
                    <option value="">select_sender...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (${u.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-small text-textTertiary">to_user_id</label>
                  <select
                    value={toUserId}
                    onChange={(e) => setToUserId(e.target.value)}
                    className="bg-borderSecondary text-textPrimary text-sm rounded px-3 py-2 outline-none font-mono"
                  >
                    <option value="">select_receiver...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (${u.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-small text-textTertiary">amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-borderSecondary text-textPrimary text-sm rounded px-3 py-2 outline-none font-mono placeholder:text-textMuted"
              />
            </div>

            <button
              type="submit"
              disabled={createTx.isPending}
              className="bg-accent-green text-page px-4 py-2 rounded text-sm font-semibold hover:bg-opacity-90 transition-opacity disabled:opacity-50"
            >
              {createTx.isPending ? 'Processing...' : 'Process Transaction'}
            </button>
          </form>

          {/* Transactions List */}
          <section className="bg-surface p-5 flex flex-col gap-4 rounded">
            <h2 className="text-base font-medium text-textPrimary">// recent_transactions</h2>

            <div className="flex flex-col gap-2 w-full overflow-x-auto">
              <div className="flex w-full min-w-[700px] py-1.5 gap-4">
                <span className="text-small text-textTertiary w-44 flex-shrink-0">Tx ID</span>
                <span className="text-small text-textTertiary w-20 flex-shrink-0">Type</span>
                <span className="text-small text-textTertiary w-24 flex-shrink-0">Amount</span>
                <span className="text-small text-textTertiary flex-1">User</span>
                <span className="text-small text-textTertiary w-20 flex-shrink-0">Action</span>
              </div>
              <div className="w-full min-w-[700px] h-px bg-borderSecondary" />

              {isLoading && (
                <span className="text-textTertiary py-3 text-sm">Loading transactions...</span>
              )}
              {isError && (
                <span className="text-accent-error py-3 text-sm">Failed to load transactions</span>
              )}

              {transactions.map((tx, idx) => (
                <React.Fragment key={tx.id}>
                  <div className="flex w-full min-w-[700px] py-1.5 gap-4 items-center">
                    <span className="text-sm text-textTertiary w-44 flex-shrink-0 truncate">
                      {tx.id}
                    </span>
                    <span className={`text-sm w-20 flex-shrink-0 ${typeColor[tx.type]}`}>
                      {tx.type}
                    </span>
                    <span className="text-sm font-semibold text-textPrimary w-24 flex-shrink-0">
                      {formatAmount(tx.amount)}
                    </span>
                    <span className="text-sm text-textTertiary flex-1 truncate">
                      {getUserLabel(tx)}
                    </span>
                    <button
                      onClick={() => deleteTx.mutate(tx.id)}
                      disabled={deleteTx.isPending}
                      className="bg-borderSecondary text-accent-error px-2.5 py-1 rounded text-small font-medium hover:bg-borderPrimary transition-colors disabled:opacity-50 w-20 flex-shrink-0"
                    >
                      delete
                    </button>
                  </div>
                  {idx < transactions.length - 1 && (
                    <div className="w-full min-w-[700px] h-px bg-borderSecondary" />
                  )}
                </React.Fragment>
              ))}
              {!isLoading && transactions.length === 0 && (
                <span className="text-textTertiary py-3 text-sm">No transactions found.</span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
