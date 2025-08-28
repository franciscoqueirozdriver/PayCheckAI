import './globals.css';
import type { ReactNode } from 'react';
import { PaycheckAIPermissionsProvider } from '@/src/providers/paycheckai/PermissionsAdapter';
import { PaycheckAISessionProvider } from '@/src/providers/paycheckai/SessionAdapter';

export const metadata = {
  title: 'PayCheckAI - Integrado',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">
        <PaycheckAISessionProvider>
          <PaycheckAIPermissionsProvider>
            {children}
          </PaycheckAIPermissionsProvider>
        </PaycheckAISessionProvider>
      </body>
    </html>
  );
}
