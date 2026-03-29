import React, { useMemo } from 'react';

const MOCK_INVALID_TX = [
  {
    id: 'tx_err_001',
    user: 'user_1042',
    amount: '$500.00',
    reason: 'insufficient_funds',
    timestamp: '2023-10-24 14:32:01',
  },
  {
    id: 'tx_err_002',
    user: 'user_8891',
    amount: '$1,200.00',
    reason: 'daily_limit_exceeded',
    timestamp: '2023-10-24 14:35:12',
  },
  {
    id: 'tx_err_003',
    user: 'user_9012',
    amount: '$50.00',
    reason: 'invalid_destination_account',
    timestamp: '2023-10-24 14:40:05',
  },
];

export default function InvalidTransactions() {
  const transactions = useMemo(() => MOCK_INVALID_TX, []);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between w-full">
        <h1 className="text-page-title font-semibold text-textPrimary">Invalid Transactions</h1>
        <button className="bg-accent-green text-page px-3 py-1.5 rounded text-base font-medium hover:bg-opacity-90 transition-opacity">
          + New Transaction
        </button>
      </header>

      {/* Search Bar */}
      <section className="w-full flex gap-4">
        <div className="flex w-full items-center gap-3 bg-surface rounded px-4 py-3 border border-borderSecondary">
          <span className="text-textTertiary text-base">search</span>
          <input
            type="text"
            placeholder="filter_by_tx_id_or_user..."
            className="bg-transparent border-none outline-none text-base text-textPrimary w-full placeholder:text-textMuted"
          />
        </div>
      </section>

      {/* Table */}
      <section className="bg-surface p-5 flex flex-col gap-4 w-full">
        <h2 className="text-section-title font-medium text-textPrimary">
          // Invalid Transactions Log
        </h2>
        <div className="flex flex-col gap-2 w-full overflow-x-auto">
          <div className="flex w-full min-w-[800px] py-2 gap-4">
            <span className="text-small text-textTertiary w-32 flex-shrink-0">Tx ID</span>
            <span className="text-small text-textTertiary w-32 flex-shrink-0">User</span>
            <span className="text-small text-textTertiary w-32 flex-shrink-0">Amount</span>
            <span className="text-small text-textTertiary flex-1">Reason</span>
            <span className="text-small text-textTertiary w-48 flex-shrink-0">Timestamp</span>
          </div>
          <div className="w-full min-w-[800px] h-px bg-borderSecondary" />

          {transactions.map((tx, idx) => (
            <React.Fragment key={tx.id}>
              <div className="flex w-full min-w-[800px] py-2 gap-4 items-center">
                <span className="text-base text-accent-error w-32 flex-shrink-0">{tx.id}</span>
                <span className="text-base text-textPrimary w-32 flex-shrink-0">{tx.user}</span>
                <span className="text-base font-semibold text-textPrimary w-32 flex-shrink-0">
                  {tx.amount}
                </span>
                <span className="text-base text-textSecondary flex-1">{tx.reason}</span>
                <span className="text-base text-textTertiary w-48 flex-shrink-0">
                  {tx.timestamp}
                </span>
              </div>
              {idx < transactions.length - 1 && (
                <div className="w-full min-w-[800px] h-px bg-borderSecondary" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}
