
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SectionCard } from '../SectionCard.tsx';
import { ActionButton } from '../common/ActionButton.tsx';
import { DownloadButton } from '../common/DownloadButton.tsx';
import { CopyButton } from '../common/CopyButton.tsx';
import { ErrorDisplay } from '../ErrorDisplay.tsx';
// Added missing import for TextAreaInput
import { TextAreaInput } from '../common/TextAreaInput.tsx';
import { TitleCardData, StoryIdea } from '../../types.ts';

const NextStepIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.5 13.5h3.75m0 0a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
);


interface TitleCardGeneratorProps {
  titleCards: TitleCardData[];
  onTitleCardsChange: (updater: (prev: TitleCardData[]) => TitleCardData[] | TitleCardData[]) => void;
  storyIdeaForTitle?: StoryIdea | null; 
  onNavigateToNextStep: () => void;
}

const FONT_FAMILIES = [
  "Space Grotesk, sans-serif",
  "Arial Black, sans-serif",
  "Georgia, serif",
  "Courier New, monospace",
  "Impact, sans-serif"
];

const DEFAULT_COLORS = {
    background: '#05070a',
    text: '#00f2ff',
};

export const TitleCardGenerator: React.FC<TitleCardGeneratorProps> = ({
  titleCards,
  onTitleCardsChange,
  storyIdeaForTitle,
  onNavigateToNextStep,
}) => {
  const [titleText, setTitleText] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_COLORS.background);
  const [textColor, setTextColor] = useState(DEFAULT_COLORS.text);
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const CANVAS_WIDTH = 1920;
  const CANVAS_HEIGHT = 1080;

  useEffect(() => {
    if (storyIdeaForTitle?.title && !titleText) {
      setTitleText(storyIdeaForTitle.title.toUpperCase());
    }
  }, [storyIdeaForTitle, titleText]);

  const generatePreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // BG
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Decorative Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 100) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let j = 0; j < CANVAS_HEIGHT; j += 100) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(CANVAS_WIDTH, j); ctx.stroke();
    }

    // Title Text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let titleFontSize = 140;
    ctx.font = `900 ${titleFontSize}px ${fontFamily}`;
    
    while (ctx.measureText(titleText).width > CANVAS_WIDTH - 200 && titleFontSize > 40) {
        titleFontSize -= 5;
        ctx.font = `900 ${titleFontSize}px ${fontFamily}`;
    }
    const titleYPosition = subtitleText ? CANVAS_HEIGHT / 2 - titleFontSize / 3 : CANVAS_HEIGHT / 2;
    
    // Glow effect
    ctx.shadowBlur = 30;
    ctx.shadowColor = textColor;
    ctx.fillText(titleText, CANVAS_WIDTH / 2, titleYPosition);
    ctx.shadowBlur = 0;

    // Subtitle
    if (subtitleText) {
      let subtitleFontSize = 60;
      ctx.font = `300 ${subtitleFontSize}px ${fontFamily}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      while (ctx.measureText(subtitleText).width > CANVAS_WIDTH - 300 && subtitleFontSize > 20) {
          subtitleFontSize -= 3;
          ctx.font = `300 ${subtitleFontSize}px ${fontFamily}`;
      }
      ctx.fillText(subtitleText, CANVAS_WIDTH / 2, titleYPosition + titleFontSize * 0.9);
    }
    setPreviewUrl(canvas.toDataURL('image/png'));
  }, [titleText, subtitleText, backgroundColor, textColor, fontFamily]);

  useEffect(() => {
    if (titleText.trim()) { generatePreview(); } else { setPreviewUrl(null); }
  }, [generatePreview, titleText]);

  const handleAddTitleCard = () => {
    if (!titleText.trim() || !previewUrl) return;
    const newCard: TitleCardData = {
      id: `titlecard-${Date.now()}`,
      src: previewUrl,
      prompt: `Title: ${titleText}`,
      titleText,
      subtitleText,
      backgroundColor,
      textColor,
      fontFamily,
    };
    onTitleCardsChange(prev => [newCard, ...prev]);
    setTitleText('');
    setSubtitleText('');
    setPreviewUrl(null);
  };

  return (
    <SectionCard title="Typographic Synthesis">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <TextAreaInput
            label="Neural Display Text"
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            rows={2}
            className="text-2xl font-black uppercase tracking-tighter"
          />
          <TextAreaInput
            label="Subtitle Substrate"
            value={subtitleText}
            onChange={(e) => setSubtitleText(e.target.value)}
            rows={1}
            className="text-sm"
          />
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neu-text-dark uppercase tracking-widest mb-2">Backing Matrix</label>
              <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full h-12 neu-pressed rounded-xl cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-bold text-neu-text-dark uppercase tracking-widest mb-2">Glow Chromance</label>
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-12 neu-pressed rounded-xl cursor-pointer" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-neu-text-dark uppercase tracking-widest mb-2">Font Protocol</label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full neu-pressed rounded-xl p-4 text-sm focus:outline-none">
              {FONT_FAMILIES.map(font => <option key={font} value={font}>{font.split(',')[0]}</option>)}
            </select>
          </div>
          <ActionButton onClick={handleAddTitleCard} disabled={!titleText.trim() || !previewUrl} className="w-full">
            COMMIT TO COLLECTION
          </ActionButton>
        </div>

        <div className="space-y-4">
            <h4 className="text-xs font-bold text-neu-text-dark uppercase tracking-[0.4em] mb-4">Realtime Feed (16:9)</h4>
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="hidden"></canvas>
            <div className="aspect-video neu-pressed rounded-3xl overflow-hidden relative group">
                {previewUrl ? (
                    <img src={previewUrl} className="w-full h-full object-contain relative z-10" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neu-text font-black uppercase text-xs tracking-[0.5em]">Awaiting Ingest</div>
                )}
            </div>
        </div>
      </div>
      
      {titleCards.length > 0 && (
        <div className="mt-20 pt-10">
          <h3 className="text-sm font-bold text-neu-text-dark uppercase tracking-[0.4em] mb-8">Asset Repository</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {titleCards.map(card => (
              <div key={card.id} className="neu-flat p-4 rounded-3xl flex flex-col group relative">
                <div className="aspect-video rounded-2xl overflow-hidden neu-pressed mb-4">
                    <img src={card.src} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                    <p className="text-xs font-black text-accent-orange uppercase mb-1">{card.titleText}</p>
                    <p className="text-[10px] text-neu-text truncate">{card.subtitleText}</p>
                </div>
                <div className="mt-4 flex gap-2">
                    <DownloadButton fileUrl={card.src} fileName={`title_${card.id}.png`} buttonText="EXPORT" className="flex-1 neu-btn text-xs font-bold" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-12 pt-8 text-right">
        <ActionButton onClick={onNavigateToNextStep} Icon={NextStepIcon} className="">
            PROCEED TO FREEFORM
        </ActionButton>
      </div>
    </SectionCard>
  );
};
