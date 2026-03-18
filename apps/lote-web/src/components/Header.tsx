'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/loteamentos': 'Loteamentos',
  '/contratos': 'Contratos',
  '/simulador': 'Simulador de Financiamento',
  '/cobranca': 'Régua de Cobrança',
  '/legislacao': 'Legislação',
  '/configuracoes': 'Configurações',
};

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  const title =
    pageTitles[pathname] ??
    (pathname.startsWith('/loteamentos/') ? 'Detalhe do Loteamento' :
     pathname.startsWith('/contratos/') ? 'Detalhe do Contrato' :
     pathname.startsWith('/portal/') ? 'Portal do Comprador' :
     'LotePro');

  const userName = session?.user?.name || session?.user?.email || '';
  const initials = userName.charAt(0).toUpperCase() || 'U';

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
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-semibold hover:bg-rose-200 transition-colors"
          >
            {initials}
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-sm font-medium text-slate-800 truncate">{userName}</div>
                {session?.user?.email && <div className="text-xs text-slate-500 truncate">{session.user.email}</div>}
              </div>
              <button
                type="button"
                onClick={() => signOut().then(() => { window.location.href = '/sign-in'; })}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
