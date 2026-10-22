import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET orders with filters
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const url = new URL(req.url);

  const matchId = url.searchParams.get('match_id');
  const status = url.searchParams.get('status');
  const format = url.searchParams.get('format');

  let query = supabase
    .from('orders')
    .select('*, matches(rival, date)')
    .order('created_at', { ascending: false });

  if (matchId) query = query.eq('match_id', matchId);
  if (status) query = query.eq('status', status);

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // CSV export
  if (format === 'csv') {
    const headers = ['ID', 'Fecha', 'Comprador', 'Email', 'DNI', 'Rival', 'Total', 'Estado', 'Email enviado'];
    const rows = (orders || []).map((o) => [
      o.id,
      new Date(o.created_at).toLocaleString('es-AR'),
      o.buyer_name,
      o.buyer_email,
      o.buyer_dni,
      (o.matches as { rival: string } | null)?.rival || '',
      o.total,
      o.status,
      o.email_sent ? 'Sí' : 'No',
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ordenes-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ orders });
}
