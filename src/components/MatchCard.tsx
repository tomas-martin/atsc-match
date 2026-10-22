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

interface MatchCardProps {
  match: MatchWithTicketTypes;
  featured?: boolean;
}

export default function MatchCard({ match, featured = false }: MatchCardProps) {
  const minPrice = Math.min(...match.ticket_types.map((t) => t.price));
  const totalAvailable = match.ticket_types.reduce(
    (sum, t) => sum + getAvailable(t.quota, t.sold, t.reserved),
    0
  );
  const totalQuota = match.ticket_types.reduce((sum, t) => sum + t.quota, 0);
  const lowStock = isLowStock(totalQuota, totalQuota - totalAvailable, 0);
  const soldOut = totalAvailable === 0;

  return (
    <Link href={`/partido/${match.id}`} className="block">
      <div
        className={`match-card glass-card-hover p-0 ${
          featured ? 'match-card-featured' : ''
        } ${lowStock ? 'low-stock' : ''}`}
      >
        {/* Top badge row */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="badge-competition">{match.competition}</span>
          {lowStock && !soldOut && (
            <span className="badge-last-tickets">
              🔥 Últimas entradas
            </span>
          )}
          {soldOut && (
            <span className="badge-last-tickets" style={{ background: 'rgba(107,122,160,0.2)', color: '#6B7AA0' }}>
              Agotado
            </span>
          )}
        </div>

        {/* Main content */}
        <div className="flex items-center px-5 py-4 gap-4">
          {/* Date column - scoreboard style */}
          <div className="ticket-perforation pr-4 flex-shrink-0 text-center min-w-[60px]">
            <div className="text-[10px] font-bold text-gray-blue tracking-widest uppercase">
              {formatWeekday(match.date)}
            </div>
            <div className={`font-black leading-none ${featured ? 'text-4xl' : 'text-3xl'}`}>
              {formatDayNumber(match.date)}
            </div>
            <div className="text-xs font-bold text-gray-blue uppercase">
              {formatMonthShort(match.date)}
            </div>
            <div className="text-xs font-semibold text-blue-bright mt-1">
              {formatTime(match.date)}
            </div>
          </div>

          {/* Teams */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <ClubShield size={featured ? 40 : 32} />
              <span
                className={`font-black text-gray-blue ${
                  featured ? 'text-xl' : 'text-lg'
                }`}
              >
                VS
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-extrabold truncate ${
                    featured ? 'text-lg' : 'text-base'
                  }`}
                >
                  {match.rival}
                </div>
              </div>
            </div>

            {/* Venue */}
            <div className="text-xs text-gray-blue mt-2 flex items-center gap-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{match.venue}</span>
            </div>
          </div>
        </div>

        {/* Footer - Price */}
        {!soldOut && (
          <div className="px-5 pb-4 flex items-center justify-between border-t border-blue-shield/20 pt-3">
            <div>
              <span className="text-xs text-gray-blue">Desde</span>
              <span className="ml-2 font-extrabold text-lg">
                {formatPrice(minPrice)}
              </span>
            </div>
            <div className="btn-primary !w-auto !min-h-0 !py-2 !px-5 text-sm">
              Comprar
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
