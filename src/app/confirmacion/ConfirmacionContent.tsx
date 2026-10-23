'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TicketDisplay from '@/components/TicketDisplay';

interface TicketData {
  id: string;
  code: string;
  token: string;
  typeName: string;
  matchRival: string;
  matchDate: string;
  matchVenue: string;
}

interface ConfirmationData {
  order: {
    id: string;
    buyer_name: string;
    buyer_email: string;
    status: string;
  };
  tickets: TicketData[];
}

export default function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const pending = searchParams.get('pending');
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [error, setError] = useState(!orderId ? 'No se encontró la orden' : '');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/order/${orderId}`);
        if (!res.ok) throw new Error('Orden no encontrada');
        const result = await res.json();

        if (result.order.status === 'pending' && retryCount < 10) {
          // Payment might still be processing, retry
          setTimeout(() => setRetryCount((c) => c + 1), 3000);
          return;
        }

        setData(result);
        setLoading(false);
      } catch {
        setError('No se pudo cargar la orden');
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, retryCount]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up text-center">
        <div className="spinner mb-4 text-rose-500" />
        <p className="text-[var(--text-secondary)] font-semibold text-sm">
          {retryCount > 0
            ? 'Esperando confirmación del pago en Mercado Pago...'
            : 'Cargando tus entradas oficiales...'}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 px-4 bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl animate-fade-in-up">
        <div className="text-4xl mb-3">😕</div>
        <h2 className="font-black text-xl mb-2 text-[var(--text-primary)]">
          {error || 'Error'}
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs mx-auto">
          No pudimos localizar la compra. Si pagaste recientemente, revisá tu casilla de email.
        </p>
        <Link href="/" className="btn-secondary !w-auto inline-flex">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (pending || data.order.status === 'pending') {
    return (
      <div className="text-center py-16 px-4 bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl animate-fade-in-up">
        <div className="text-4xl mb-3">⏳</div>
        <h2 className="font-black text-xl mb-2 text-[var(--text-primary)]">
          Pago en proceso
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs mx-auto">
          Tu pago se está acreditando. En cuanto Mercado Pago nos notifique, tus entradas aparecerán acá y en tu email.
        </p>
        <Link href="/mis-entradas" className="btn-secondary !w-auto inline-flex">
          Buscar en Mis Entradas
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Success Hero Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
          🎉
        </div>
        <span className="badge-competition !bg-emerald-500/15 !text-emerald-600 !border-emerald-500/30 mb-2">
          Pago Aprobado
        </span>
        <h1 className="font-black text-2xl sm:text-3xl text-[var(--text-primary)] mb-2">
          ¡Entradas Listas!
        </h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto">
          Gracias <strong className="text-[var(--text-primary)]">{data.order.buyer_name}</strong>. Podés guardar o mostrar estos códigos QR directamente desde tu celular en el molinete.
        </p>
        {data.order.status === 'approved' && (
          <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">
            📩 Copia de respaldo enviada a <strong>{data.order.buyer_email}</strong>
          </p>
        )}
      </div>

      {/* Tickets List */}
      <div className="space-y-6">
        {data.tickets.map((ticket) => (
          <TicketDisplay key={ticket.id} ticket={ticket} />
        ))}
      </div>

      {/* Navigation actions */}
      <div className="mt-8 space-y-3">
        <Link href="/mis-entradas" className="btn-secondary">
          Guardar / Ver todas mis entradas
        </Link>
        <Link href="/" className="btn-pill !w-full !justify-center !py-3">
          Volver a la cartelera de partidos
        </Link>
      </div>

      {/* Club Hashtags */}
      <div className="text-center mt-8 text-xs font-black text-rose-500 tracking-widest uppercase">
        #SomosTalleres · #ElMatador
      </div>
    </div>
  );
}
