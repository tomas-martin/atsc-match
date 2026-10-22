import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }

  // Get tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('order_id', id);

  // Get match info
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', order.match_id)
    .single();

  // Get ticket type names
  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('id, name')
    .eq('match_id', order.match_id);

  const ticketTypeMap = new Map(ticketTypes?.map((tt) => [tt.id, tt.name]) || []);

  const enrichedTickets = (tickets || []).map((t) => ({
    id: t.id,
    code: t.code,
    token: t.token,
    typeName: ticketTypeMap.get(t.ticket_type_id) || 'Entrada',
    matchRival: match?.rival || '',
    matchDate: match?.date || '',
    matchVenue: match?.venue || '',
    isUsed: t.is_used,
  }));

  return NextResponse.json({
    order: {
      id: order.id,
      buyer_name: order.buyer_name,
      buyer_email: order.buyer_email,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
    },
    tickets: enrichedTickets,
  });
}
