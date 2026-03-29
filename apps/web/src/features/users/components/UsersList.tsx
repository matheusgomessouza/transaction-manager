import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

type User = {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
};

export default function UsersList() {
  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

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
            <span className="text-small text-textTertiary w-64 flex-shrink-0">User ID</span>
            <span className="text-small text-textTertiary flex-1">Name</span>
            <span className="text-small text-textTertiary w-32 flex-shrink-0">Balance</span>
            <span className="text-small text-textTertiary w-48 flex-shrink-0">Created At</span>
          </div>
          <div className="w-full min-w-[800px] h-px bg-borderSecondary" />

          {isLoading && <span className="text-textTertiary py-4">Loading users...</span>}
          {isError && <span className="text-accent-error py-4">Failed to load users</span>}

          {users.map((user, idx) => (
            <React.Fragment key={user.id}>
              <div className="flex w-full min-w-[800px] py-2 gap-4 items-center">
                <span className="text-base text-textTertiary w-64 flex-shrink-0 truncate">
                  {user.id}
                </span>
                <span className="text-base text-textPrimary flex-1 font-medium">{user.name}</span>
                <span
                  className={`text-base font-semibold w-32 flex-shrink-0 ${
                    user.balance < 0 ? 'text-accent-error' : 'text-accent-green'
                  }`}
                >
                  ${user.balance.toFixed(2)}
                </span>
                <span className="text-base text-textTertiary w-48 flex-shrink-0">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              {idx < users.length - 1 && (
                <div className="w-full min-w-[800px] h-px bg-borderSecondary" />
              )}
            </React.Fragment>
          ))}
          {!isLoading && users.length === 0 && (
            <span className="text-textTertiary py-4">No users found.</span>
          )}
        </div>
      </section>
    </div>
  );
}
