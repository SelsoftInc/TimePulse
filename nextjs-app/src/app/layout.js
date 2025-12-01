'use client';

import { Inter } from 'next/font/google';
import '@/styles/theme.css';
import '@/styles/responsive.css';
import '@/styles/typography-override.css';
import '@/styles/icon-preservation.css';
import '@/styles/globals.css';
import '@/styles/layout-fixes.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { ToastProvider, ToastContainer } from '@/contexts/ToastContext';
import DemoControls from '@/components/demo/DemoControls';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={inter.className}>
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
      </body>
    </html>
  );
}
