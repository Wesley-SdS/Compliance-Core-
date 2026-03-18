'use client';

import { usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import { useState } from 'react';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/laudos': 'Laudos',
  '/equipamentos': 'Equipamentos',
  '/templates': 'Templates de Exame',
  '/compliance': 'Score Compliance',
  '/atividade': 'Audit Trail',
  '/configuracoes': 'Configuracoes',
};

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const title =
    pageTitles[pathname] ??
    (pathname.startsWith('/laudos/') ? 'Editor de Laudo' : 'LaudoAI');

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="h-16 border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          aria-label="Notificacoes"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            {session?.user?.name && (
              <span className="text-sm text-slate-600 dark:text-slate-300 hidden md:inline">
                {session.user.name}
              </span>
            )}
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{session?.user?.name}</p>
                <p className="text-xs text-slate-500">{session?.user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
