'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/empresas': 'Empresas',
  '/simulador': 'Simulador de Reforma Tributaria',
  '/sped': 'SPED',
  '/certidoes': 'Certidoes',
  '/alertas': 'Alertas',
  '/relatorios': 'Relatorios',
  '/legislacao': 'Legislacao Tributaria',
  '/configuracoes': 'Configuracoes',
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const title =
    pageTitles[pathname] ??
    (pathname.startsWith('/empresas/') ? 'Detalhe da Empresa' : 'TributoSim');

  const userName = session?.user?.name ?? session?.user?.email ?? '';
  const initials = userName
    ? userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

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
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold" title={userName}>
          {initials}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          title="Sair"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3h-9m9 0l-3-3m3 3l-3 3" />
          </svg>
        </button>
      </div>
    </header>
  );
}
