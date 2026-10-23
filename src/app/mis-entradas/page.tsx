'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TicketDisplay from '@/components/TicketDisplay';
import { isValidDNI, sanitizeDNI } from '@/lib/utils';

interface TicketData {
  id: string;
  code: string;
  token: string;
  typeName: string;
  matchRival: string;
  matchDate: string;
  matchVenue: string;
  isUsed: boolean;
}

export default function MisEntradasPage() {
  const [dni, setDni] = useState('');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSearch() {
    const errs: Record<string, string> = {};
    if (!isValidDNI(sanitizeDNI(dni))) errs.dni = 'Ingresá un DNI válido (7 u 8 dígitos)';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/mis-entradas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni: sanitizeDNI(dni),
        }),
      });

      const data = await res.json();
      setTickets(data.tickets || []);
      setSearched(true);

      // Cache for offline access
      if ('caches' in window) {
        try {
          const cache = await caches.open('mis-entradas-v1');
          const cacheKey = `tickets-${sanitizeDNI(dni)}`;
          await cache.put(
            cacheKey,
            new Response(JSON.stringify(data.tickets || []))
          );
        } catch {
          // Ignore cache errors
        }
      }
    } catch {
      // Try loading from cache
      if ('caches' in window) {
        try {
          const cache = await caches.open('mis-entradas-v1');
          const cacheKey = `tickets-${sanitizeDNI(dni)}`;
          const cached = await cache.match(cacheKey);
          if (cached) {
            const cachedTickets = await cached.json();
            setTickets(cachedTickets);
            setSearched(true);
            setLoading(false);
            return;
          }
        } catch {
          // Ignore
        }
      }
      setErrors({ general: 'Error de conexión. Intentá de nuevo.' });
    }
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-8 max-w-xl mx-auto w-full">
        <div className="animate-fade-in-up">
          <div className="text-center mb-6">
            <span className="badge-competition mb-2">
              🎫 Portal de Entradas
            </span>
            <h1 className="font-black text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]">
              Mis Entradas
            </h1>
            <p className="text-[var(--text-secondary)] text-sm max-w-xs mx-auto mt-1">
              Ingresá tu número de DNI para ver y descargar tus entradas con código QR.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-6 mb-8 shadow-sm">
            <div className="space-y-4">
              <div>
                <label htmlFor="search-dni" className="input-label">
                  DNI del titular
                </label>
                <input
                  id="search-dni"
                  type="text"
                  inputMode="numeric"
                  className={`input-field ${errors.dni ? 'error' : ''}`}
                  placeholder="Ej: 38123456"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {errors.dni && <p className="input-error">{errors.dni}</p>}
              </div>

              {errors.general && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs font-bold text-rose-500">
                  {errors.general}
                </div>
              )}

              <button
                className="btn-primary"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    <span>Buscando entradas...</span>
                  </>
                ) : (
                  <span>Buscar mis entradas</span>
                )}
              </button>
            </div>
          </div>

          {searched && tickets.length === 0 && (
            <div className="text-center py-12 px-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-card)] animate-fade-in-up">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-black text-lg mb-1 text-[var(--text-primary)]">
                No encontramos entradas
              </h3>
              <p className="text-[var(--text-secondary)] text-sm max-w-xs mx-auto">
                Verificá que el email y el DNI coincidan exactamente con los ingresados al pagar.
              </p>
            </div>
          )}

          {tickets.length > 0 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {tickets.length} entrada{tickets.length > 1 ? 's' : ''} disponible{tickets.length > 1 ? 's' : ''}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  Mostrá el QR en el molinete
                </span>
              </div>

              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`transition-opacity ${ticket.isUsed ? 'opacity-60' : ''}`}
                >
                  {ticket.isUsed && (
                    <div className="text-xs font-bold text-amber-500 mb-2 uppercase tracking-wider flex items-center gap-1.5 px-2">
                      <span>✓</span>
                      <span>Esta entrada ya fue escaneada en el acceso</span>
                    </div>
                  )}
                  <TicketDisplay ticket={ticket} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
