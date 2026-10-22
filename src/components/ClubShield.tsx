/**
 * Andes Talleres Futsal Club Shield - SVG Component
 * Blue and red vertical stripes matching official branding
 */
export default function ClubShield({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      className={className}
      aria-label="Escudo de Andes Talleres Futsal"
    >
      {/* Shield shape */}
      <defs>
        <clipPath id="shield-clip">
          <path d="M50 2 L95 20 L95 70 Q95 95 50 118 Q5 95 5 70 L5 20 Z" />
        </clipPath>
        <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2B45A8" />
          <stop offset="100%" stopColor="#1C2E7A" />
        </linearGradient>
      </defs>

      {/* Shield background */}
      <g clipPath="url(#shield-clip)">
        {/* Base blue */}
        <rect x="0" y="0" width="100" height="120" fill="url(#shield-gradient)" />

        {/* Vertical stripes - Blue and Red alternating */}
        <rect x="5" y="0" width="15" height="120" fill="#1C2E7A" />
        <rect x="20" y="0" width="15" height="120" fill="#D01F2E" />
        <rect x="35" y="0" width="15" height="120" fill="#1C2E7A" />
        <rect x="50" y="0" width="15" height="120" fill="#D01F2E" />
        <rect x="65" y="0" width="15" height="120" fill="#1C2E7A" />
        <rect x="80" y="0" width="15" height="120" fill="#D01F2E" />

        {/* Center white circle for "AT" text */}
        <circle cx="50" cy="55" r="22" fill="rgba(255,255,255,0.95)" />
      </g>

      {/* Shield border */}
      <path
        d="M50 2 L95 20 L95 70 Q95 95 50 118 Q5 95 5 70 L5 20 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
      />

      {/* AT initials */}
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="Montserrat, sans-serif"
        fontWeight="900"
        fontSize="22"
        fill="#0A1230"
      >
        AT
      </text>

      {/* FUTSAL text */}
      <text
        x="50"
        y="75"
        textAnchor="middle"
        fontFamily="Montserrat, sans-serif"
        fontWeight="700"
        fontSize="7"
        fill="#0A1230"
        letterSpacing="2"
      >
        FUTSAL
      </text>
    </svg>
  );
}
