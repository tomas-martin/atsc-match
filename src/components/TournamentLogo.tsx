'use client';

import Image from 'next/image';
import { getTournamentLogoPath } from '@/lib/rival-shields';

interface TournamentLogoProps {
  competitionName: string;
  size?: number;
  className?: string;
}

/**
 * Displays the tournament / competition logo from /public/torneos/.
 * Falls back to a styled icon if no logo is found.
 */
export default function TournamentLogo({
  competitionName,
  size = 20,
  className = '',
}: TournamentLogoProps) {
  const logoPath = getTournamentLogoPath(competitionName);

  if (!logoPath) {
    return null;
  }

  return (
    <Image
      src={logoPath}
      alt={`Logo ${competitionName}`}
      width={size}
      height={size}
      className={`object-contain flex-shrink-0 ${className}`}
    />
  );
}
