import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { dni } = await req.json();

    if (!dni) {
      return NextResponse.json({ error: 'DNI requerido' }, { status: 400 });
    }

    const cleanDni = dni.replace(/\./g, '').trim();
    const supabase = createServerClient();

    // Find orders by DNI
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_dni', cleanDni)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [], tickets: [] });
    }

    // Get all tickets for these orders
    const orderIds = orders.map((o) => o.id);
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .in('order_id', orderIds);

    // Get matches info
    const matchIds = [...new Set(orders.map((o) => o.match_id))];
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .in('id', matchIds);

    // Get ticket type names
    const ticketTypeIds = [...new Set((tickets || []).map((t) => t.ticket_type_id))];
    const { data: ticketTypes } = await supabase
      .from('ticket_types')
      .select('id, name')
      .in('id', ticketTypeIds);

    const matchMap = new Map(matches?.map((m) => [m.id, m]) || []);
    const ticketTypeMap = new Map(ticketTypes?.map((tt) => [tt.id, tt.name]) || []);

    const enrichedTickets = (tickets || []).map((t) => {
      const order = orders.find((o) => o.id === t.order_id);
      const match = matchMap.get(t.match_id);
      return {
        id: t.id,
        code: t.code,
        token: t.token,
        typeName: ticketTypeMap.get(t.ticket_type_id) || 'Entrada',
        matchRival: match?.rival || '',
        matchDate: match?.date || '',
        matchVenue: match?.venue || '',
        isUsed: t.is_used,
        orderId: t.order_id,
        orderDate: order?.created_at || '',
      };
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        matchRival: matchMap.get(o.match_id)?.rival || '',
        matchDate: matchMap.get(o.match_id)?.date || '',
        total: o.total,
        created_at: o.created_at,
      })),
      tickets: enrichedTickets,
    });
  } catch (error) {
    console.error('My tickets error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
