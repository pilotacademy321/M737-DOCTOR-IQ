import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'dark',
}) => {
  const { language, toggleLanguage } = useLanguage();

  const isLight = variant === 'light';

  return (
    <button
      onClick={toggleLanguage}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 whitespace-nowrap shrink-0 ${
        isLight
          ? 'text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20'
          : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200'
      } ${className}`}
      aria-label={language === 'ar' ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
};
