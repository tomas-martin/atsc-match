'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { MatchWithTicketTypes } from '@/lib/types';
import {
  formatDate,
  formatTime,
  formatPrice,
  isLowStock,
  getAvailable,
} from '@/lib/utils';
import ClubShield from '@/components/ClubShield';
import RivalShield from '@/components/RivalShield';
import TournamentLogo from '@/components/TournamentLogo';
import Link from 'next/link';

interface TicketSelectorProps {
  match: MatchWithTicketTypes;
}

export interface CartItem {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function TicketSelector({ match }: TicketSelectorProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);

  // Restore cart from sessionStorage if available
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`atsc_cart_${match.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        queueMicrotask(() => setCart(parsed));
      }
    } catch {
      // Ignore
    }
  }, [match.id]);

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

      let nextCart: CartItem[];
      if (newQty === 0) {
        nextCart = prev.filter((item) => item.ticketTypeId !== ticketTypeId);
      } else if (existing) {
        nextCart = prev.map((item) =>
          item.ticketTypeId === ticketTypeId ? { ...item, quantity: newQty } : item
        );
      } else {
        nextCart = [...prev, { ticketTypeId, name, price, quantity: newQty }];
      }

      try {
        sessionStorage.setItem(`atsc_cart_${match.id}`, JSON.stringify(nextCart));
      } catch {
        // Ignore
      }

      return nextCart;
    });
  }

  function handleContinue() {
    if (totalItems === 0) return;
    try {
      sessionStorage.setItem(`atsc_cart_${match.id}`, JSON.stringify(cart));
    } catch {
      // Ignore
    }
    const query = encodeURIComponent(JSON.stringify(cart));
    router.push(`/partido/${match.id}/checkout?items=${query}`);
  }

  return (
    <div className="animate-fade-in-up">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/partidos"
          className="text-xs font-bold text-[var(--text-secondary)] hover:text-rose-500 transition-colors flex items-center gap-1.5"
        >
          ← Volver a partidos
        </Link>
        <span className="badge-competition">Paso 1 de 2</span>
      </div>

      {/* Visual Stepper */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-rose-500 text-white font-black text-xs flex items-center justify-center">
            1
          </div>
          <span className="text-xs font-black text-[var(--text-primary)]">
            Elegir Entradas
          </span>
        </div>
        <div className="flex-1 mx-3 h-0.5 bg-[var(--border-subtle)]" />
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-6 h-6 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-black text-xs flex items-center justify-center">
            2
          </div>
          <span className="text-xs font-bold text-[var(--text-muted)]">
            Completar Datos
          </span>
        </div>
      </div>

      {/* Arena Match Header Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-2xl p-6 text-center mb-6 shadow-sm">
        <span className="badge-competition">
          <TournamentLogo competitionName={match.competition} size={18} />
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
            <RivalShield rivalName={match.rival} size={62} />
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

      {/* Ticket types selector */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-black text-base text-[var(--text-primary)]">
            Seleccioná la cantidad de entradas
          </h2>
        </div>

        {match.ticket_types.map((tt) => {
          const available = getAvailable(tt.quota, tt.sold, tt.reserved);
          const low = isLowStock(tt.quota, tt.sold, tt.reserved);
          const qty = getItemQty(tt.id);
          const canAdd = available > qty;

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
                      {qty} elegida{qty > 1 ? 's' : ''}
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

      {/* Floating Continue Action */}
      <div className="sticky bottom-4 z-20 pt-2">
        <button
          className="btn-primary"
          disabled={totalItems === 0}
          onClick={handleContinue}
        >
          {totalItems > 0 ? (
            <>
              <span>Continuar a completar datos ({totalItems})</span>
              <span className="font-extrabold">· {formatPrice(totalPrice)}</span>
              <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          ) : (
            'Seleccioná al menos 1 entrada'
          )}
        </button>
      </div>
    </div>
  );
}
