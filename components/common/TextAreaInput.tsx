
import React from 'react';

interface TextAreaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextAreaInput: React.FC<TextAreaInputProps> = ({ label, id, ...props }) => {
  return (
    <div className="w-full group">
      {label && <label htmlFor={id} className="block text-sm font-bold text-neu-text-dark mb-2">{label}</label>}
      <div className="relative">
          <textarea
            id={id}
            {...props}
            className={`
                block w-full neu-pressed text-neu-text-dark 
                p-4 focus:ring-0 focus:outline-none
                sm:text-sm min-h-[120px] placeholder-neu-text transition-all 
                custom-scrollbar resize-none
                ${props.className}
            `}
          />
      </div>
    </div>
  );
};
