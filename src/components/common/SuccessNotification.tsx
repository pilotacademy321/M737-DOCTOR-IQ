import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessNotificationProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

export const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  message,
  title,
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      role="status"
      className={`rounded-lg p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 text-xs leading-relaxed ${className}`}
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <p className="font-semibold text-emerald-950 mb-0.5">{title}</p>}
        <p>{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          type="button"
          aria-label="Dismiss notification"
          className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
