import { createServerClient } from '@/lib/supabase/server';
import type { MatchWithTicketTypes } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MatchCard from '@/components/MatchCard';

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

export default async function HomePage() {
  const matches = await getUpcomingMatches();
  const featured = matches.find((m) => m.is_featured) || matches[0];
  const rest = matches.filter((m) => m.id !== featured?.id);

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Hero section */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-black text-2xl leading-tight mb-1">
            Próximos Partidos
          </h1>
          <p className="text-gray-blue text-sm font-medium">
            Comprá tus entradas online y viví el futsal
          </p>
        </div>

        {/* Featured match */}
        {featured && (
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="text-xs font-bold text-red-shield uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-shield rounded-full animate-pulse" />
              Partido destacado
            </div>
            <MatchCard match={featured} featured />
          </div>
        )}

        {/* Rest of matches */}
        {rest.length > 0 && (
          <div className="space-y-4">
            {rest.map((match, i) => (
              <div key={match.id} className="stagger-item" style={{ animationDelay: `${(i + 2) * 80}ms` }}>
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        )}

        {matches.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⚽</div>
            <h2 className="font-bold text-xl mb-2">No hay partidos programados</h2>
            <p className="text-gray-blue text-sm">
              Pronto se publicarán los próximos encuentros.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
