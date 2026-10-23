'use client';

import Link from 'next/link';
import type { MatchWithTicketTypes } from '@/lib/types';
import {
  formatDayNumber,
  formatMonthShort,
  formatWeekday,
  formatTime,
  formatPrice,
  isLowStock,
  getAvailable,
} from '@/lib/utils';
import ClubShield from './ClubShield';
import RivalShield from './RivalShield';
import TournamentLogo from './TournamentLogo';

interface MatchCardProps {
  match: MatchWithTicketTypes;
  featured?: boolean;
}

export default function MatchCard({ match, featured = false }: MatchCardProps) {
  const minPrice = match.ticket_types.length > 0
    ? Math.min(...match.ticket_types.map((t) => t.price))
    : 0;

  const totalAvailable = match.ticket_types.reduce(
    (sum, t) => sum + getAvailable(t.quota, t.sold, t.reserved),
    0
  );
  const totalQuota = match.ticket_types.reduce((sum, t) => sum + t.quota, 0);
  const lowStock = isLowStock(totalQuota, totalQuota - totalAvailable, 0);
  const soldOut = totalAvailable === 0;

  return (
    <Link
      href={`/partido/${match.id}`}
      className="block group"
      aria-label={`Comprar entradas para Andes Talleres vs ${match.rival}`}
    >
      <div
        className={`match-ticket ${
          featured ? 'match-ticket-featured' : ''
        }`}
      >
        {/* Ticket punch notches */}
        <div className="ticket-notch-left" aria-hidden="true" />
        <div className="ticket-notch-right" aria-hidden="true" />

        {/* Top bar with competition & stock status */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <span className="badge-competition">
              <TournamentLogo competitionName={match.competition} size={16} />
              {match.competition}
            </span>
          </div>

          {lowStock && !soldOut && (
            <span className="badge-last-tickets">
              🔥 Últimos lugares
            </span>
          )}

          {soldOut && (
            <span className="badge-competition !bg-gray-500/20 !text-gray-400">
              Agotado
            </span>
          )}
        </div>

        {/* Main body: Date Scoreboard + Teams */}
        <div className="px-6 py-4 flex items-center gap-4">
          {/* Date tile */}
          <div className="date-tile flex-shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
              {formatWeekday(match.date)}
            </span>
            <span className={`font-black tracking-tight leading-none my-0.5 ${featured ? 'text-3xl text-rose-500' : 'text-2xl'}`}>
              {formatDayNumber(match.date)}
            </span>
            <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">
              {formatMonthShort(match.date)}
            </span>
            <span className="text-[11px] font-bold text-blue-500 mt-1">
              {formatTime(match.date)} hs
            </span>
          </div>

          {/* Teams face-off */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {/* Talleres Shield */}
              <div className="flex items-center justify-center">
                <ClubShield size={featured ? 38 : 32} glow={featured} />
              </div>

              {/* VS separator */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-rose-500 px-1.5 py-0.5 rounded bg-rose-500/10">
                  VS
                </span>
              </div>

              {/* Rival info with crest */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <RivalShield rivalName={match.rival} size={featured ? 38 : 32} />
                <div className="min-w-0">
                  <h3
                    className={`font-black truncate tracking-tight text-[var(--text-primary)] group-hover:text-blue-500 transition-colors ${
                      featured ? 'text-lg sm:text-xl' : 'text-base'
                    }`}
                  >
                    {match.rival}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                    Visitante
                  </p>
                </div>
              </div>
            </div>

            {/* Venue & Location */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-3">
              <svg
                className="w-3.5 h-3.5 text-[var(--accent-red)] flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate font-medium">{match.venue}</span>
            </div>
          </div>
        </div>

        {/* Ticket bottom tear-off strip: Price & CTA */}
        {!soldOut ? (
          <div className="px-6 py-3.5 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-subtle)] flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-muted)] block">
                Entrada
              </span>
              <span className="font-black text-lg text-[var(--text-primary)]">
                {formatPrice(minPrice)}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-sm group-hover:shadow-md group-hover:from-rose-500 group-hover:to-rose-600 transition-all">
              <span>Comprar</span>
              <svg
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="px-6 py-3 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-subtle)] text-center text-xs font-bold text-[var(--text-muted)]">
            Entradas no disponibles
          </div>
        )}
      </div>
    </Link>
  );
}
