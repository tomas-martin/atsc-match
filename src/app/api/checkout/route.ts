import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, buyerName, buyerEmail, buyerDni, items } = body;

    // Validate input
    if (!matchId || !buyerName || !buyerEmail || !buyerDni || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    if (!/^\d{7,8}$/.test(buyerDni.replace(/\./g, ''))) {
      return NextResponse.json({ error: 'DNI inválido' }, { status: 400 });
    }

    const totalItems = items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
    if (totalItems > 6) {
      return NextResponse.json({ error: 'Máximo 6 entradas por compra' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify match exists
    const { data: match } = await supabase
      .from('matches')
      .select('id, rival, date')
      .eq('id', matchId)
      .eq('is_active', true)
      .single();

    if (!match) {
      return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    }

    // Reserve stock atomically for each item
    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const { ticketTypeId, quantity } = item;

      // Get ticket type info
      const { data: tt } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('id', ticketTypeId)
        .eq('match_id', matchId)
        .single();

      if (!tt) {
        return NextResponse.json(
          { error: `Tipo de entrada no encontrado` },
          { status: 400 }
        );
      }

      // Reserve stock atomically using the database function
      const { data: reserved } = await supabase.rpc('reserve_stock', {
        p_ticket_type_id: ticketTypeId,
        p_quantity: quantity,
      });

      if (!reserved) {
        // Rollback any previous reservations
        for (const prevItem of orderItems) {
          await supabase.rpc('release_reservation', {
            p_ticket_type_id: prevItem.ticket_type_id,
            p_quantity: prevItem.qty,
          });
        }
        return NextResponse.json(
          { error: `No hay suficientes entradas de tipo "${tt.name}"` },
          { status: 409 }
        );
      }

      orderItems.push({
        ticket_type_id: ticketTypeId,
        name: tt.name,
        qty: quantity,
        price: tt.price,
      });

      total += tt.price * quantity;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        match_id: matchId,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_dni: buyerDni,
        total,
        status: 'pending',
        items: orderItems,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single();

    if (orderError || !order) {
      // Rollback reservations
      for (const item of orderItems) {
        await supabase.rpc('release_reservation', {
          p_ticket_type_id: item.ticket_type_id,
          p_quantity: item.qty,
        });
      }
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 });
    }

    // Create Mercado Pago preference
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const preference = new Preference(mpClient);
    const mpPref = await preference.create({
      body: {
        items: orderItems.map((item) => ({
          id: item.ticket_type_id,
          title: `${item.name} - Talleres vs ${match.rival}`,
          quantity: item.qty,
          unit_price: Number(item.price),
          currency_id: 'ARS',
        })),
        payer: {
          name: buyerName,
          email: buyerEmail,
        },
        back_urls: {
          success: `${siteUrl}/confirmacion?order=${order.id}`,
          failure: `${siteUrl}/partido/${matchId}?error=payment`,
          pending: `${siteUrl}/confirmacion?order=${order.id}&pending=1`,
        },
        auto_return: 'approved',
        external_reference: order.id,
        notification_url: `${siteUrl}/api/webhook/mercadopago`,
        expires: true,
        expiration_date_to: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    });

    // Update order with MP preference ID
    await supabase
      .from('orders')
      .update({ mp_preference_id: mpPref.id })
      .eq('id', order.id);

    return NextResponse.json({
      orderId: order.id,
      init_point: mpPref.init_point,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
