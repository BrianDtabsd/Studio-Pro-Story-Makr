
import React, { useState, useEffect } from 'react';

export const InfoBar: React.FC = () => {
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    const currentGeminiKey = process.env.API_KEY;
    if (!currentGeminiKey || currentGeminiKey.includes("YOUR_API_KEY")) {
      setApiKeyMissing(true);
    }
  }, []);

  if (!apiKeyMissing) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] px-4 py-2 neu-flat flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Neural Link Offline: API_KEY Missing in environment</span>
        </div>
        <div className="text-[10px] font-bold text-neu-text uppercase tracking-widest hidden sm:block">
            Consult documentation for Neural Interface connection
        </div>
    </div>
  );
};
