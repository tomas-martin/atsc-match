import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*, orders(buyer_name, buyer_email, buyer_dni), matches(rival, date), ticket_types(name)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tickets });
}
