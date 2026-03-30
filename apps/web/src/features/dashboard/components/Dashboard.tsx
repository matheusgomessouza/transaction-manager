import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

type User = {
  id: string;
  name: string;
  balance: number;
};

type Transaction = {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: string;
  timestamp: string;
};

type InvalidTransaction = {
  id: string;
  reason: string;
  payload: { id?: string; [key: string]: unknown };
  createdAt: string;
};

export default function Dashboard() {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const { data: recentTx = [] } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'resume'],
    queryFn: async () => {
      const response = await api.get('/transactions/resume');
      return response.data;
    },
  });

  const { data: invalidTx = [] } = useQuery<InvalidTransaction[]>({
    queryKey: ['transactions', 'invalid'],
    queryFn: async () => {
      const response = await api.get('/transactions/invalid');
      return response.data;
    },
  });

  // Derived metrics
  const totalUsers = users.length;
  const totalVolume = recentTx.reduce((acc, tx) => acc + parseFloat(tx.amount), 0);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between w-full">
        <h1 className="text-page-title font-semibold text-textPrimary">Dashboard</h1>
      </header>

      {/* Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <article className="bg-surface p-5 flex flex-col gap-4">
          <div className="flex justify-between w-full items-center">
            <span className="text-textTertiary text-base">// Total Users</span>
            <span className="text-accent-green text-base">↑</span>
          </div>
          <span className="text-metric font-semibold text-textPrimary">{totalUsers}</span>
        </article>

        <article className="bg-surface p-5 flex flex-col gap-4">
          <div className="flex justify-between w-full items-center">
            <span className="text-textTertiary text-base">// Total Volume</span>
            <span className="text-accent-green text-base">↑</span>
          </div>
          <span className="text-metric font-semibold text-textPrimary">
            ${totalVolume.toFixed(2)}
          </span>
        </article>

        <article className="bg-surface p-5 flex flex-col gap-4">
          <div className="flex justify-between w-full items-center">
            <span className="text-textTertiary text-base">// Invalid Transactions</span>
            <span className="text-accent-error text-base">↓</span>
          </div>
          <span className="text-metric font-semibold text-accent-error">{invalidTx.length}</span>
        </article>
      </section>

      {/* Tables Area */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        {/* Active Users Table */}
        <article className="bg-surface p-5 flex flex-col gap-4">
          <h2 className="text-section-title font-medium text-textPrimary">// Active Users</h2>
          <div className="flex flex-col gap-3 w-full">
            {users.slice(0, 5).map((user, idx) => (
              <React.Fragment key={user.id}>
                <div className="flex justify-between py-2 w-full items-center">
                  <span className="text-base text-textPrimary truncate max-w-[150px]">
                    {user.name}
                  </span>
                  <span
                    className={`text-base font-semibold ${user.balance < 0 ? 'text-accent-error' : 'text-accent-green'}`}
                  >
                    ${user.balance.toFixed(2)}
                  </span>
                </div>
                {idx < Math.min(users.length, 5) - 1 && (
                  <div className="w-full h-px bg-borderSecondary" />
                )}
              </React.Fragment>
            ))}
            {users.length === 0 && <span className="text-textTertiary">No users found.</span>}
          </div>
        </article>

        {/* Invalid Tx Table */}
        <article className="bg-surface p-5 flex flex-col gap-4">
          <h2 className="text-section-title font-medium text-textPrimary">
            // Recent Invalid Transactions
          </h2>
          <div className="flex flex-col gap-3 w-full">
            {invalidTx.slice(0, 5).map((tx, idx) => (
              <React.Fragment key={tx.id}>
                <div className="flex justify-between py-2 w-full items-center gap-4">
                  <span className="text-base text-accent-error truncate flex-1">{tx.reason}</span>
                  <span className="text-base text-textSecondary flex-shrink-0 text-right">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {idx < Math.min(invalidTx.length, 5) - 1 && (
                  <div className="w-full h-px bg-borderSecondary" />
                )}
              </React.Fragment>
            ))}
            {invalidTx.length === 0 && (
              <span className="text-textTertiary">No invalid transactions.</span>
            )}
          </div>
        </article>
      </section>

      {/* Recent Transactions */}
      <section className="bg-surface p-5 flex flex-col gap-4 w-full">
        <h2 className="text-section-title font-medium text-textPrimary">// Recent Transactions</h2>
        <div className="flex flex-col gap-2 w-full overflow-x-auto">
          <div className="flex w-full min-w-[700px] py-2 gap-4">
            <span className="text-small text-textTertiary w-64 flex-shrink-0">Tx ID</span>
            <span className="text-small text-textTertiary w-24 flex-shrink-0">Type</span>
            <span className="text-small text-textTertiary w-32 flex-shrink-0">Amount</span>
            <span className="text-small text-textTertiary flex-1">Timestamp</span>
          </div>
          <div className="w-full min-w-[700px] h-px bg-borderSecondary" />

          {recentTx.slice(0, 10).map((tx, idx) => (
            <React.Fragment key={tx.id}>
              <div className="flex w-full min-w-[700px] py-2 gap-4 items-center">
                <span className="text-base text-textPrimary w-64 flex-shrink-0 truncate">
                  {tx.id}
                </span>
                <span
                  className={`text-base w-24 flex-shrink-0 ${
                    tx.type === 'deposit'
                      ? 'text-accent-green'
                      : tx.type === 'withdraw'
                        ? 'text-accent-error'
                        : 'text-accent-info'
                  }`}
                >
                  {tx.type}
                </span>
                <span className="text-base font-semibold text-textPrimary w-32 flex-shrink-0">
                  ${parseFloat(tx.amount).toFixed(2)}
                </span>
                <span className="text-base text-textTertiary flex-1">
                  {new Date(tx.timestamp).toLocaleString()}
                </span>
              </div>
              {idx < Math.min(recentTx.length, 10) - 1 && (
                <div className="w-full min-w-[700px] h-px bg-borderSecondary" />
              )}
            </React.Fragment>
          ))}
          {recentTx.length === 0 && (
            <span className="text-textTertiary py-4">No recent transactions.</span>
          )}
        </div>
      </section>
    </div>
  );
}
