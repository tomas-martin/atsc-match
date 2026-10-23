import Link from 'next/link';
import ClubShield from './ClubShield';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-header)] backdrop-blur-md py-8 px-4 transition-colors">
      <div className="max-w-xl mx-auto flex flex-col items-center gap-4 text-center">
        <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
          <ClubShield size={40} glow />
        </Link>

        <div>
          <h3 className="font-black text-sm tracking-wide text-[var(--text-primary)]">
            ANDES TALLERES SPORT CLUB
          </h3>
          <p className="text-[var(--text-secondary)] text-xs font-semibold mt-0.5">
            Futsal Masculino & Femenino · Mendoza, Argentina
          </p>
          <p className="text-rose-500 text-xs font-bold mt-1 tracking-wider uppercase">
            #SomosTalleres · #ElMatador
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
            Partidos
          </Link>
          <span>·</span>
          <Link href="/mis-entradas" className="hover:text-[var(--text-primary)] transition-colors">
            Mis Entradas
          </Link>
          <span>·</span>
          <Link href="/admin/login" className="hover:text-[var(--text-primary)] transition-colors">
            Panel Club
          </Link>
        </div>

        <p className="text-[var(--text-muted)] text-[11px]">
          © {new Date().getFullYear()} Andes Talleres Sport Club · Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
