'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const bareRoutes = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/portal'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = bareRoutes.some((r) => pathname.startsWith(r));

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
