'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';

interface Order {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_dni: string;
  total: number;
  status: string;
  email_sent: boolean;
  created_at: string;
  matches: { rival: string; date: string } | null;
}

export default function AdminOrdenesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      if (cancelled) return;
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [statusFilter]);

  function exportCSV() {
    const params = new URLSearchParams({ format: 'csv' });
    if (statusFilter) params.set('status', statusFilter);
    window.open(`/api/admin/orders?${params}`, '_blank');
  }

  const statusColors: Record<string, string> = {
    approved: 'text-green-valid',
    pending: 'text-yellow-warn',
    rejected: 'text-red-shield',
    expired: 'text-gray-dark',
  };

  const statusLabels: Record<string, string> = {
    approved: 'Aprobada',
    pending: 'Pendiente',
    rejected: 'Rechazada',
    expired: 'Expirada',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-black text-2xl">Órdenes</h1>
        <div className="flex gap-2">
          <select
            className="input-field !w-auto text-sm !py-2 !px-3"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="approved">Aprobadas</option>
            <option value="pending">Pendientes</option>
            <option value="rejected">Rechazadas</option>
            <option value="expired">Expiradas</option>
          </select>
          <button
            className="btn-secondary !w-auto !min-h-0 !py-2 !px-4 text-sm"
            onClick={exportCSV}
          >
            📥 CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner spinner-large" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-blue">No hay órdenes</div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{order.buyer_name}</div>
                  <div className="text-xs text-gray-blue">
                    {order.buyer_email} · DNI: {order.buyer_dni}
                  </div>
                  <div className="text-xs text-gray-dark mt-1">
                    vs {order.matches?.rival || '?'} · {new Date(order.created_at).toLocaleDateString('es-AR')}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-extrabold">{formatPrice(order.total)}</div>
                  <div className={`text-xs font-bold ${statusColors[order.status] || ''}`}>
                    {statusLabels[order.status] || order.status}
                  </div>
                  {order.status === 'approved' && !order.email_sent && (
                    <div className="text-xs text-yellow-warn mt-1">⚠ Mail no enviado</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
