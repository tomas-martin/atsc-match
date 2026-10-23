import { createServerClient } from '@/lib/supabase/server';
import type { MatchWithTicketTypes } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MatchCard from '@/components/MatchCard';
import TournamentLogo from '@/components/TournamentLogo';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getUpcomingMatches(): Promise<MatchWithTicketTypes[]> {
  const supabase = createServerClient();

  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('is_active', true)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  if (error || !matches) return [];

  // Fetch ticket types for all matches
  const matchIds = matches.map((m) => m.id);
  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('*')
    .in('match_id', matchIds)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return matches.map((match) => ({
    ...match,
    ticket_types: (ticketTypes || []).filter((t) => t.match_id === match.id),
  }));
}

export default async function PartidosPage() {
  const matches = await getUpcomingMatches();
  const featured = matches.find((m) => m.is_featured) || matches[0];
  const rest = matches.filter((m) => m.id !== featured?.id);

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-8 max-w-xl mx-auto w-full">
        {/* Breadcrumb & Navigation */}
        <div className="mb-6 flex items-center justify-between animate-fade-in-up">
          <Link
            href="/"
            className="text-xs font-bold text-[var(--text-secondary)] hover:text-rose-500 transition-colors flex items-center gap-1.5"
          >
            ← Volver al inicio
          </Link>
          <span className="badge-competition">
            <TournamentLogo competitionName="FSP" size={16} />
            Temporada 2026
          </span>
        </div>

        {/* Page Title */}
        <div className="mb-8 text-center animate-fade-in-up">
          <h1 className="font-black text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]">
            Cartelera de Partidos
          </h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto mt-1 font-medium">
            Seleccioná el partido para elegir tus entradas y asegurar tu lugar en el estadio.
          </p>
        </div>

        {/* Featured match */}
        {featured && (
          <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                Partido Destacado
              </div>
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Próxima Fecha
              </span>
            </div>
            <MatchCard match={featured} featured />
          </section>
        )}

        {/* Rest of matches */}
        {rest.length > 0 && (
          <section className="space-y-4">
            <div className="px-1 mb-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                Todos los Partidos ({rest.length})
              </h2>
            </div>
            {rest.map((match, i) => (
              <div
                key={match.id}
                className="stagger-item"
                style={{ animationDelay: `${(i + 2) * 80}ms` }}
              >
                <MatchCard match={match} />
              </div>
            ))}
          </section>
        )}

        {/* Empty state when no matches found */}
        {matches.length === 0 && (
          <div className="text-center py-16 px-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-card)]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface-elevated)] flex items-center justify-center text-3xl">
              ⚽
            </div>
            <h2 className="font-black text-lg mb-1 text-[var(--text-primary)]">
              No hay partidos programados
            </h2>
            <p className="text-[var(--text-secondary)] text-sm max-w-xs mx-auto mb-6">
              Pronto se publicarán las próximas fechas del futsal mendocino.
            </p>
            <Link href="/" className="btn-secondary !w-auto inline-flex">
              Volver al inicio
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
