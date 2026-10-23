import { createServerClient } from '@/lib/supabase/server';
import type { MatchWithTicketTypes } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ClubShield from '@/components/ClubShield';
import MatchCard from '@/components/MatchCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getFeaturedMatch(): Promise<MatchWithTicketTypes | null> {
  const supabase = createServerClient();

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('is_active', true)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(1);

  if (!matches || matches.length === 0) return null;

  const match = matches[0];
  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('match_id', match.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return {
    ...match,
    ticket_types: ticketTypes || [],
  };
}

export default async function PresentacionPage() {
  const nextMatch = await getFeaturedMatch();

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-8 max-w-xl mx-auto w-full">
        {/* Hero Section de Presentación */}
        <section className="text-center pt-4 pb-10 animate-fade-in-up">
          {/* Official Crest with Glow */}
          <div className="flex justify-center mb-6">
            <ClubShield size={96} glow priority />
          </div>

          {/* Slogan Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-red-subtle)] border border-[var(--border-highlight)] text-xs font-black text-rose-500 uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            #SomosTalleres · El Matador
          </div>

          {/* Main Title */}
          <h1 className="font-black text-3xl sm:text-4xl tracking-tight leading-tight mb-3 text-[var(--text-primary)]">
            Andes Talleres Futsal
          </h1>

          <p className="text-[var(--text-secondary)] text-sm sm:text-base font-medium max-w-md mx-auto leading-relaxed mb-8">
            La plataforma oficial para comprar tus entradas a los partidos del Matador en el Polideportivo Talleres. 100% digital, rápido y seguro.
          </p>

          {/* Main Call to Action Button */}
          <div className="space-y-3 max-w-sm mx-auto">
            <Link
              href="/partidos"
              className="btn-primary !text-base !py-4 shadow-lg hover:shadow-xl"
            >
              <span>Ver Partidos y Comprar Entradas</span>
              <svg
                className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              href="/mis-entradas"
              className="btn-secondary !text-sm"
            >
              <svg
                className="w-4 h-4 text-rose-500 mr-1"
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
              <span>¿Ya compraste? Ver Mis Entradas</span>
            </Link>
          </div>
        </section>

        {/* Próximo Partido Destacado (si existe) */}
        {nextMatch && (
          <section className="mb-12 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                Próximo Encuentro
              </div>
              <Link
                href="/partidos"
                className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors"
              >
                Ver todos →
              </Link>
            </div>
            <MatchCard match={nextMatch} featured />
          </section>
        )}

        {/* Sección Paso a Paso del Proceso */}
        <section className="mb-12 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="text-center mb-6">
            <span className="badge-competition mb-2">Paso a Paso</span>
            <h2 className="font-black text-xl text-[var(--text-primary)]">
              ¿Cómo comprar tu entrada?
            </h2>
            <p className="text-[var(--text-secondary)] text-xs mt-1">
              Comprá en 3 simples pasos desde tu teléfono o computadora
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {/* Paso 1 */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 font-black text-lg flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)] mb-0.5">
                  Elegí el Partido
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Accedé a la cartelera, mirá los rivales, fecha, hora y sede de los partidos de Andes Talleres.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black text-lg flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)] mb-0.5">
                  Seleccioná tus Entradas
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Elegí la cantidad de entradas con disponibilidad en tiempo real y sin límite de compra.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-lg flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)] mb-0.5">
                  Completá tus Datos y Pagá
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Ingresá tu nombre, DNI y email. Aboná de forma segura con Mercado Pago y recibí tu QR al instante.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios & Identidad */}
        <section className="mb-10 text-center bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-6">
          <div className="grid grid-cols-3 gap-2 divide-x divide-[var(--border-subtle)] text-center">
            <div className="px-1">
              <div className="text-xl mb-1">⚡</div>
              <div className="font-black text-xs text-[var(--text-primary)]">Ingreso Ágil</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Escaneo QR directo</div>
            </div>
            <div className="px-1">
              <div className="text-xl mb-1">🔒</div>
              <div className="font-black text-xs text-[var(--text-primary)]">Pago Seguro</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Mercado Pago</div>
            </div>
            <div className="px-1">
              <div className="text-xl mb-1">🎟️</div>
              <div className="font-black text-xs text-[var(--text-primary)]">100% Digital</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">En tu celular</div>
            </div>
          </div>
        </section>

        {/* Banner CTA Final */}
        <section className="text-center py-6">
          <Link
            href="/partidos"
            className="btn-primary !w-full !py-4 text-base font-black shadow-xl"
          >
            Ir a la Cartelera de Partidos →
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
