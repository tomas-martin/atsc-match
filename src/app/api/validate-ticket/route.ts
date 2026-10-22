import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyTicketToken } from '@/lib/tickets';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({
        status: 'invalid',
        message: 'Token no proporcionado',
      });
    }

    // Verify HMAC
    const verified = verifyTicketToken(token);
    if (!verified) {
      return NextResponse.json({
        status: 'invalid',
        message: 'QR inválido o alterado',
      });
    }

    const supabase = createServerClient();

    // Find ticket
    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, orders(buyer_name, buyer_dni)')
      .eq('id', verified.ticketId)
      .eq('code', verified.code)
      .single();

    if (!ticket) {
      return NextResponse.json({
        status: 'invalid',
        message: 'Entrada no encontrada',
      });
    }

    // Check if already used
    if (ticket.is_used) {
      return NextResponse.json({
        status: 'used',
        message: 'Entrada ya utilizada',
        usedAt: ticket.used_at,
        code: ticket.code,
        holderName: ticket.holder_name,
      });
    }

    // Get match and type info
    const { data: match } = await supabase
      .from('matches')
      .select('rival, date, venue')
      .eq('id', ticket.match_id)
      .single();

    const { data: ticketType } = await supabase
      .from('ticket_types')
      .select('name')
      .eq('id', ticket.ticket_type_id)
      .single();

    // Mark as used
    await supabase
      .from('tickets')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', ticket.id);

    return NextResponse.json({
      status: 'valid',
      message: '¡Entrada válida!',
      code: ticket.code,
      holderName: ticket.holder_name,
      buyerDni: (ticket.orders as { buyer_dni: string } | null)?.buyer_dni,
      matchRival: match?.rival,
      matchDate: match?.date,
      typeName: ticketType?.name,
    });
  } catch (error) {
    console.error('Validate ticket error:', error);
    return NextResponse.json({
      status: 'invalid',
      message: 'Error al validar',
    });
  }
}
