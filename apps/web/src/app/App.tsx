import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '../components/layout/AppLayout';

// Lazy loading the features
const Dashboard = React.lazy(() => import('../features/dashboard/components/Dashboard'));
const UsersList = React.lazy(() => import('../features/users/components/UsersList'));
const InvalidTransactions = React.lazy(
  () => import('../features/transactions/components/InvalidTransactions')
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex h-screen w-full items-center justify-center bg-page text-textSecondary text-base">
              loading...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<UsersList />} />
              <Route path="invalid-transactions" element={<InvalidTransactions />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
