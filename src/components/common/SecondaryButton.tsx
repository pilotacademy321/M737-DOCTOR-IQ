import React from 'react';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'outline' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  icon,
  variant = 'outline',
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

  const variantClasses = {
    outline: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs hover:border-slate-400',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 border border-transparent',
    gold: 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 shadow-xs',
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg whitespace-nowrap shrink-0 transition-all duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};
