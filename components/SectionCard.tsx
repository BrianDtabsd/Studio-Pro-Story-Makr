
import React from 'react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`neu-flat p-8 mb-8 relative group transition-all duration-500 ${className}`}>
      <div className="flex items-center justify-between mb-8 border-b border-gray-300 pb-4">
        <h2 className="text-xl font-bold uppercase tracking-widest text-neu-text-dark">
            {title}
        </h2>
        <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neu-text/20"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-neu-text/40"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-neu-text/60"></div>
        </div>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
