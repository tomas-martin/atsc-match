import Image from 'next/image';

interface ClubShieldProps {
  size?: number;
  className?: string;
  glow?: boolean;
  priority?: boolean;
}

/**
 * Andes Talleres Futsal Official Club Shield
 * Uses the uploaded official high-res PNG badge (/Talleres_Futsal.png)
 */
export default function ClubShield({
  size = 48,
  className = '',
  glow = false,
  priority = false,
}: ClubShieldProps) {
  // Height calculated proportionally (original resolution is 3609 x 4580, ratio 1.269)
  const width = size;
  const height = Math.round(size * 1.269);

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none group/shield ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Ambient glow behind shield */}
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-60 bg-gradient-to-br from-red-600/40 via-blue-700/40 to-blue-900/40 -z-10 group-hover/shield:opacity-90 transition-opacity"
          aria-hidden="true"
        />
      )}

      <Image
        src="/Talleres_Futsal.png"
        alt="Escudo de Andes Talleres Futsal"
        width={width}
        height={height}
        priority={priority || size >= 48}
        className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover/shield:scale-105"
      />
    </div>
  );
}
