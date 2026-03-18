'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, Users, MapPin, DollarSign, Scale, Settings } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/veiculos', label: 'Veiculos', icon: Truck },
  { href: '/motoristas', label: 'Motoristas', icon: Users },
  { href: '/viagens', label: 'Viagens', icon: MapPin },
  { href: '/custos', label: 'Custos', icon: DollarSign },
  { href: '/legislacao', label: 'Legislacao', icon: Scale },
  { href: '/configuracoes', label: 'Configuracoes', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 text-white">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white text-lg">
          F
        </div>
        <div>
          <div className="font-bold text-sm leading-tight">FrotaLeve</div>
          <div className="text-[11px] text-slate-400">Compliance de Frotas</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700 text-xs text-slate-500">
        ComplianceCore v0.1
      </div>
    </aside>
  );
}
