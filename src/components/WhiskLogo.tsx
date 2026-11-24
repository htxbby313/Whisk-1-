import * as React from 'react';

interface WhiskLogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Official Whisk Brand Emblem inspired by vibrant Colors from Around the World:
 * Santorini Azure & Aegean Cobalt oceans with Marrakech Terracotta, Jaipur Saffron,
 * Amazon/Bali Emerald, and Oaxaca Bougainvillea continents behind the crisp white "W"
 * and soaring commercial jet.
 */
export const WhiskLogo: React.FC<WhiskLogoProps> = ({
  size = 40,
  className = '',
  alt = 'Whisk logo',
}) => {
  const uid = React.useId().replace(/:/g, '');
  const clipId = `whisk-squircle-${uid}`;
  const shadowId = `whisk-shadow-${uid}`;
  const oceanId = `whisk-ocean-${uid}`;
  const americasId = `whisk-americas-${uid}`;
  const southAmericaId = `whisk-south-america-${uid}`;
  const arcticId = `whisk-arctic-${uid}`;
  const eurasiaId = `whisk-eurasia-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      role="img"
      aria-label={alt}
      className={`shrink-0 ${className}`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="12" y="12" width="488" height="488" rx="118" />
        </clipPath>
        <filter id={shadowId} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.28" />
        </filter>
        <linearGradient id={oceanId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0052D4" />
          <stop offset="42%" stopColor="#00B4FF" />
          <stop offset="76%" stopColor="#00D97E" />
          <stop offset="100%" stopColor="#FFC300" />
        </linearGradient>
        <linearGradient id={americasId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF1CF7" />
          <stop offset="48%" stopColor="#FF3B30" />
          <stop offset="100%" stopColor="#FFC300" />
        </linearGradient>
        <linearGradient id={southAmericaId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E676" />
          <stop offset="55%" stopColor="#00C86B" />
          <stop offset="100%" stopColor="#00B4FF" />
        </linearGradient>
        <linearGradient id={arcticId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF3B30" />
          <stop offset="55%" stopColor="#FFC300" />
          <stop offset="100%" stopColor="#FFE600" />
        </linearGradient>
        <linearGradient id={eurasiaId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00D97E" />
          <stop offset="36%" stopColor="#FF1CF7" />
          <stop offset="70%" stopColor="#FF3B30" />
          <stop offset="100%" stopColor="#FFC300" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* Santorini Azure & Caribbean Sea Ocean Backdrop */}
        <rect x="12" y="12" width="488" height="488" fill={`url(#${oceanId})`} />

        {/* World Map Continents in Vibrant Colors from Around the World */}
        <path
          d="M12 66 C48 54 102 38 148 52 C132 74 112 96 126 118 C142 134 166 138 158 164 C146 184 114 196 106 226 C116 244 134 252 146 270 C130 286 104 282 88 264 C66 248 44 226 12 216 Z"
          fill={`url(#${americasId})`}
        />
        <path
          d="M150 58 C180 38 224 42 248 60 C236 92 216 124 196 144 C172 136 154 114 146 86 Z"
          fill={`url(#${arcticId})`}
        />
        <path
          d="M126 292 C156 286 190 302 206 332 C198 370 176 410 156 446 C144 468 130 478 124 464 C122 434 130 398 118 366 C106 336 106 306 126 292 Z"
          fill={`url(#${southAmericaId})`}
        />
        <path
          d="M276 126 C306 102 344 80 398 70 C438 68 474 88 500 118 L500 322 C464 330 436 308 416 280 C406 296 392 312 372 308 C356 336 352 384 328 424 C308 426 294 402 292 376 C284 340 264 318 248 286 C234 252 246 206 274 184 C264 166 264 144 276 126 Z"
          fill={`url(#${eurasiaId})`}
        />

        {/* Bold White Geometric W + White Commercial Airplane */}
        <g filter={`url(#${shadowId})`}>
          <path
            d="M84 196 H150 L182 330 L220 196 H276 L314 330 L338 234 L386 268 L344 410 H280 L246 292 L212 410 H148 L84 196 Z"
            fill="#FFFFFF"
          />
          <g transform="translate(366 180) rotate(-42)">
            <path
              d="M86 0 C86 -9 76 -15 60 -15 L14 -15 L-20 -80 C-23 -85 -28 -87 -34 -85 L-45 -82 C-49 -80 -50 -75 -48 -70 L-26 -15 L-56 -15 L-75 -40 C-77 -43 -81 -44 -85 -42 L-91 -39 C-94 -37 -95 -33 -93 -29 L-78 0 L-93 29 C-95 33 -94 37 -91 39 L-85 42 C-81 44 -77 43 -75 40 L-56 15 L-26 15 L-48 70 C-50 75 -49 80 -45 82 L-34 85 C-28 87 -23 85 -20 80 L14 15 L60 15 C76 15 86 9 86 0 Z"
              fill="#FFFFFF"
            />
          </g>
        </g>
      </g>
    </svg>
  );
};
