import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET all matches (admin)
export async function GET() {
  const supabase = createServerClient();

  const { data: matches, error } = await supabase
    .from('matches')
    .select('*, ticket_types(*)')
    .order('date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ matches });
}

// POST create match
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rival, date, venue, competition, is_featured, ticket_types } = body;

    if (!rival || !date) {
      return NextResponse.json({ error: 'Rival y fecha requeridos' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        rival,
        date,
        venue: venue || 'Polideportivo Talleres',
        competition: competition || 'Liga Mendocina de Futsal',
        is_featured: is_featured || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create ticket types if provided
    if (ticket_types?.length) {
      const ttInserts = ticket_types.map((tt: { name: string; price: number; quota: number }, i: number) => ({
        match_id: match.id,
        name: tt.name,
        price: tt.price,
        quota: tt.quota,
        sort_order: i + 1,
      }));

      await supabase.from('ticket_types').insert(ttInserts);
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error('Create match error:', error);
    return NextResponse.json({ error: 'Error al crear partido' }, { status: 500 });
  }
}
