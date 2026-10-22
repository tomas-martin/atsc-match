import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { generateTicketCode, signTicket } from '@/lib/tickets';
import { sendTicketEmail } from '@/lib/email';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

/**
 * Verify Mercado Pago webhook signature
 */
function verifyWebhookSignature(req: NextRequest): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if no secret (dev mode)

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');

  if (!xSignature || !xRequestId) return false;

  // Parse x-signature header
  const parts: Record<string, string> = {};
  xSignature.split(',').forEach((part) => {
    const [key, value] = part.trim().split('=');
    if (key && value) parts[key] = value;
  });

  const ts = parts['ts'];
  const v1 = parts['v1'];

  if (!ts || !v1) return false;

  // Get data.id from query params
  const url = new URL(req.url);
  const dataId = url.searchParams.get('data.id') || '';

  // Build the manifest
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(req)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);

    // Only process payment notifications
    if (data.type !== 'payment' && data.action !== 'payment.created' && data.action !== 'payment.updated') {
      return NextResponse.json({ ok: true });
    }

    const paymentId = data.data?.id;
    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    // Get payment info from Mercado Pago API
    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment || payment.status !== 'approved') {
      // If rejected, mark order as rejected
      if (payment?.status === 'rejected' && payment.external_reference) {
        const supabase = createServerClient();
        const { data: order } = await supabase
          .from('orders')
          .select('id, items, status')
          .eq('id', payment.external_reference)
          .single();

        if (order && order.status === 'pending') {
          // Release reservations
          for (const item of order.items as { ticket_type_id: string; qty: number }[]) {
            await supabase.rpc('release_reservation', {
              p_ticket_type_id: item.ticket_type_id,
              p_quantity: item.qty,
            });
          }
          await supabase
            .from('orders')
            .update({ status: 'rejected', mp_payment_id: String(paymentId) })
            .eq('id', order.id);
        }
      }
      return NextResponse.json({ ok: true });
    }

    const orderId = payment.external_reference;
    if (!orderId) {
      console.error('No external_reference in payment');
      return NextResponse.json({ ok: true });
    }

    const supabase = createServerClient();

    // IDEMPOTENCY CHECK: Only process if order is still pending
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ ok: true });
    }

    // If already approved, webhook is duplicate - skip
    if (order.status === 'approved') {
      return NextResponse.json({ ok: true });
    }

    // Update order to approved
    await supabase
      .from('orders')
      .update({
        status: 'approved',
        mp_payment_id: String(paymentId),
        mp_merchant_order_id: payment.order?.id ? String(payment.order.id) : null,
      })
      .eq('id', orderId);

    // Confirm reservations and create tickets
    const tickets = [];

    for (const item of order.items as { ticket_type_id: string; name: string; qty: number; price: number }[]) {
      // Confirm reservation (move from reserved to sold)
      await supabase.rpc('confirm_reservation', {
        p_ticket_type_id: item.ticket_type_id,
        p_quantity: item.qty,
      });

      // Create individual tickets
      for (let i = 0; i < item.qty; i++) {
        const code = generateTicketCode();
        // We need to insert first to get the id, then sign
        const { data: ticket } = await supabase
          .from('tickets')
          .insert({
            order_id: orderId,
            match_id: order.match_id,
            ticket_type_id: item.ticket_type_id,
            code,
            token: 'pending', // temporary
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

          tickets.push({
            id: ticket.id,
            code,
            token,
            typeName: item.name,
          });
        }
      }
    }

    // Get match info for the email
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', order.match_id)
      .single();

    // Send email with tickets
    try {
      await sendTicketEmail({
        to: order.buyer_email,
        buyerName: order.buyer_name,
        match: match!,
        tickets,
        orderId,
      });

      await supabase
        .from('orders')
        .update({ email_sent: true })
        .eq('id', orderId);
    } catch (emailError) {
      // Email failure should NOT affect the purchase
      console.error('Email sending error:', emailError);
      const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown email error';
      await supabase
        .from('orders')
        .update({
          email_sent: false,
          email_error: errorMsg.substring(0, 500), // Don't store credentials
        })
        .eq('id', orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Return 200 to prevent MP from retrying on server errors we can't fix
    return NextResponse.json({ ok: true });
  }
}
