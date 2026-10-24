import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND_CONFIG } from '../../config/brand';
import { useLanguage } from '../../localization/LanguageContext';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
  clickable?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showSubtitle = true,
  clickable = true,
  className = '',
}) => {
  const { language } = useLanguage();

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-base font-bold',
    md: 'text-lg font-bold tracking-tight',
    lg: 'text-2xl font-extrabold tracking-tight',
    xl: 'text-3xl font-black tracking-tight',
  };

  const subSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  const isLight = variant === 'light';

  const logoMark = (
    <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
      {/* Refined geometric Iraqi emblem with gold-to-emerald gradient */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="m737GoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D061" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#AA771C" />
          </linearGradient>
          <linearGradient id="m737NavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B3A60" />
            <stop offset="100%" stopColor="#0A192F" />
          </linearGradient>
        </defs>

        {/* Outer Iraqi Star Geometric Octagon */}
        <polygon
          points="50,4 64,15 82,15 85,33 96,47 88,62 88,80 70,85 50,96 30,85 12,80 12,62 4,47 15,33 18,15 36,15"
          fill="url(#m737NavyGrad)"
          stroke="url(#m737GoldGrad)"
          strokeWidth="2.5"
        />

        {/* Inner Medical Caduceus / Cross Harmony with Gold Filigree */}
        <path
          d="M50 20 L50 80 M20 50 L80 50"
          stroke="url(#m737GoldGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Center Diamond Focal Point */}
        <rect
          x="42"
          y="42"
          width="16"
          height="16"
          transform="rotate(45 50 50)"
          fill="url(#m737GoldGrad)"
        />

        {/* Subtle Central Accent Node */}
        <circle cx="50" cy="50" r="3.5" fill="#0A192F" />
      </svg>
    </div>
  );

  const textContent = (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2">
        <span
          className={`${titleSizes[size]} ${
            isLight ? 'text-white' : 'text-slate-900'
          } font-sans leading-none`}
        >
          {BRAND_CONFIG.name}
        </span>
        <span
          className={`font-semibold ${
            isLight ? 'text-amber-300' : 'text-amber-700'
          } ${subSizes[size]} leading-none`}
        >
          {BRAND_CONFIG.arabicName}
        </span>
      </div>
      {showSubtitle && (
        <span
          className={`mt-1 font-normal ${
            isLight ? 'text-slate-300' : 'text-slate-500'
          } ${subSizes[size]} leading-tight`}
        >
          {language === 'ar' ? 'المنظومة الطبية الوطنية الموحدة' : BRAND_CONFIG.englishSubtitle}
        </span>
      )}
    </div>
  );

  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {logoMark}
      {textContent}
    </div>
  );

  if (clickable) {
    return (
      <Link to="/" className="inline-block group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-0.5">
        {content}
      </Link>
    );
  }

  return content;
};
