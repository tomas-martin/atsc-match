'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import ClubShield from './ClubShield';

interface TicketDisplayProps {
  ticket: {
    id: string;
    code: string;
    token: string;
    typeName: string;
    matchRival: string;
    matchDate: string;
    matchVenue: string;
  };
}

export default function TicketDisplay({ ticket }: TicketDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, ticket.token, {
        width: 190,
        margin: 2,
        color: { dark: '#070B19', light: '#FFFFFF' },
      }).then(() => setReady(true));
    }
  }, [ticket.token]);

  const date = new Date(ticket.matchDate);
  const dateStr = date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timeStr = date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="ticket-display relative overflow-hidden">
      {/* Header */}
      <div className="ticket-display-header relative">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ClubShield size={28} glow />
          <span className="text-[10px] tracking-[0.25em] font-extrabold text-white/80 uppercase">
            Andes Talleres Futsal
          </span>
        </div>

        <h3 className="font-black text-xl text-white">
          vs {ticket.matchRival}
        </h3>

        <div className="text-xs font-semibold mt-1 text-white/90 capitalize">
          {dateStr} · {timeStr} hs
        </div>
        <div className="text-[11px] mt-0.5 text-white/70 font-medium">
          📍 {ticket.matchVenue}
        </div>
      </div>

      {/* Ticket body */}
      <div className="ticket-display-body">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-extrabold uppercase tracking-wider">
          <span>Sector:</span>
          <span>{ticket.typeName}</span>
        </div>

        {/* QR Code Container */}
        <div className="ticket-display-qr shadow-sm">
          <canvas
            ref={canvasRef}
            className={`transition-opacity duration-300 ${
              ready ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* Alpha-numeric fallback code */}
        <div className="text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Código de Entrada
          </div>
          <div className="ticket-display-code">
            {ticket.code}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium text-center max-w-[220px]">
          Presentá este código en el acceso al polideportivo. Entrada válida por 1 ingreso.
        </div>
      </div>
    </div>
  );
}
