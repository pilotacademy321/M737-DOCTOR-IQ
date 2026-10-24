import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  icon,
  isLoading = false,
  size = 'md',
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-xs py-2 px-3.5 min-h-[38px] gap-1.5',
    md: 'text-sm py-2.5 px-5 min-h-[44px] gap-2',
    lg: 'text-base py-3 px-6 min-h-[48px] gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium rounded-lg whitespace-nowrap shrink-0 transition-all duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500 cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 bg-[#0A192F] hover:bg-[#142E54] text-white border border-[#0A192F] ${
        sizeClasses[size]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
};
