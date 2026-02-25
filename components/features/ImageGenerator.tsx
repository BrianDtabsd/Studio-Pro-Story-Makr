
import React, { useState, useCallback } from 'react';
import { generateImageForPrompt } from '../../services/geminiService';
import { ActionButton } from '../common/ActionButton';
import { TextAreaInput } from '../common/TextAreaInput';
import { SectionCard } from '../SectionCard';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorDisplay } from '../ErrorDisplay';
import { DownloadButton } from '../common/DownloadButton';
import { IMAGE_GENERATOR_PLACEHOLDER } from '../../constants'; // Placeholder for freeform images
import { GeneratedImage } from '../../types';

interface FreeformImageGeneratorProps { // Renamed props interface
  initialPrompt: string;
  onPromptChange: (prompt: string) => void;
  initialImages: GeneratedImage[];
  onImagesChange: (images: GeneratedImage[] | ((prevImages: GeneratedImage[]) => GeneratedImage[])) => void;
}

export const FreeformImageGenerator: React.FC<FreeformImageGeneratorProps> = ({ // Renamed component
  initialPrompt, onPromptChange,
  initialImages, onImagesChange
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
     if (!initialPrompt.trim()) {
      setError("Please enter a prompt for the image.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // For freeform images, we don't automatically append a global style here.
      // The user should include any desired style in the prompt itself.
      const imageUrl = await generateImageForPrompt(initialPrompt);
      const newImage: GeneratedImage = {
        id: `freeform-${Date.now().toString()}`, // Distinguish ID
        src: imageUrl,
        prompt: initialPrompt,
      };
      onImagesChange(prevImages => [newImage, ...prevImages]); 
      onPromptChange(''); 
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [initialPrompt, onImagesChange, onPromptChange]);

  return (
    <SectionCard title="6. Freeform Image Generator">
      <p className="text-sm text-gray-400 mb-4">
        Use this tool to generate any standalone images you might need, like B-roll visuals, concept art, or elements not directly tied to a script scene.
        For images directly based on your script scenes, use the "3. Scene Images" feature.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <TextAreaInput
          label="Image Prompt (Describe any image you want)"
          id="freeformImagePrompt"
          value={initialPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={IMAGE_GENERATOR_PLACEHOLDER}
          rows={3}
        />
        <ActionButton type="submit" isLoading={loading} loadingText="Generating Image...">
          Generate Freeform Image
        </ActionButton>
      </form>

      <ErrorDisplay message={error} onClear={() => setError(null)} />

      {loading && <LoadingSpinner text="Conjuring your freeform visual..." />}

      {initialImages.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-200 mb-4">Generated Freeform Images:</h3>
          <p className="text-sm text-gray-400 mb-4">Newest images appear at the top. Download any images you find useful.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialImages.map((image) => (
              <div key={image.id} className="bg-gray-700/50 p-4 rounded-lg shadow-md flex flex-col">
                <img 
                    src={image.src} 
                    alt={image.prompt} 
                    className="w-full h-48 object-cover rounded-md mb-4" 
                />
                <p className="text-xs text-gray-400 mb-3 flex-grow break-words">Prompt: {image.prompt}</p>
                <DownloadButton 
                    fileUrl={image.src} 
                    fileName={`freeform_image_${image.id}.jpg`}
                    buttonText="Download Image"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
};
