import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateTicketCode, signTicket } from '@/lib/tickets';
import { sendTicketEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { action } = await req.json();

    const supabase = createServerClient();

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (action === 'approve') {
      if (order.status === 'approved') {
        return NextResponse.json({ message: 'La orden ya está aprobada' });
      }

      // 1. Mark order as approved
      await supabase
        .from('orders')
        .update({
          status: 'approved',
          mp_payment_id: order.mp_payment_id || `manual_admin_${Date.now()}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // 2. Generate tickets and confirm quota
      const createdTickets = [];

      for (const item of (order.items || []) as {
        ticket_type_id: string;
        name: string;
        qty: number;
        price: number;
      }[]) {
        // Confirm reservation / quota
        await supabase.rpc('confirm_reservation', {
          p_ticket_type_id: item.ticket_type_id,
          p_quantity: item.qty,
        });

        // Generate tickets
        for (let i = 0; i < item.qty; i++) {
          const code = generateTicketCode();
          const { data: ticket } = await supabase
            .from('tickets')
            .insert({
              order_id: orderId,
              match_id: order.match_id,
              ticket_type_id: item.ticket_type_id,
              code,
              token: 'pending',
              holder_name: order.buyer_name,
            })
            .select('id')
            .single();

          if (ticket) {
            const token = signTicket(ticket.id, code);
            await supabase
              .from('tickets')
              .update({ token })
              .eq('id', ticket.id);

            createdTickets.push({
              id: ticket.id,
              code,
              token,
              typeName: item.name,
            });
          }
        }
      }

      // 3. Try sending email if match found
      try {
        const { data: match } = await supabase
          .from('matches')
          .select('*')
          .eq('id', order.match_id)
          .single();

        if (match && order.buyer_email) {
          await sendTicketEmail({
            to: order.buyer_email,
            buyerName: order.buyer_name,
            match,
            tickets: createdTickets,
            orderId,
          });

          await supabase
            .from('orders')
            .update({ email_sent: true })
            .eq('id', orderId);
        }
      } catch (err) {
        console.error('Email send error on admin approval:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Orden aprobada y entradas emitidas con éxito',
        ticketsCount: createdTickets.length,
      });
    }

    if (action === 'reject') {
      // Release reservation
      for (const item of (order.items || []) as {
        ticket_type_id: string;
        qty: number;
      }[]) {
        await supabase.rpc('release_reservation', {
          p_ticket_type_id: item.ticket_type_id,
          p_quantity: item.qty,
        });
      }

      await supabase
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);

      return NextResponse.json({ success: true, message: 'Orden cancelada' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Admin order action error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la orden' },
      { status: 500 }
    );
  }
}
