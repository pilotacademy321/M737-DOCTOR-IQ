import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title,
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`rounded-lg p-3.5 bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 text-xs leading-relaxed ${className}`}
    >
      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <p className="font-semibold text-red-950 mb-0.5">{title}</p>}
        <p>{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          type="button"
          aria-label="Dismiss error"
          className="text-red-600 hover:text-red-800 p-0.5 cursor-pointer rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
