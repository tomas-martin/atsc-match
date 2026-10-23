'use client';

import Image from 'next/image';
import { getRivalShieldPath } from '@/lib/rival-shields';

interface RivalShieldProps {
  rivalName: string;
  /** Width in px – height is auto based on image aspect ratio */
  size?: number;
  className?: string;
}

/**
 * Displays the rival team's crest from /public/equipos/.
 * Falls back to a styled initial letter if no crest image is found.
 */
export default function RivalShield({
  rivalName,
  size = 48,
  className = '',
}: RivalShieldProps) {
  const shieldPath = getRivalShieldPath(rivalName);

  if (!shieldPath) {
    // Fallback: show the first letter in a styled container
    return (
      <div
        className={`relative inline-flex items-center justify-center flex-shrink-0 select-none rounded-xl bg-gradient-to-b from-[var(--bg-surface-elevated)] to-[var(--bg-surface)] border-2 border-[var(--border-subtle)] shadow-sm ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <span
          className="font-black text-[var(--text-secondary)]"
          style={{ fontSize: `${Math.round(size * 0.45)}px` }}
        >
          {rivalName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <Image
        src={shieldPath}
        alt={`Escudo de ${rivalName}`}
        width={size}
        height={size}
        className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
}
