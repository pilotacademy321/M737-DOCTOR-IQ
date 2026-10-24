import React from 'react';
import { MessageCircle } from 'lucide-react';
import { BRAND_CONFIG, getWhatsAppSupportUrl } from '../../config/brand';
import { useLanguage } from '../../localization/LanguageContext';

interface WhatsAppSupportButtonProps {
  customMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  showNumber?: boolean;
}

export const WhatsAppSupportButton: React.FC<WhatsAppSupportButtonProps> = ({
  customMessage,
  size = 'md',
  fullWidth = false,
  className = '',
  showNumber = false,
}) => {
  const { language, t } = useLanguage();
  const url = getWhatsAppSupportUrl(customMessage);

  const sizeClasses = {
    sm: 'text-xs py-2 px-3.5 min-h-[38px] gap-1.5',
    md: 'text-sm py-2.5 px-4 min-h-[44px] gap-2',
    lg: 'text-base py-3 px-5 min-h-[48px] gap-2.5',
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center font-medium rounded-lg whitespace-nowrap shrink-0 transition-all duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 shadow-xs bg-[#25D366] hover:bg-[#20ba59] text-white border border-[#20ba59] ${
        sizeClasses[size]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      aria-label={`${t.whatsappSupport}: ${BRAND_CONFIG.support.whatsappInternational}`}
    >
      <MessageCircle className="w-4 h-4 shrink-0 fill-current" />
      <span className="truncate">
        {t.whatsappButtonText}
        {showNumber && (
          <span className="opacity-90 font-mono text-xs ml-1 mr-1">
            ({language === 'ar' ? BRAND_CONFIG.support.whatsappNumber : BRAND_CONFIG.support.whatsappInternational})
          </span>
        )}
      </span>
    </a>
  );
};
