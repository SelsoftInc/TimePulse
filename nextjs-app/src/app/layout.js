'use client';


import { Inter } from 'next/font/google';
import '@/styles/theme.css';
import '@/styles/responsive.css';
import '@/styles/typography-override.css';
import '@/styles/icon-preservation.css';
import '@/styles/globals.css';
import '@/styles/layout-fixes.css';
import '@/styles/tailwind.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { ToastProvider, ToastContainer } from '@/contexts/ToastContext';
import { SessionProvider } from 'next-auth/react';
import DemoControls from '@/components/demo/DemoControls';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  // Create a client instance for React Query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <ToastProvider>
                <AuthProvider>
                  <WebSocketProvider>
                    {children}
                    <ToastContainer />
                    <DemoControls />
                  </WebSocketProvider>
                </AuthProvider>
              </ToastProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
