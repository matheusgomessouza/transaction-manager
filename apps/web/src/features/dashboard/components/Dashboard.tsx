import React, { useMemo } from 'react';

// Mocks
const MOCK_METRICS = {
  totalUsers: '1,248',
  totalVolume: '$842.5k',
  invalidTx: '12',
};

const MOCK_ACTIVE_USERS = [
  { id: 'user_1042', balance: '$12,450.00' },
  { id: 'user_8891', balance: '$8,120.50' },
];

const MOCK_INVALID_TX = [{ id: 'tx_err_001', reason: 'insufficient_funds', amount: '$500.00' }];

const MOCK_RECENT_TX = [
  {
    id: 'tx_9281',
    type: 'deposit',
    amount: '$1,500.00',
    status: 'processed',
    timestamp: '2023-10-24 14:32:01',
  },
  {
    id: 'tx_9282',
    type: 'withdraw',
    amount: '$350.00',
    status: 'processed',
    timestamp: '2023-10-24 14:35:12',
  },
  {
    id: 'tx_9283',
    type: 'transfer',
    amount: '$800.00',
    status: 'pending',
    timestamp: '2023-10-24 14:40:05',
  },
];

export default function Dashboard() {
  const activeUsers = useMemo(() => MOCK_ACTIVE_USERS, []);
  const invalidTx = useMemo(() => MOCK_INVALID_TX, []);
  const recentTx = useMemo(() => MOCK_RECENT_TX, []);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between w-full">
        <h1 className="text-page-title font-semibold text-textPrimary">Dashboard</h1>
        <button className="bg-accent-green text-page px-3 py-1.5 rounded text-base font-medium hover:bg-opacity-90 transition-opacity">
          + New Transaction
        </button>
      </header>

      {/* Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <article className="bg-surface p-5 flex flex-col gap-4">
          <div className="flex justify-between w-full items-center">
            <span className="text-textTertiary text-base">// Total Users</span>
            <span className="text-accent-green text-base">↑</span>
          </div>
          <span className="text-metric font-semibold text-textPrimary">
            {MOCK_METRICS.totalUsers}
          </span>
        </article>

        <article className="bg-surface p-5 flex flex-col gap-4">
          <div className="flex justify-between w-full items-center">
            <span className="text-textTertiary text-base">// Total Volume</span>
            <span className="text-accent-green text-base">↑</span>
          </div>
          <span className="text-metric font-semibold text-textPrimary">
            {MOCK_METRICS.totalVolume}
          </span>
        </article>

        <article className="bg-surface p-5 flex flex-col gap-4">
          <div className="flex justify-between w-full items-center">
            <span className="text-textTertiary text-base">// Invalid Transactions</span>
            <span className="text-accent-error text-base">↓</span>
          </div>
          <span className="text-metric font-semibold text-accent-error">
            {MOCK_METRICS.invalidTx}
          </span>
        </article>
      </section>

      {/* Tables Area */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        {/* Active Users Table */}
        <article className="bg-surface p-5 flex flex-col gap-4">
          <h2 className="text-section-title font-medium text-textPrimary">// Active Users</h2>
          <div className="flex flex-col gap-3 w-full">
            {activeUsers.map((user, idx) => (
              <React.Fragment key={user.id}>
                <div className="flex justify-between py-2 w-full items-center">
                  <span className="text-base text-textPrimary">{user.id}</span>
                  <span className="text-base font-semibold text-textPrimary">{user.balance}</span>
                </div>
                {idx < activeUsers.length - 1 && <div className="w-full h-px bg-borderSecondary" />}
              </React.Fragment>
            ))}
          </div>
        </article>

        {/* Invalid Tx Table */}
        <article className="bg-surface p-5 flex flex-col gap-4">
          <h2 className="text-section-title font-medium text-textPrimary">
            // Recent Invalid Transactions
          </h2>
          <div className="flex flex-col gap-3 w-full">
            {invalidTx.map((tx, idx) => (
              <React.Fragment key={tx.id}>
                <div className="flex justify-between py-2 w-full items-center">
                  <span className="text-base text-accent-error">
                    {tx.id} ({tx.reason})
                  </span>
                  <span className="text-base text-textSecondary">{tx.amount}</span>
                </div>
                {idx < invalidTx.length - 1 && <div className="w-full h-px bg-borderSecondary" />}
              </React.Fragment>
            ))}
          </div>
        </article>
      </section>

      {/* Recent Transactions */}
      <section className="bg-surface p-5 flex flex-col gap-4 w-full">
        <h2 className="text-section-title font-medium text-textPrimary">// Recent Transactions</h2>
        <div className="flex flex-col gap-2 w-full overflow-x-auto">
          <div className="flex w-full min-w-[700px] py-2 gap-4">
            <span className="text-small text-textTertiary w-24 flex-shrink-0">Tx ID</span>
            <span className="text-small text-textTertiary w-24 flex-shrink-0">Type</span>
            <span className="text-small text-textTertiary w-24 flex-shrink-0">Amount</span>
            <span className="text-small text-textTertiary w-24 flex-shrink-0">Status</span>
            <span className="text-small text-textTertiary flex-1">Timestamp</span>
          </div>
          <div className="w-full min-w-[700px] h-px bg-borderSecondary" />

          {recentTx.map((tx, idx) => (
            <React.Fragment key={tx.id}>
              <div className="flex w-full min-w-[700px] py-2 gap-4 items-center">
                <span className="text-base text-textPrimary w-24 flex-shrink-0">{tx.id}</span>
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
                <span className="text-base font-semibold text-textPrimary w-24 flex-shrink-0">
                  {tx.amount}
                </span>
                <span
                  className={`text-base w-24 flex-shrink-0 ${
                    tx.status === 'pending' ? 'text-accent-warning' : 'text-textSecondary'
                  }`}
                >
                  {tx.status}
                </span>
                <span className="text-base text-textTertiary flex-1">{tx.timestamp}</span>
              </div>
              {idx < recentTx.length - 1 && (
                <div className="w-full min-w-[700px] h-px bg-borderSecondary" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}
