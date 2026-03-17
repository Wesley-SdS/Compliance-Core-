import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'TributoSim — Compliance Tributario',
  description: 'Plataforma de compliance tributario e simulacao de reforma',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
