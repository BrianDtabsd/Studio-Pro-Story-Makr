
import React from 'react';

interface DownloadButtonProps {
  fileUrl: string;
  fileName: string;
  buttonText?: string;
  disabled?: boolean;
  // FIX: Add className prop to allow custom styling
  className?: string; 
}

const DownloadIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

// FIX: Destructure and use the disabled and className props
export const DownloadButton: React.FC<DownloadButtonProps> = ({ fileUrl, fileName, buttonText = "Download", disabled, className }) => {
  const handleDownload = () => {
    if (disabled) return; // Prevent download if disabled
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !fileUrl}
      className={`neu-btn px-4 py-2 text-sm font-bold text-neu-text-dark disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
    >
      <DownloadIcon />
      {buttonText}
    </button>
  );
};