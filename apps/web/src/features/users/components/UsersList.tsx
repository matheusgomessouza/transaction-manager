import React, { useMemo } from 'react';

const MOCK_USERS = [
  { id: 'user_1042', status: 'active', balance: '$12,450.00', lastActive: '2_mins_ago' },
  { id: 'user_8891', status: 'inactive', balance: '$8,120.50', lastActive: '1_day_ago' },
  { id: 'user_9012', status: 'active', balance: '-$45.00', lastActive: '5_mins_ago' },
];

export default function UsersList() {
  const users = useMemo(() => MOCK_USERS, []);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between w-full">
        <h1 className="text-page-title font-semibold text-textPrimary">Users &amp; Balances</h1>
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
            placeholder="find_user_by_id_or_name..."
            className="bg-transparent border-none outline-none text-base text-textPrimary w-full placeholder:text-textMuted"
          />
        </div>
      </section>

      {/* Table */}
      <section className="bg-surface p-5 flex flex-col gap-4 w-full">
        <h2 className="text-section-title font-medium text-textPrimary">// All Users</h2>
        <div className="flex flex-col gap-2 w-full overflow-x-auto">
          <div className="flex w-full min-w-[800px] py-2 gap-4">
            <span className="text-small text-textTertiary w-48 flex-shrink-0">User ID</span>
            <span className="text-small text-textTertiary w-32 flex-shrink-0">Status</span>
            <span className="text-small text-textTertiary w-32 flex-shrink-0">Balance</span>
            <span className="text-small text-textTertiary flex-1">Last Active</span>
            <span className="text-small text-textTertiary w-32 flex-shrink-0">Actions</span>
          </div>
          <div className="w-full min-w-[800px] h-px bg-borderSecondary" />

          {users.map((user, idx) => (
            <React.Fragment key={user.id}>
              <div className="flex w-full min-w-[800px] py-2 gap-4 items-center">
                <span className="text-base text-textPrimary w-48 flex-shrink-0">{user.id}</span>
                <span
                  className={`text-base w-32 flex-shrink-0 ${
                    user.status === 'active' ? 'text-accent-green' : 'text-textTertiary'
                  }`}
                >
                  {user.status}
                </span>
                <span
                  className={`text-base font-semibold w-32 flex-shrink-0 ${
                    user.balance.startsWith('-') ? 'text-accent-error' : 'text-textPrimary'
                  }`}
                >
                  {user.balance}
                </span>
                <span className="text-base text-textTertiary flex-1">{user.lastActive}</span>
                <div className="w-32 flex-shrink-0">
                  <button className="text-accent-info font-medium text-small hover:underline">
                    view_tx -&gt;
                  </button>
                </div>
              </div>
              {idx < users.length - 1 && (
                <div className="w-full min-w-[800px] h-px bg-borderSecondary" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}
