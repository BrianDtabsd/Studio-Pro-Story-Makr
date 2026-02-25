
import React, { useState } from 'react';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
}

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a8.25 8.25 0 0 1-8.25 8.25H3.75a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 3.75 4.5h3.75M15.666 3.888V1.875a1.125 1.125 0 1 1 2.25 0v2.013M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m0 0A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-green-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);


export const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy text. Please try again or copy manually.');
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={!textToCopy}
      className={`neu-btn px-4 py-2 text-sm font-bold text-neu-text-dark disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};
