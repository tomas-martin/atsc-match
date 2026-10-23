'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { MatchWithTicketTypes } from '@/lib/types';
import {
  formatDate,
  formatTime,
  formatPrice,
  isValidEmail,
  isValidDNI,
  sanitizeDNI,
} from '@/lib/utils';
import ClubShield from '@/components/ClubShield';
import RivalShield from '@/components/RivalShield';
import Link from 'next/link';

interface CheckoutContentProps {
  match: MatchWithTicketTypes;
}

interface CartItem {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CheckoutContent({ match }: CheckoutContentProps) {
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerDni, setBuyerDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 1. Try URL parameter
    const queryItems = searchParams.get('items');
    if (queryItems) {
      try {
        const parsed = JSON.parse(decodeURIComponent(queryItems));
        if (Array.isArray(parsed) && parsed.length > 0) {
          queueMicrotask(() => {
            setCart(parsed);
            setReady(true);
          });
          return;
        }
      } catch {
        // Ignore parse error
      }
    }

    // 2. Try sessionStorage fallback
    try {
      const saved = sessionStorage.getItem(`atsc_cart_${match.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          queueMicrotask(() => {
            setCart(parsed);
            setReady(true);
          });
          return;
        }
      }
    } catch {
      // Ignore
    }

    queueMicrotask(() => setReady(true));
  }, [match.id, searchParams]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

      // Clear cart on success and redirect to Mercado Pago
      try {
        sessionStorage.removeItem(`atsc_cart_${match.id}`);
      } catch {
        // Ignore
      }

      window.location.href = data.init_point;
    } catch {
      setErrors({ general: 'Error de conexión. Intentá de nuevo.' });
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="py-20 text-center">
        <div className="spinner mx-auto text-rose-500" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-card)] animate-fade-in-up">
        <div className="text-4xl mb-3">🎟️</div>
        <h2 className="font-black text-xl mb-2 text-[var(--text-primary)]">
          No seleccionaste entradas
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs mx-auto">
          Para continuar con tus datos, primero elegí al menos 1 entrada en la cartelera del partido.
        </p>
        <Link
          href={`/partido/${match.id}`}
          className="btn-primary !w-auto inline-flex"
        >
          ← Elegir mis entradas
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Navigation & Stepper */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/partido/${match.id}`}
          className="text-xs font-bold text-[var(--text-secondary)] hover:text-rose-500 transition-colors flex items-center gap-1.5"
        >
          ← Modificar entradas
        </Link>
        <span className="badge-competition">Paso 2 de 2</span>
      </div>

      {/* Visual Stepper */}
      <div className="flex items-center justify-between mb-6 px-2">
        <Link
          href={`/partido/${match.id}`}
          className="flex items-center gap-2 text-emerald-500 hover:opacity-80 transition-opacity"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
            ✓
          </div>
          <span className="text-xs font-black">
            Entradas ({totalItems})
          </span>
        </Link>
        <div className="flex-1 mx-3 h-0.5 bg-emerald-500" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-rose-500 text-white font-black text-xs flex items-center justify-center">
            2
          </div>
          <span className="text-xs font-black text-[var(--text-primary)]">
            Datos y Pago
          </span>
        </div>
      </div>

      {/* Match info brief banner */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ClubShield size={32} glow />
            <span className="text-xs font-black text-rose-500">VS</span>
            <RivalShield rivalName={match.rival} size={32} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
              Andes Talleres vs {match.rival}
            </div>
            <div className="font-extrabold text-sm text-[var(--text-primary)] capitalize">
              {formatDate(match.date)} · {formatTime(match.date)} hs
            </div>
          </div>
        </div>

        <Link
          href={`/partido/${match.id}`}
          className="text-xs font-bold text-blue-500 hover:underline flex-shrink-0"
        >
          Editar
        </Link>
      </div>

      {/* Buyer info form card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-6 mb-6 shadow-sm">
        <h2 className="font-black text-lg mb-4 text-[var(--text-primary)]">
          Datos del Comprador
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="input-label">
              Nombre y Apellido
            </label>
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
            <label htmlFor="email" className="input-label">
              Correo Electrónico
            </label>
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
              📩 Importante: Tus entradas con código QR se enviarán a este correo
            </p>
          </div>

          <div>
            <label htmlFor="dni" className="input-label">
              DNI del Titular
            </label>
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
            <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
              Se solicitará en el acceso para validar la entrada
            </p>
          </div>
        </div>
      </div>

      {/* Order Summary Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Resumen de tu compra ({totalItems} entrada{totalItems > 1 ? 's' : ''})
          </h3>
          <Link
            href={`/partido/${match.id}`}
            className="text-xs font-bold text-blue-500 hover:underline"
          >
            Modificar
          </Link>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {cart.map((item) => (
            <div key={item.ticketTypeId} className="flex justify-between items-center py-2.5 text-sm">
              <div>
                <span className="font-bold text-[var(--text-primary)]">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-xs text-[var(--text-muted)] block">
                  {formatPrice(item.price)} c/u
                </span>
              </div>
              <span className="font-black text-[var(--text-primary)]">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border-card)] mt-3 pt-3 flex justify-between items-center">
          <div>
            <span className="font-bold text-[var(--text-primary)] block">Total Final</span>
            <span className="text-[11px] text-[var(--text-muted)]">Sin cargos ocultos</span>
          </div>
          <span className="font-black text-2xl text-rose-500">
            {formatPrice(totalPrice)}
          </span>
        </div>
      </div>

      {errors.general && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 mb-4 text-xs font-bold text-rose-500">
          {errors.general}
        </div>
      )}

      {/* Pay Action Button */}
      <button
        className="btn-primary"
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="spinner" />
            <span>Conectando con Mercado Pago...</span>
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

      {/* Security assurances */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-[var(--text-muted)] font-medium text-center">
        <span>🔒 Pago 100% Seguro</span>
        <span>·</span>
        <span>⚡ Confirmación Inmediata</span>
        <span>·</span>
        <span>🎟️ QR en tu Celular</span>
      </div>
    </div>
  );
}
