'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';

interface Match {
  id: string;
  rival: string;
  date: string;
  venue: string;
  competition: string;
  is_featured: boolean;
  is_active: boolean;
  ticket_types: { id: string; name: string; price: number; quota: number; sold: number; reserved: number }[];
}

export default function AdminPartidosPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    rival: '',
    date: '',
    venue: 'Polideportivo Talleres',
    competition: 'Liga Mendocina de Futsal',
    is_featured: false,
    ticket_types: [
      { name: 'General', price: 3000, quota: 200 },
      { name: 'Socio', price: 1500, quota: 100 },
    ],
  });
  const [saving, setSaving] = useState(false);

  async function loadMatches() {
    const res = await fetch('/api/admin/matches');
    const data = await res.json();
    setMatches(data.matches || []);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/admin/matches');
      if (cancelled) return;
      const data = await res.json();
      setMatches(data.matches || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch('/api/admin/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSaving(false);
    setShowForm(false);
    setForm({
      rival: '', date: '', venue: 'Polideportivo Talleres',
      competition: 'Liga Mendocina de Futsal', is_featured: false,
      ticket_types: [{ name: 'General', price: 3000, quota: 200 }, { name: 'Socio', price: 1500, quota: 100 }],
    });
    loadMatches();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/matches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    });
    loadMatches();
  }

  async function toggleFeatured(id: string, isFeatured: boolean) {
    await fetch(`/api/admin/matches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: !isFeatured }),
    });
    loadMatches();
  }

  function addTicketType() {
    setForm((f) => ({
      ...f,
      ticket_types: [...f.ticket_types, { name: '', price: 0, quota: 0 }],
    }));
  }

  function removeTicketType(idx: number) {
    setForm((f) => ({
      ...f,
      ticket_types: f.ticket_types.filter((_, i) => i !== idx),
    }));
  }

  function updateTicketType(idx: number, field: string, value: string | number) {
    setForm((f) => ({
      ...f,
      ticket_types: f.ticket_types.map((tt, i) =>
        i === idx ? { ...tt, [field]: value } : tt
      ),
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner spinner-large" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-black text-2xl">Partidos</h1>
        <button className="btn-primary !w-auto !min-h-0 !py-2 !px-4 text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo partido'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-5 mb-6 space-y-4 animate-fade-in-up">
          <h2 className="font-bold text-lg">Nuevo partido</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Rival</label>
              <input
                className="input-field"
                value={form.rival}
                onChange={(e) => setForm({ ...form, rival: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">Fecha y hora</label>
              <input
                type="datetime-local"
                className="input-field"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">Sede</label>
              <input
                className="input-field"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">Competencia</label>
              <input
                className="input-field"
                value={form.competition}
                onChange={(e) => setForm({ ...form, competition: e.target.value })}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              className="w-4 h-4"
            />
            Partido destacado
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label !mb-0">Tipos de entrada</label>
              <button type="button" className="text-xs text-blue-bright hover:underline" onClick={addTicketType}>
                + Agregar tipo
              </button>
            </div>
            {form.ticket_types.map((tt, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <div className="flex-1">
                  <input
                    className="input-field text-sm"
                    placeholder="Nombre"
                    value={tt.name}
                    onChange={(e) => updateTicketType(i, 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    className="input-field text-sm"
                    placeholder="Precio"
                    value={tt.price || ''}
                    onChange={(e) => updateTicketType(i, 'price', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    className="input-field text-sm"
                    placeholder="Cupo"
                    value={tt.quota || ''}
                    onChange={(e) => updateTicketType(i, 'quota', Number(e.target.value))}
                    required
                  />
                </div>
                {form.ticket_types.length > 1 && (
                  <button
                    type="button"
                    className="text-red-shield text-lg px-2 hover:opacity-70"
                    onClick={() => removeTicketType(i)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Creando...' : 'Crear partido'}
          </button>
        </form>
      )}

      {/* Matches list */}
      <div className="space-y-3">
        {matches.map((match) => {
          const date = new Date(match.date);
          return (
            <div key={match.id} className={`glass-card p-4 ${!match.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg">vs {match.rival}</div>
                  <div className="text-sm text-gray-blue">
                    {date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-gray-dark">{match.venue} · {match.competition}</div>

                  {/* Ticket type stats */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {match.ticket_types.map((tt) => (
                      <span key={tt.id} className="text-xs bg-navy-lighter px-2 py-1 rounded-md">
                        {tt.name}: {tt.sold}/{tt.quota} ({formatPrice(tt.price)})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {match.is_featured && (
                    <span className="text-xs bg-red-shield/20 text-red-shield px-2 py-0.5 rounded text-center">⭐</span>
                  )}
                  <button
                    className="text-xs text-gray-blue hover:text-white transition-colors"
                    onClick={() => toggleFeatured(match.id, match.is_featured)}
                  >
                    {match.is_featured ? 'Quitar ⭐' : 'Destacar'}
                  </button>
                  <button
                    className="text-xs text-gray-blue hover:text-white transition-colors"
                    onClick={() => toggleActive(match.id, match.is_active)}
                  >
                    {match.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
