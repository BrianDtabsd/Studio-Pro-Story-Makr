
import React from 'react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  Icon?: React.ElementType;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  children, 
  isLoading = false, 
  loadingText = "Analyzing...", 
  Icon,
  className, 
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`
        neu-action-btn neu-btn px-12 py-4 text-lg font-bold text-neu-text-dark hover:scale-[1.01] transition-transform
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </div>
      ) : (
        <div className="relative flex items-center justify-center">
          {Icon && <Icon className="w-4 h-4 mr-3" />}
          {children}
        </div>
      )}
    </button>
  );
};
