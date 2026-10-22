'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

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
        width: 180,
        margin: 2,
        color: { dark: '#0A1230', light: '#FFFFFF' },
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
    <div className="ticket-display shadow-xl">
      <div className="ticket-display-header">
        <div className="text-[10px] tracking-[0.2em] font-semibold opacity-70 mb-1">
          ANDES TALLERES FUTSAL
        </div>
        <div className="font-extrabold text-lg">vs {ticket.matchRival}</div>
        <div className="text-sm mt-1 opacity-90 capitalize">{dateStr} · {timeStr} hs</div>
        <div className="text-xs mt-1 opacity-70">{ticket.matchVenue}</div>
      </div>

      <div className="ticket-display-body">
        <div className="text-xs font-bold text-gray-dark uppercase tracking-widest">
          {ticket.typeName}
        </div>
        <div className="ticket-display-qr">
          <canvas
            ref={canvasRef}
            className={`transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
        <div className="ticket-display-code">{ticket.code}</div>
      </div>
    </div>
  );
}
