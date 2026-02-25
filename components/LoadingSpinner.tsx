
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
  };

  return (
    <div className="flex flex-col items-center justify-center my-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-neu-base border-t-accent-orange rounded-full animate-spin shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff]`}></div>
      </div>
      {text && <p className="mt-5 text-xs font-bold text-accent-orange uppercase tracking-[0.3em]">{text}</p>}
    </div>
  );
};
