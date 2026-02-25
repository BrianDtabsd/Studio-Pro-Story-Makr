
import React, { useState, useCallback, useEffect } from 'react';
import { generateImageForPrompt } from '../../services/geminiService.ts';
import { ActionButton } from '../common/ActionButton.tsx';
import { TextAreaInput } from '../common/TextAreaInput.tsx';
import { SectionCard } from '../SectionCard.tsx';
import { LoadingSpinner } from '../LoadingSpinner.tsx';
import { ErrorDisplay } from '../ErrorDisplay.tsx';
import { DownloadButton } from '../common/DownloadButton.tsx';
import { THUMBNAIL_MAKER_PLACEHOLDER } from '../../constants.ts';
import { GeneratedImage, StoryIdea, VIDEO_GENRES } from '../../types.ts';

interface Template { label: string; prompt: string; color: string; }

const THUMBNAIL_TEMPLATES: Template[] = [
  { label: 'TECH PULSE', color: 'text-blue-400', prompt: 'Modern clean tech background, split screen gadget comparison, WHITES vs BLACKS, intense neon lighting, 8k.' },
  { label: 'MYSTERY Noir', color: 'text-purple-400', prompt: 'Moody dramatic silhouette, volumetric fog, high contrast shadows, noir graphic novel style, mysterious vibes.' },
  { label: 'CYBER ACTION', color: 'text-xray-neon', prompt: 'Neon futuristic battlefield, speed lines, holographic UI elements overlaying a surprised character face.' },
  { label: 'VIRAL HOOK', color: 'text-xray-accent', prompt: 'Extreme facial expression, bright saturated colors, bold blocky text background, red arrow pointing to hidden detail.' },
];

export const ThumbnailMaker: React.FC<{
  initialPrompt: string;
  onPromptChange: (prompt: string) => void;
  initialThumbnail: GeneratedImage | null;
  onThumbnailChange: (thumbnail: GeneratedImage | null) => void;
  storyIdeaForTitle?: StoryIdea | null; 
}> = ({ initialPrompt, onPromptChange, initialThumbnail, onThumbnailChange, storyIdeaForTitle }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storyIdeaForTitle?.title && !initialPrompt) {
      let charContext = "";
      if (storyIdeaForTitle.proSettingsUsed?.characters?.length) {
          charContext = "Featuring characters: " + storyIdeaForTitle.proSettingsUsed.characters.map(c => `${c.name} (${c.physicalDescription})`).join(", ") + ". ";
      }
      onPromptChange(`${charContext}High-click-rate thumbnail for "${storyIdeaForTitle.title.toUpperCase()}". Vibrant futuristic aesthetic, cinematic lighting, dramatic composition, Rule of Thirds, professional color grade.`);
    }
  }, [storyIdeaForTitle, initialPrompt]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialPrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const fullPrompt = `${initialPrompt}. YouTube thumbnail 16:9, centered focal point, professional color grading, high contrast, visually striking.`;
      const imageUrl = await generateImageForPrompt(fullPrompt);
      onThumbnailChange({ id: `thumb-${Date.now()}`, src: imageUrl, prompt: initialPrompt });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thumbnail design failed.');
    } finally {
      setLoading(false);
    }
  }, [initialPrompt, onThumbnailChange]);

  return (
    <SectionCard title="Front-End Hook Generator">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-10">
            <div>
                <label className="block text-sm font-bold text-neu-text-dark mb-4">Click-Through Templates</label>
                <div className="grid grid-cols-2 gap-3">
                    {THUMBNAIL_TEMPLATES.map(t => (
                        <button key={t.label} type="button" onClick={() => onPromptChange(`${t.prompt} Topic: ${storyIdeaForTitle?.title || ""}`)}
                                className="p-4 neu-flat rounded-xl text-left hover:scale-[1.02] transition-all group">
                            <span className={`text-xs font-bold uppercase ${t.color}`}>{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <TextAreaInput label="Aesthetic Specs" value={initialPrompt} onChange={(e) => onPromptChange(e.target.value)} rows={4} />
                <ActionButton type="submit" isLoading={loading} className="w-full py-5 text-sm">SYNTHESIZE COVER ASSET</ActionButton>
            </form>
            {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
        </div>

        <div className="space-y-6">
            <h4 className="text-sm font-bold text-neu-text-dark uppercase mb-4">Final Master</h4>
            <div className="aspect-video neu-pressed rounded-3xl overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-neu-base/80 z-20 flex flex-col items-center justify-center p-10 text-center">
                        <LoadingSpinner size="sm" />
                        <p className="mt-4 text-xs font-bold text-accent-orange uppercase animate-pulse">Designing High-CTR Visual...</p>
                    </div>
                )}
                {initialThumbnail ? (
                    <div className="group relative w-full h-full">
                        <img src={initialThumbnail.src} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-neu-base/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                            <DownloadButton fileUrl={initialThumbnail.src} fileName="thumbnail_master.jpg" buttonText="SAVE MASTER" className="neu-btn text-accent-orange font-bold" />
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neu-text p-8 text-center">
                        <svg className="w-12 h-12 mb-4 opacity-40" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                        <p className="text-xs font-bold uppercase opacity-60">Ready for Master Generation</p>
                    </div>
                )}
            </div>
            <div className="p-4 neu-flat rounded-2xl flex items-center gap-4">
                <div className="w-8 h-8 rounded-full neu-pressed flex items-center justify-center text-accent-orange font-bold">?</div>
                <p className="text-xs text-neu-text font-medium leading-relaxed">Tip: For maximum engagement, ensure characters have wide eyes and high emotional contrast. Character context from your Pro setup is automatically linked.</p>
            </div>
        </div>
      </div>
    </SectionCard>
  );
};
