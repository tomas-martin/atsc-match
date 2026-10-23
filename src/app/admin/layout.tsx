'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ClubShield from '@/components/ClubShield';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      if (pathname === '/admin/login') {
        if (!cancelled) setIsAuth(true);
        return;
      }

      try {
        const res = await fetch('/api/admin/me');
        if (cancelled) return;
        if (res.ok) {
          setIsAuth(true);
        } else {
          router.push('/admin/login');
        }
      } catch {
        if (!cancelled) router.push('/admin/login');
      }
    }

    checkAuth();
    return () => { cancelled = true; };
  }, [pathname, router]);

  if (isAuth === null) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="spinner spinner-large" />
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navItems = [
    { href: '/admin', label: 'Inicio', icon: '📊' },
    { href: '/admin/partidos', label: 'Partidos', icon: '⚽' },
    { href: '/admin/ordenes', label: 'Órdenes', icon: '🧾' },
    { href: '/admin/escanear', label: 'Escanear', icon: '📷' },
  ];

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Admin header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-navy/90 border-b border-blue-shield/30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <ClubShield size={28} />
            <span className="font-bold text-sm">ADMIN TALLERES</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Ver sitio →
            </Link>
          </div>
        </div>
      </header>

      {/* Admin nav */}
      <nav className="bg-navy-light border-b border-blue-shield/20">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                pathname === item.href
                  ? 'text-white border-red-shield'
                  : 'text-gray-blue border-transparent hover:text-white hover:border-gray-blue/30'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
