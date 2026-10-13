import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  isDarkMode?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 36, 
  className = '', 
  showText = false,
  isDarkMode = false
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div 
        style={{ width: size, height: size }}
        className="relative shrink-0 rounded-2xl overflow-hidden shadow-lg shadow-purple-500/25 transition-transform duration-200 hover:scale-105"
      >
        <svg 
          viewBox="0 0 512 512" 
          width="100%" 
          height="100%" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b0764"/>
              <stop offset="40%" stopColor="#6b21a8"/>
              <stop offset="75%" stopColor="#7c3aed"/>
              <stop offset="100%" stopColor="#9333ea"/>
            </linearGradient>

            <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b"/>
              <stop offset="50%" stopColor="#fbbf24"/>
              <stop offset="100%" stopColor="#fef08a"/>
            </linearGradient>

            <linearGradient id="logoNib" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc"/>
              <stop offset="50%" stopColor="#e2e8f0"/>
              <stop offset="100%" stopColor="#94a3b8"/>
            </linearGradient>

            <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.35"/>
            </filter>
          </defs>

          {/* Squircle Base */}
          <rect width="512" height="512" rx="128" fill="url(#logoBgGrad)"/>
          
          {/* Inner border */}
          <rect x="6" y="6" width="500" height="500" rx="122" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="4"/>

          {/* Background Decorative Circles */}
          <circle cx="256" cy="256" r="170" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="2" strokeDasharray="10 10"/>

          {/* Tamil Letter 'அ' */}
          <g filter="url(#logoShadow)">
            <text 
              x="220" 
              y="335" 
              fontFamily="'TAU-Paalai', 'Noto Sans Tamil', 'Latha', sans-serif" 
              fontSize="250" 
              fontWeight="900" 
              fill="#ffffff" 
              textAnchor="middle"
            >
              அ
            </text>
          </g>

          {/* Golden Stylus / Fountain Pen Nib */}
          <g transform="translate(260, 140) rotate(22)" filter="url(#logoShadow)">
            <path d="M 0,-30 L 26,-30 L 22,60 L 4,60 Z" fill="url(#logoBgGrad)" stroke="url(#logoGold)" strokeWidth="3"/>
            <rect x="-1" y="25" width="28" height="8" rx="2" fill="url(#logoGold)"/>
            <path d="M 3,60 L 23,60 L 25,82 L 1,82 Z" fill="url(#logoGold)"/>
            <path d="M 1,82 L 25,82 L 20,135 L 13,158 L 6,135 Z" fill="url(#nibGrad)" stroke="#cbd5e1" strokeWidth="2"/>
            <path d="M 6,94 L 20,94 L 17,125 L 13,142 L 9,125 Z" fill="url(#logoGold)" opacity="0.9"/>
            <circle cx="13" cy="118" r="3.5" fill="#1e1b4b"/>
            <line x1="13" y1="118" x2="13" y2="158" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="13" cy="160" r="3" fill="#ffffff"/>
          </g>

          {/* AI Sparkles */}
          <g fill="url(#logoGold)">
            <path d="M 390,105 Q 390,125 410,125 Q 390,125 390,145 Q 390,125 370,125 Q 390,125 390,105 Z"/>
            <path d="M 115,115 Q 115,127 127,127 Q 115,127 115,139 Q 115,127 103,127 Q 115,127 115,115 Z" opacity="0.85"/>
          </g>

          {/* Verification Checkmark Badge */}
          <g transform="translate(385, 385)">
            <circle cx="0" cy="0" r="50" fill="#10b981"/>
            <circle cx="0" cy="0" r="44" fill="#059669"/>
            <circle cx="0" cy="0" r="44" fill="none" stroke="#6ee7b7" strokeWidth="3" strokeOpacity="0.8"/>
            <path d="M -18,-2 L -6,12 L 20,-14" fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-base ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
              SpellTamil
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-600/10 text-purple-600 dark:text-purple-400">
              AI
            </span>
          </div>
          <span className="text-[11px] font-tamil opacity-60 leading-none">
            தமிழ் பிழை திருத்தி
          </span>
        </div>
      )}
    </div>
  );
};
