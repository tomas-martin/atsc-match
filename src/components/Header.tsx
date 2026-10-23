'use client';

import Link from 'next/link';
import ClubShield from './ClubShield';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 header-glass">
      <div className="max-w-xl mx-auto px-4 h-16 sm:h-18 flex items-center justify-between gap-3">
        {/* Brand link */}
        <Link
          href="/"
          className="flex items-center gap-3 group transition-transform active:scale-95"
        >
          <ClubShield size={38} glow />
          <div className="flex flex-col">
            <span className="font-black text-sm sm:text-base leading-tight tracking-tight group-hover:text-red-500 transition-colors">
              ANDES TALLERES
            </span>
            <span className="text-[10px] font-bold tracking-[0.22em] text-[var(--text-muted)] uppercase">
              Futsal · Mendoza
            </span>
          </div>
        </Link>

        {/* Actions navigation */}
        <div className="flex items-center gap-2">
          <Link
            href="/mis-entradas"
            className="btn-pill"
            title="Buscar mis entradas compradas"
          >
            <svg
              className="w-4 h-4 text-rose-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            <span className="hidden sm:inline">Mis Entradas</span>
          </Link>

          {/* Theme switch button */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
