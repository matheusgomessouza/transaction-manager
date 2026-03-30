import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

type InvalidTransaction = {
  id: string;
  reason: string;
  payload: { id?: string; [key: string]: unknown };
  createdAt: string;
};

export default function InvalidTransactions() {
  const {
    data: transactions = [],
    isLoading,
    isError,
  } = useQuery<InvalidTransaction[]>({
    queryKey: ['transactions', 'invalid'],
    queryFn: async () => {
      const response = await api.get('/transactions/invalid');
      return response.data;
    },
  });

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
            <span className="text-small text-textTertiary w-64 flex-shrink-0">ID</span>
            <span className="text-small text-textTertiary w-48 flex-shrink-0">
              Attempted ID / Payload
            </span>
            <span className="text-small text-textTertiary flex-1">Reason</span>
            <span className="text-small text-textTertiary w-48 flex-shrink-0">Timestamp</span>
          </div>
          <div className="w-full min-w-[800px] h-px bg-borderSecondary" />

          {isLoading && <span className="text-textTertiary py-4">Loading logs...</span>}
          {isError && <span className="text-accent-error py-4">Failed to load logs.</span>}

          {transactions.map((tx, idx) => {
            const attemptedId = tx.payload?.id || 'Unknown';

            return (
              <React.Fragment key={tx.id}>
                <div className="flex w-full min-w-[800px] py-2 gap-4 items-center">
                  <span
                    className="text-base text-textTertiary w-64 flex-shrink-0 truncate"
                    title={tx.id}
                  >
                    {tx.id}
                  </span>
                  <span
                    className="text-base text-textPrimary w-48 flex-shrink-0 truncate"
                    title={attemptedId}
                  >
                    {attemptedId}
                  </span>
                  <span className="text-base text-accent-error flex-1 truncate" title={tx.reason}>
                    {tx.reason}
                  </span>
                  <span className="text-base text-textTertiary w-48 flex-shrink-0">
                    {new Date(tx.createdAt).toLocaleString()}
                  </span>
                </div>
                {idx < transactions.length - 1 && (
                  <div className="w-full min-w-[800px] h-px bg-borderSecondary" />
                )}
              </React.Fragment>
            );
          })}

          {!isLoading && transactions.length === 0 && (
            <span className="text-textTertiary py-4">No invalid transactions recorded.</span>
          )}
        </div>
      </section>
    </div>
  );
}
