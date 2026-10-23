import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { MatchWithTicketTypes } from '@/lib/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CheckoutContent from './CheckoutContent';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMatch(id: string): Promise<MatchWithTicketTypes | null> {
  const supabase = createServerClient();

  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (!match) return null;

  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('match_id', id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return {
    ...match,
    ticket_types: ticketTypes || [],
  };
}

export default async function CheckoutPage({ params }: PageProps) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <Suspense
          fallback={
            <div className="py-20 text-center">
              <div className="spinner mx-auto text-rose-500" />
            </div>
          }
        >
          <CheckoutContent match={match} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
