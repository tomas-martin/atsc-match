'use client';

import { useState } from 'react';

import type { MatchWithTicketTypes, CartItem } from '@/lib/types';
import {
  formatDate,
  formatTime,
  formatPrice,
  getAvailable,
  isLowStock,
  isValidEmail,
  isValidDNI,
  sanitizeDNI,
} from '@/lib/utils';
import ClubShield from '@/components/ClubShield';

interface MatchDetailProps {
  match: MatchWithTicketTypes;
}

export default function MatchDetail({ match }: MatchDetailProps) {

  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<'select' | 'checkout'>('select');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerDni, setBuyerDni] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const totalItems = cart.reduce((s, item) => s + item.quantity, 0);
  const totalPrice = cart.reduce((s, item) => s + item.quantity * item.price, 0);

  function updateQuantity(ticketTypeId: string, name: string, price: number, delta: number) {
    setCart((prev) => {
      const existing = prev.find((c) => c.ticketTypeId === ticketTypeId);
      if (existing) {
        const newQty = Math.max(0, Math.min(6, existing.quantity + delta));
        if (newQty === 0) return prev.filter((c) => c.ticketTypeId !== ticketTypeId);
        return prev.map((c) =>
          c.ticketTypeId === ticketTypeId ? { ...c, quantity: newQty } : c
        );
      }
      if (delta > 0) {
        // Check total cart doesn't exceed 6
        if (totalItems >= 6) return prev;
        return [...prev, { ticketTypeId, name, price, quantity: 1 }];
      }
      return prev;
    });
  }

  function getItemQty(ticketTypeId: string): number {
    return cart.find((c) => c.ticketTypeId === ticketTypeId)?.quantity || 0;
  }

  function validateCheckout(): boolean {
    const errs: Record<string, string> = {};
    if (!buyerName.trim()) errs.name = 'Ingresá tu nombre';
    if (!isValidEmail(buyerEmail)) errs.email = 'Email inválido';
    if (!isValidDNI(sanitizeDNI(buyerDni))) errs.dni = 'DNI inválido (7-8 dígitos)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCheckout() {
    if (!validateCheckout()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim().toLowerCase(),
          buyerDni: sanitizeDNI(buyerDni),
          items: cart,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || 'Error al procesar la compra' });
        setLoading(false);
        return;
      }

      // Redirect to Mercado Pago
      window.location.href = data.init_point;
    } catch {
      setErrors({ general: 'Error de conexión. Intentá de nuevo.' });
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      {/* Match header */}
      <div className="text-center mb-6">
        <span className="badge-competition">{match.competition}</span>

        <div className="flex items-center justify-center gap-6 my-6">
          <div className="flex flex-col items-center gap-2">
            <ClubShield size={56} />
            <span className="text-xs font-bold">A. TALLERES</span>
          </div>

          <div className="text-center">
            <div className="font-black text-3xl text-gray-blue">VS</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-navy-lighter flex items-center justify-center text-2xl font-black text-gray-blue">
              {match.rival.charAt(0)}
            </div>
            <span className="text-xs font-bold truncate max-w-[90px]">
              {match.rival.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="font-bold text-lg capitalize">{formatDate(match.date)}</div>
          <div className="text-blue-bright font-extrabold text-xl">
            {formatTime(match.date)} hs
          </div>
          <div className="text-gray-blue text-sm flex items-center justify-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {match.venue}
          </div>
        </div>
      </div>

      {step === 'select' && (
        <>
          {/* Ticket types */}
          <div className="space-y-3 mb-6">
            <h2 className="font-bold text-lg">Entradas</h2>
            {match.ticket_types.map((tt) => {
              const available = getAvailable(tt.quota, tt.sold, tt.reserved);
              const low = isLowStock(tt.quota, tt.sold, tt.reserved);
              const qty = getItemQty(tt.id);
              const canAdd = available > qty && totalItems < 6;

              return (
                <div
                  key={tt.id}
                  className="glass-card p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{tt.name}</div>
                    <div className="font-extrabold text-lg">
                      {formatPrice(tt.price)}
                    </div>
                    {low && available > 0 && (
                      <span className="badge-last-tickets text-[11px] mt-1">
                        🔥 Quedan {available}
                      </span>
                    )}
                    {available === 0 && (
                      <span className="text-gray-dark text-xs font-semibold">
                        Agotado
                      </span>
                    )}
                  </div>

                  {available > 0 && (
                    <div className="qty-selector">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(tt.id, tt.name, tt.price, -1)}
                        disabled={qty === 0}
                        aria-label="Reducir cantidad"
                      >
                        −
                      </button>
                      <div className="qty-value">{qty}</div>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(tt.id, tt.name, tt.price, 1)}
                        disabled={!canAdd}
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalItems > 0 && (
            <div className="text-center text-xs text-gray-blue mb-3">
              Máximo 6 entradas por compra · {totalItems}/6 seleccionadas
            </div>
          )}

          {/* Continue button */}
          <button
            className="btn-primary"
            disabled={totalItems === 0}
            onClick={() => setStep('checkout')}
          >
            Continuar · {formatPrice(totalPrice)}
          </button>
        </>
      )}

      {step === 'checkout' && (
        <div className="animate-fade-in-up">
          <button
            onClick={() => setStep('select')}
            className="text-sm text-gray-blue hover:text-white flex items-center gap-1 mb-4 transition-colors"
          >
            ← Volver a entradas
          </button>

          <h2 className="font-bold text-lg mb-4">Datos del comprador</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="name" className="input-label">Nombre completo</label>
              <input
                id="name"
                type="text"
                className={`input-field ${errors.name ? 'error' : ''}`}
                placeholder="Juan Pérez"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
              {errors.name && <p className="input-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="input-label">Email</label>
              <input
                id="email"
                type="email"
                className={`input-field ${errors.email ? 'error' : ''}`}
                placeholder="juan@email.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
              />
              {errors.email && <p className="input-error">{errors.email}</p>}
              <p className="text-xs text-gray-dark mt-1">
                Las entradas se enviarán a este email
              </p>
            </div>

            <div>
              <label htmlFor="dni" className="input-label">DNI</label>
              <input
                id="dni"
                type="text"
                inputMode="numeric"
                className={`input-field ${errors.dni ? 'error' : ''}`}
                placeholder="12345678"
                value={buyerDni}
                onChange={(e) => setBuyerDni(e.target.value)}
              />
              {errors.dni && <p className="input-error">{errors.dni}</p>}
            </div>
          </div>

          {/* Order summary */}
          <div className="glass-card p-4 mb-6">
            <h3 className="font-bold text-sm text-gray-blue uppercase tracking-wider mb-3">
              Resumen
            </h3>
            {cart.map((item) => (
              <div key={item.ticketTypeId} className="flex justify-between text-sm py-1">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-blue-shield/30 mt-3 pt-3 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-extrabold text-lg">{formatPrice(totalPrice)}</span>
            </div>
          </div>

          {errors.general && (
            <div className="bg-red-shield/10 border border-red-shield/30 rounded-xl p-3 mb-4 text-sm text-red-shield">
              {errors.general}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Procesando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Pagar con Mercado Pago
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
