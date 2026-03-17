'use client';

import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/loteamentos': 'Loteamentos',
  '/lotes': 'Lotes',
  '/compradores': 'Compradores',
  '/simulador': 'Simulador de Financiamento',
  '/dimob': 'DIMOB',
  '/alertas': 'Alertas',
  '/relatorios': 'Relatorios',
};

export function Header() {
  const pathname = usePathname();

  const title =
    pageTitles[pathname] ??
    (pathname.startsWith('/loteamentos/') ? 'Detalhe do Loteamento' : 'LotePro');

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="Notificacoes"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-semibold">
          U
        </div>
      </div>
    </header>
  );
}
