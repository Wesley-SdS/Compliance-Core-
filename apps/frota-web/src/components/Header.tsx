'use client';

import { usePathname } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/veiculos': 'Veiculos',
  '/motoristas': 'Motoristas',
  '/viagens': 'Viagens',
  '/custos': 'Custos',
  '/legislacao': 'Legislacao',
  '/configuracoes': 'Configuracoes',
};

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const title =
    pageTitles[pathname] ??
    (pathname.startsWith('/veiculos/') ? 'Detalhe do Veiculo' :
     pathname.startsWith('/motoristas/') ? 'Detalhe do Motorista' :
     'FrotaLeve');

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="Notificacoes"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-700">{session.user.name}</div>
              <div className="text-xs text-slate-400">{session.user.email}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-semibold">
              {userInitial}
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {!session?.user && (
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-semibold">
            U
          </div>
        )}
      </div>
    </header>
  );
}
