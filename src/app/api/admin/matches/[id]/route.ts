import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PUT update match
export async function PUT(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await req.json();
  const supabase = createServerClient();

  const { rival, date, venue, competition, is_featured, is_active } = body;

  const { data: match, error } = await supabase
    .from('matches')
    .update({
      ...(rival !== undefined && { rival }),
      ...(date !== undefined && { date }),
      ...(venue !== undefined && { venue }),
      ...(competition !== undefined && { competition }),
      ...(is_featured !== undefined && { is_featured }),
      ...(is_active !== undefined && { is_active }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ match });
}

// DELETE match
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { error } = await supabase.from('matches').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
