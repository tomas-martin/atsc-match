'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';

interface Stats {
  totalMatches: number;
  totalOrders: number;
  totalRevenue: number;
  totalTickets: number;
  ticketsUsed: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [matchesRes, ordersRes, ticketsRes] = await Promise.all([
          fetch('/api/admin/matches'),
          fetch('/api/admin/orders'),
          fetch('/api/admin/tickets'),
        ]);

        const matchesData = await matchesRes.json();
        const ordersData = await ordersRes.json();
        const ticketsData = await ticketsRes.json();

        const approvedOrders = (ordersData.orders || []).filter(
          (o: { status: string }) => o.status === 'approved'
        );

        setStats({
          totalMatches: matchesData.matches?.length || 0,
          totalOrders: approvedOrders.length,
          totalRevenue: approvedOrders.reduce((s: number, o: { total: number }) => s + Number(o.total), 0),
          totalTickets: ticketsData.tickets?.length || 0,
          ticketsUsed: ticketsData.tickets?.filter((t: { is_used: boolean }) => t.is_used).length || 0,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    }
    load();
  }, []);

  const statCards = stats
    ? [
        { label: 'Partidos', value: stats.totalMatches, icon: '⚽' },
        { label: 'Órdenes', value: stats.totalOrders, icon: '🧾' },
        { label: 'Facturación', value: formatPrice(stats.totalRevenue), icon: '💰' },
        { label: 'Entradas vendidas', value: stats.totalTickets, icon: '🎫' },
        { label: 'Entradas usadas', value: `${stats.ticketsUsed}/${stats.totalTickets}`, icon: '✅' },
      ]
    : [];

  return (
    <div>
      <h1 className="font-black text-2xl mb-6">Dashboard</h1>

      {!stats ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner spinner-large" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="glass-card p-5">
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className="font-extrabold text-2xl">{card.value}</div>
              <div className="text-sm text-gray-blue font-medium mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
