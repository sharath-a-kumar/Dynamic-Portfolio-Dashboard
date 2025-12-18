/**
 * React Query provider for the application
 * Wraps the app with QueryClientProvider to enable React Query hooks
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from './ThemeProvider';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers component that wraps the application with React Query, Theme, and Toast notifications
 * Creates a new QueryClient instance for each user session
 */
export function Providers({ children }: ProvidersProps) {
  // Create a new QueryClient instance for each user
  // This ensures that the cache is not shared between users
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default options for all queries
            staleTime: 10000, // 10 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 3,
            refetchOnWindowFocus: true, // Refetch when window regains focus
            refetchOnReconnect: true, // Refetch when network reconnects
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider maxToasts={5} defaultDuration={5000}>
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
