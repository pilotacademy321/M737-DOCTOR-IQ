import React from 'react';
import { useLanguage } from '../../localization/LanguageContext';

interface LoadingIndicatorProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  label,
  size = 'md',
  fullScreen = false,
}) => {
  const { t } = useLanguage();

  const spinnerSizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-[2.5px]',
    lg: 'w-10 h-10 border-3',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${spinnerSizes[size]} rounded-full border-amber-600/20 border-t-amber-600 animate-spin`}
        role="status"
        aria-label="loading"
      />
      <span className="text-xs font-medium text-slate-600">
        {label || t.loading}
      </span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center py-12">
        {spinner}
      </div>
    );
  }

  return spinner;
};
