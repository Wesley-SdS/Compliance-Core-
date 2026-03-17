'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Target,
  Building2,
  FileText,
  ClipboardCheck,
  Wand2,
  Bell,
  Scale,
  BarChart3,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/score', label: 'Score Detalhado', icon: Target },
  { href: '/clinicas', label: 'Clinicas', icon: Building2 },
  { href: '/documentos', label: 'Documentos', icon: FileText },
  { href: '/checklists', label: 'Checklists', icon: ClipboardCheck },
  { href: '/pops', label: 'Gerador de POP', icon: Wand2 },
  { href: '/alertas', label: 'Alertas', icon: Bell },
  { href: '/legislacao', label: 'Legislacao', icon: Scale },
  { href: '/relatorios', label: 'Relatorios', icon: BarChart3 },
  { href: '/configuracoes', label: 'Configuracoes', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <span className="text-sm font-bold text-white">EC</span>
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            EstetikComply
          </h1>
          <p className="text-xs text-gray-500">Compliance</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs font-medium text-indigo-800">
            ComplianceCore v0.1.0
          </p>
          <p className="mt-1 text-xs text-indigo-600">Vertical: Estetica</p>
        </div>
      </div>
    </aside>
  );
}
