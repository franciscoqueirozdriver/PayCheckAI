import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Cálculo de DSR',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
