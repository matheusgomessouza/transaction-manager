import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-page font-mono text-textPrimary">
      {/* Sidebar */}
      <aside className="flex flex-col w-64 h-full border-r border-borderPrimary bg-page py-8 px-5 gap-8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-accent-green text-sm font-semibold">~</span>
          <span className="text-textPrimary text-sm font-semibold tracking-tight">Tx Manager</span>
        </div>

        <nav className="flex flex-col gap-1 w-full">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 w-full rounded transition-colors ${
                isActive
                  ? 'bg-input text-textPrimary'
                  : 'text-textTertiary hover:text-textSecondary hover:bg-input/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`text-sm ${isActive ? 'text-accent-green font-medium' : 'font-normal opacity-0'}`}
                >
                  &gt;
                </span>
                <span className={`text-sm ${isActive ? 'font-medium' : 'font-normal -ml-3'}`}>
                  Dashboard
                </span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 w-full rounded transition-colors ${
                isActive
                  ? 'bg-input text-textPrimary'
                  : 'text-textTertiary hover:text-textSecondary hover:bg-input/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`text-sm ${isActive ? 'text-accent-green font-medium' : 'font-normal opacity-0'}`}
                >
                  &gt;
                </span>
                <span className={`text-sm ${isActive ? 'font-medium' : 'font-normal -ml-3'}`}>
                  Users &amp; Balances
                </span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/invalid-transactions"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 w-full rounded transition-colors ${
                isActive
                  ? 'bg-input text-textPrimary'
                  : 'text-textTertiary hover:text-textSecondary hover:bg-input/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`text-sm ${isActive ? 'text-accent-green font-medium' : 'font-normal opacity-0'}`}
                >
                  &gt;
                </span>
                <span className={`text-sm ${isActive ? 'font-medium' : 'font-normal -ml-3'}`}>
                  Invalid Transactions
                </span>
              </>
            )}
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-page py-8 px-10">
        <Outlet />
      </main>
    </div>
  );
};
