
import React from 'react';

interface ErrorDisplayProps {
  message: string | null;
  onClear?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClear }) => {
  if (!message) return null;

  return (
    <div className="neu-flat border-l-4 border-red-500 text-red-500 px-6 py-4 rounded-xl relative my-6 flex items-center justify-between" role="alert">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full neu-pressed text-red-500 flex items-center justify-center font-black">!</div>
        <div className="text-sm font-bold uppercase tracking-tight">
            <span className="opacity-60 block text-[10px] mb-0.5 tracking-widest text-neu-text">Protocol Exception</span>
            {message}
        </div>
      </div>
      {onClear && (
         <button 
            onClick={onClear} 
            className="p-2 text-red-500 hover:text-red-700 transition-colors"
        >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
        </button>
      )}
    </div>
  );
};
