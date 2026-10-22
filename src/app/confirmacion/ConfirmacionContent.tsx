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
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
        <div className="spinner spinner-large mb-4" />
        <p className="text-gray-blue text-center">
          {retryCount > 0
            ? 'Esperando confirmación del pago...'
            : 'Cargando tu compra...'}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="font-bold text-xl mb-2">{error || 'Error'}</h2>
        <Link href="/" className="btn-secondary !w-auto inline-flex mt-4">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (pending || data.order.status === 'pending') {
    return (
      <div className="text-center py-16 animate-fade-in-up">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="font-bold text-xl mb-2">Pago pendiente</h2>
        <p className="text-gray-blue text-sm mb-6">
          Tu pago está siendo procesado. Las entradas se generarán cuando se confirme.
        </p>
        <Link href="/" className="btn-secondary !w-auto inline-flex">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="font-black text-2xl mb-2">¡Compra confirmada!</h1>
        <p className="text-gray-blue text-sm">
          Hola {data.order.buyer_name}, tus entradas están listas.
          <br />
          Mostrá el QR en la puerta del estadio.
        </p>
        {data.order.status === 'approved' && (
          <p className="text-xs text-gray-dark mt-2">
            También las enviamos a {data.order.buyer_email}
          </p>
        )}
      </div>

      {/* Tickets */}
      <div className="space-y-6">
        {data.tickets.map((ticket) => (
          <TicketDisplay key={ticket.id} ticket={ticket} />
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <Link href="/mis-entradas" className="btn-secondary">
          Ver todas mis entradas
        </Link>
        <Link href="/" className="btn-secondary">
          Volver al inicio
        </Link>
      </div>

      {/* Club hashtags */}
      <div className="text-center mt-8 text-sm font-bold text-red-shield tracking-wider">
        #SomosTalleres #SomosFamilia
      </div>
    </div>
  );
}
