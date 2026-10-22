'use client';

import Link from 'next/link';
import ClubShield from './ClubShield';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-navy/80 border-b border-blue-shield/30">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <ClubShield size={36} />
          <div className="flex flex-col">
            <span className="font-extrabold text-sm leading-tight tracking-wide">
              ANDES TALLERES
            </span>
            <span className="text-[10px] font-semibold text-gray-blue tracking-[0.2em]">
              FUTSAL
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/mis-entradas"
            className="text-sm font-semibold text-gray-blue hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
          >
            Mis Entradas
          </Link>
        </nav>
      </div>
    </header>
  );
}
