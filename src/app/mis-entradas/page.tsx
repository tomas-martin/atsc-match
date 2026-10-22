'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TicketDisplay from '@/components/TicketDisplay';
import { isValidEmail, isValidDNI, sanitizeDNI } from '@/lib/utils';

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
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSearch() {
    const errs: Record<string, string> = {};
    if (!isValidEmail(email)) errs.email = 'Email inválido';
    if (!isValidDNI(sanitizeDNI(dni))) errs.dni = 'DNI inválido';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/mis-entradas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
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
          const cacheKey = `tickets-${email.trim().toLowerCase()}-${sanitizeDNI(dni)}`;
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
          const cacheKey = `tickets-${email.trim().toLowerCase()}-${sanitizeDNI(dni)}`;
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
      setErrors({ general: 'Error de conexión' });
    }
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <div className="animate-fade-in-up">
          <h1 className="font-black text-2xl mb-1">Mis Entradas</h1>
          <p className="text-gray-blue text-sm mb-6">
            Buscá tus entradas con el email y DNI de la compra
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="search-email" className="input-label">Email</label>
              <input
                id="search-email"
                type="email"
                className={`input-field ${errors.email ? 'error' : ''}`}
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="input-error">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="search-dni" className="input-label">DNI</label>
              <input
                id="search-dni"
                type="text"
                inputMode="numeric"
                className={`input-field ${errors.dni ? 'error' : ''}`}
                placeholder="12345678"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
              />
              {errors.dni && <p className="input-error">{errors.dni}</p>}
            </div>

            {errors.general && (
              <div className="bg-red-shield/10 border border-red-shield/30 rounded-xl p-3 text-sm text-red-shield">
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
                  Buscando...
                </>
              ) : (
                'Buscar mis entradas'
              )}
            </button>
          </div>

          {searched && tickets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🎫</div>
              <p className="font-bold text-lg mb-1">No encontramos entradas</p>
              <p className="text-gray-blue text-sm">
                Verificá que el email y DNI sean los de la compra
              </p>
            </div>
          )}

          {tickets.length > 0 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-blue">
                {tickets.length} entrada{tickets.length > 1 ? 's' : ''} encontrada{tickets.length > 1 ? 's' : ''}
              </p>
              {tickets.map((ticket) => (
                <div key={ticket.id} className={ticket.isUsed ? 'opacity-50' : ''}>
                  {ticket.isUsed && (
                    <div className="text-xs font-bold text-yellow-warn mb-2 uppercase tracking-wider">
                      ✓ Ya utilizada
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
