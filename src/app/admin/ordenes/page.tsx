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
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function reloadOrders() {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/api/admin/orders?${params}`);
        const data = await res.json();
        if (active) {
          setOrders(data.orders || []);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [statusFilter]);

  function exportCSV() {
    const params = new URLSearchParams({ format: 'csv' });
    if (statusFilter) params.set('status', statusFilter);
    window.open(`/api/admin/orders?${params}`, '_blank');
  }

  async function handleOrderAction(orderId: string, action: 'approve' | 'reject') {
    const confirmMsg =
      action === 'approve'
        ? '¿Aprobar esta orden y emitir las entradas oficiales con código QR?'
        : '¿Cancelar esta orden y liberar las entradas reservadas?';

    if (!confirm(confirmMsg)) return;

    setProcessingId(orderId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message || 'Operación exitosa');
        await reloadOrders();
      } else {
        alert(data.error || 'Error al procesar la orden');
      }
    } catch {
      alert('Error de conexión al procesar la orden');
    } finally {
      setProcessingId(null);
    }
  }

  const statusColors: Record<string, string> = {
    approved: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    pending: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    rejected: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    expired: 'text-[var(--text-muted)] bg-slate-500/10 border-slate-500/20',
  };

  const statusLabels: Record<string, string> = {
    approved: 'Aprobada',
    pending: 'Pendiente',
    rejected: 'Rechazada',
    expired: 'Expirada',
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-black text-2xl text-[var(--text-primary)]">Órdenes de Compra</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Historial de compras, control de pagos y emisión manual
          </p>
        </div>
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
            📥 Exportar CSV
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner spinner-large" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">No hay órdenes registradas</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isProcessing = processingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-[var(--text-primary)]">
                        {order.buyer_name}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          statusColors[order.status] || ''
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--text-secondary)] mt-1 space-y-0.5">
                      <div>
                        DNI: <strong className="text-[var(--text-primary)]">{order.buyer_dni}</strong> · {order.buyer_email}
                      </div>
                      <div className="text-[var(--text-muted)]">
                        vs {order.matches?.rival || '?'} · {new Date(order.created_at).toLocaleString('es-AR')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <div className="font-black text-lg text-[var(--text-primary)]">
                      {formatPrice(order.total)}
                    </div>
                    {order.status === 'approved' && !order.email_sent && (
                      <span className="text-[10px] font-bold text-amber-500 mt-0.5">
                        ⚠ Mail no enviado
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones para órdenes pendientes */}
                {order.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Esperando pago de Mercado Pago o confirmación manual
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOrderAction(order.id, 'approve')}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isProcessing ? 'Procesando...' : '✓ Aprobar y Emitir Entradas'}
                      </button>
                      <button
                        onClick={() => handleOrderAction(order.id, 'reject')}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors border border-rose-500/30 disabled:opacity-50"
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
