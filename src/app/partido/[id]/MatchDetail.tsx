'use client';

import { useState } from 'react';
import type { MatchWithTicketTypes } from '@/lib/types';
import {
  formatDate,
  formatTime,
  formatPrice,
  isLowStock,
  getAvailable,
  isValidEmail,
  isValidDNI,
  sanitizeDNI,
} from '@/lib/utils';
import ClubShield from '@/components/ClubShield';

interface MatchDetailProps {
  match: MatchWithTicketTypes;
}

interface CartItem {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function MatchDetail({ match }: MatchDetailProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerDni, setBuyerDni] = useState('');
  const [step, setStep] = useState<'select' | 'checkout'>('select');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function getItemQty(ticketTypeId: string): number {
    return cart.find((item) => item.ticketTypeId === ticketTypeId)?.quantity || 0;
  }

  function updateQuantity(ticketTypeId: string, name: string, price: number, delta: number) {
    setCart((prev) => {
      const existing = prev.find((item) => item.ticketTypeId === ticketTypeId);
      const currentQty = existing?.quantity || 0;
      const newQty = Math.max(0, currentQty + delta);

      // Check max 6 total items across all types
      const otherItemsTotal = prev
        .filter((item) => item.ticketTypeId !== ticketTypeId)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (otherItemsTotal + newQty > 6) return prev;

      if (newQty === 0) {
        return prev.filter((item) => item.ticketTypeId !== ticketTypeId);
      }

      if (existing) {
        return prev.map((item) =>
          item.ticketTypeId === ticketTypeId ? { ...item, quantity: newQty } : item
        );
      }

      return [...prev, { ticketTypeId, name, price, quantity: newQty }];
    });
  }

  function validateCheckoutForm(): boolean {
    const errs: Record<string, string> = {};
    if (!buyerName.trim()) errs.name = 'Ingresá tu nombre y apellido';
    if (!isValidEmail(buyerEmail)) errs.email = 'Ingresá un email válido';
    if (!isValidDNI(sanitizeDNI(buyerDni))) errs.dni = 'Ingresá un DNI válido (7 u 8 dígitos)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCheckout() {
    if (!validateCheckoutForm()) return;
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
          items: cart.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
          })),
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
      {/* Arena Match Header Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-6 text-center mb-6 shadow-sm">
        <span className="badge-competition">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {match.competition}
        </span>

        {/* Duel Presentation */}
        <div className="flex items-center justify-center gap-6 sm:gap-8 my-6">
          {/* Andes Talleres */}
          <div className="flex flex-col items-center gap-2">
            <ClubShield size={62} glow />
            <span className="text-xs font-black tracking-tight text-[var(--text-primary)]">
              A. TALLERES
            </span>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
              Local
            </span>
          </div>

          {/* Center VS pill */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center font-black text-sm text-rose-500 shadow-inner">
              VS
            </div>
          </div>

          {/* Rival Team */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-[62px] h-[78px] rounded-xl bg-gradient-to-b from-[var(--bg-surface-elevated)] to-[var(--bg-surface)] border-2 border-[var(--border-subtle)] flex items-center justify-center text-3xl font-black text-[var(--text-secondary)] shadow-sm">
              {match.rival.charAt(0)}
            </div>
            <span className="text-xs font-black tracking-tight text-[var(--text-primary)] truncate max-w-[100px]">
              {match.rival.toUpperCase()}
            </span>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Visitante
            </span>
          </div>
        </div>

        {/* Date, Time & Stadium */}
        <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
          <div className="font-extrabold text-base sm:text-lg capitalize text-[var(--text-primary)]">
            {formatDate(match.date)}
          </div>
          <div className="text-blue-500 font-black text-xl">
            {formatTime(match.date)} hs
          </div>
          <div className="text-[var(--text-secondary)] text-xs flex items-center justify-center gap-1.5 font-medium">
            <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {match.venue}
          </div>
        </div>
      </div>

      {step === 'select' && (
        <>
          {/* Ticket types selector */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-black text-base text-[var(--text-primary)]">
                Seleccioná tus entradas
              </h2>
              <span className="text-xs text-[var(--text-muted)] font-bold">
                Máx. 6 por persona
              </span>
            </div>

            {match.ticket_types.map((tt) => {
              const available = getAvailable(tt.quota, tt.sold, tt.reserved);
              const low = isLowStock(tt.quota, tt.sold, tt.reserved);
              const qty = getItemQty(tt.id);
              const canAdd = available > qty && totalItems < 6;

              return (
                <div
                  key={tt.id}
                  className={`ticket-type-card flex items-center justify-between gap-3 ${
                    qty > 0 ? 'active' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-[var(--text-primary)]">
                        {tt.name}
                      </span>
                      {qty > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                          {qty} seleccionada{qty > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="font-black text-lg text-[var(--text-primary)] mt-0.5">
                      {formatPrice(tt.price)}
                    </div>

                    {low && available > 0 && (
                      <span className="badge-last-tickets text-[10px] mt-1.5">
                        🔥 Quedan solo {available}
                      </span>
                    )}

                    {available === 0 && (
                      <span className="text-[var(--text-muted)] text-xs font-bold block mt-1">
                        Sector agotado
                      </span>
                    )}
                  </div>

                  {available > 0 && (
                    <div className="qty-selector flex-shrink-0">
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

          {/* Continue Action */}
          <div className="sticky bottom-4 z-20 pt-2">
            <button
              className="btn-primary"
              disabled={totalItems === 0}
              onClick={() => setStep('checkout')}
            >
              {totalItems > 0 ? (
                <>
                  <span>Continuar compra ({totalItems})</span>
                  <span className="font-extrabold">· {formatPrice(totalPrice)}</span>
                </>
              ) : (
                'Seleccioná al menos 1 entrada'
              )}
            </button>
          </div>
        </>
      )}

      {step === 'checkout' && (
        <div className="animate-fade-in-up">
          <button
            onClick={() => setStep('select')}
            className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 mb-4 transition-colors"
          >
            ← Modificar selección de entradas
          </button>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-black text-lg mb-4 text-[var(--text-primary)]">
              Datos del comprador
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="input-label">Nombre y Apellido</label>
                <input
                  id="name"
                  type="text"
                  className={`input-field ${errors.name ? 'error' : ''}`}
                  placeholder="Ej: Tomás Martín"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
                {errors.name && <p className="input-error">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="input-label">Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  className={`input-field ${errors.email ? 'error' : ''}`}
                  placeholder="tu@email.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                />
                {errors.email && <p className="input-error">{errors.email}</p>}
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium">
                  📩 Tu entrada con código QR llegará a este correo
                </p>
              </div>

              <div>
                <label htmlFor="dni" className="input-label">DNI del Titular</label>
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
          </div>

          {/* Order summary */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="font-black text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Resumen de la orden
            </h3>
            <div className="divide-y divide-[var(--border-subtle)]">
              {cart.map((item) => (
                <div key={item.ticketTypeId} className="flex justify-between items-center py-2 text-sm">
                  <span className="font-medium text-[var(--text-primary)]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--border-card)] mt-3 pt-3 flex justify-between items-center">
              <span className="font-bold text-[var(--text-primary)]">Total a pagar</span>
              <span className="font-black text-xl text-rose-500">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          {errors.general && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 mb-4 text-xs font-bold text-rose-500">
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
                <span>Generando pago...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Pagar con Mercado Pago · {formatPrice(totalPrice)}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
