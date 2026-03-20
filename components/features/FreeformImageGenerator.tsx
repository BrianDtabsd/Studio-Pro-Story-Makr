
import React, { useState, useCallback } from 'react';
import { generateImageForPrompt } from '../../services/geminiService.ts';
import { ActionButton } from '../common/ActionButton.tsx';
import { TextAreaInput } from '../common/TextAreaInput.tsx';
import { SectionCard } from '../SectionCard.tsx';
import { LoadingSpinner } from '../LoadingSpinner.tsx';
import { ErrorDisplay } from '../ErrorDisplay.tsx';
import { DownloadButton } from '../common/DownloadButton.tsx';
import { IMAGE_GENERATOR_PLACEHOLDER } from '../../constants.ts';
import { GeneratedImage } from '../../types.ts';

interface FreeformImageGeneratorProps { 
  initialPrompt: string;
  onPromptChange: (prompt: string) => void;
  initialImages: GeneratedImage[];
  onImagesChange: (images: GeneratedImage[] | ((prevImages: GeneratedImage[]) => GeneratedImage[])) => void;
  onNavigateToNextStep: () => void;
}
const NextStepIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-3.75 2.063M21.75 12l-4.179-2.25m0 4.5l4.179-2.25m0 0L21.75 12m0-4.5l-4.179 2.25m0 0L12 16.5l-5.571-3.063" />
    </svg>
);

export const FreeformImageGenerator: React.FC<FreeformImageGeneratorProps> = ({ 
  initialPrompt, onPromptChange,
  initialImages, onImagesChange,
  onNavigateToNextStep
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialPrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const imageUrl = await generateImageForPrompt(initialPrompt);
      const newImage: GeneratedImage = {
        id: `freeform-${Date.now()}`, 
        src: imageUrl,
        prompt: initialPrompt,
      };
      onImagesChange(prevImages => [newImage, ...prevImages]); 
      onPromptChange(''); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neural synthesis failed.');
    } finally {
      setLoading(false);
    }
  }, [initialPrompt, onImagesChange, onPromptChange]);

  return (
    <SectionCard title="Neural Sandbox">
      <div className="max-w-3xl mx-auto space-y-12">
        <form onSubmit={handleSubmit} className="space-y-6">
            <TextAreaInput
                label="Direct Latent Prompting"
                value={initialPrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder={IMAGE_GENERATOR_PLACEHOLDER}
                rows={4}
                className="text-lg"
            />
            <ActionButton type="submit" isLoading={loading} loadingText="Splicing Pixels..." className="w-full py-5 text-sm">
                INJECT INTO LATENT SPACE
            </ActionButton>
        </form>

        {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
        {loading && <LoadingSpinner text="Consulting the Imagen matrix..." />}

        {initialImages.length > 0 && (
            <div className="space-y-8">
                <h3 className="text-sm font-bold text-neu-text-dark uppercase px-2 text-center">Output Buffer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {initialImages.map((image) => (
                    <div key={image.id} className="neu-flat p-5 rounded-3xl flex flex-col group relative animate-in fade-in zoom-in duration-500">
                        <div className="absolute top-4 right-4 z-20">
                            <div className="w-2 h-2 bg-accent-orange rounded-full animate-ping"></div>
                        </div>
                        <div className="aspect-video rounded-2xl overflow-hidden neu-pressed mb-6 relative group/img">
                            <img src={image.src} alt={image.prompt || 'Generated image'} title={image.prompt || 'Generated image'} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                            <div className="absolute inset-0 bg-neu-base/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <DownloadButton fileUrl={image.src} fileName={`gen_${image.id}.jpg`} buttonText="EXPORT" className="neu-btn text-accent-orange font-bold" />
                            </div>
                        </div>
                        <p className="text-xs text-neu-text font-mono italic leading-relaxed px-2">PROMPT: {image.prompt}</p>
                    </div>
                    ))}
                </div>
            </div>
        )}
        
        <div className="pt-10 flex justify-center">
            <ActionButton onClick={onNavigateToNextStep} Icon={NextStepIcon} className="px-16">
                ENGAGE THUMBNAIL PROTOCOL
            </ActionButton>
        </div>
      </div>
    </SectionCard>
  );
};
