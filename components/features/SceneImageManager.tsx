
import React, { useState } from 'react';
import { SceneImageDefinition, StoryIdea, AIAnalyzedScript } from '../../types.ts';
import { SectionCard } from '../SectionCard.tsx';
import { TextAreaInput } from '../common/TextAreaInput.tsx';
import { ActionButton } from '../common/ActionButton.tsx';
import { ErrorDisplay } from '../ErrorDisplay.tsx';
import { LoadingSpinner } from '../LoadingSpinner.tsx';
import { DownloadButton } from '../common/DownloadButton.tsx';
import { generateImageForPrompt, generateVideoForPrompt, analyzeScript } from '../../services/geminiService.ts';

interface Props {
  scriptText: string; 
  sceneImageDefinitions: SceneImageDefinition[]; 
  onSceneImageDefinitionsChange: (u: any) => void;
  globalImageStylePrompt: string; 
  onGlobalImageStylePromptChange: (s: string) => void; 
  onNavigateToNextStep: () => void; 
  storyIdea?: StoryIdea | null;
  analyzedScript: AIAnalyzedScript | null;
  onAnalyzedScriptChange: (s: AIAnalyzedScript | null) => void;
}

export const SceneImageManager: React.FC<Props> = ({ 
  scriptText, sceneImageDefinitions, onSceneImageDefinitionsChange, 
  globalImageStylePrompt, onGlobalImageStylePromptChange, onNavigateToNextStep, 
  storyIdea, analyzedScript, onAnalyzedScriptChange 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const chars = storyIdea?.proSettingsUsed?.characters || [];
      const res = await analyzeScript(scriptText, chars);
      onAnalyzedScriptChange(res);
      const defs: SceneImageDefinition[] = res.scenes.map(s => ({
        sceneNumber: s.sceneNumber, 
        sceneContentExcerpt: s.description, 
        aiSuggestedPrompt: s.visualPrompt, 
        userEditedPrompt: s.visualPrompt,
        isImageGenerationEnabled: true, 
        isGenerating: false, 
        assetType: s.assetType || 'image'
      }));
      onSceneImageDefinitionsChange(defs);
    } catch (e: any) { 
        setError("Script layout failed."); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleGenerate = async (sceneNum: number, type: 'image' | 'video') => {
    const def = sceneImageDefinitions.find(d => d.sceneNumber === sceneNum);
    if (!def) return;
    onSceneImageDefinitionsChange((prev: any[]) => prev.map(d => d.sceneNumber === sceneNum ? { ...d, isGenerating: true } : d));
    try {
      if (type === 'image') {
        const url = await generateImageForPrompt(`${def.userEditedPrompt} ${globalImageStylePrompt}`, storyIdea?.proSettingsUsed?.realisticImages);
        onSceneImageDefinitionsChange((prev: any[]) => prev.map(d => d.sceneNumber === sceneNum ? { ...d, generatedImageUrl: url, isGenerating: false } : d));
      } else {
        const url = await generateVideoForPrompt(def.userEditedPrompt, '1080p', def.generatedImageUrl);
        onSceneImageDefinitionsChange((prev: any[]) => prev.map(d => d.sceneNumber === sceneNum ? { ...d, generatedVideoUrl: url, isGenerating: false } : d));
      }
    } catch (e: any) { 
      onSceneImageDefinitionsChange((prev: any[]) => prev.map(d => d.sceneNumber === sceneNum ? { ...d, isGenerating: false, generationError: e.message } : d));
    }
  };

  if (sceneImageDefinitions.length === 0) {
    return (
      <SectionCard title="Visual Layout">
        <div className="py-20 flex flex-col items-center">
          <p className="text-neu-text mb-8 text-center max-w-sm">Cross-reference your script with your character designs to create high-consistency image prompts.</p>
          <ActionButton onClick={handleAnalyze} isLoading={loading}>Prepare Scene Prompts</ActionButton>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Scene Production">
      <div className="flex justify-between items-center mb-12">
        <h3 className="text-sm font-bold text-neu-text-dark uppercase">Visual Assets Registry</h3>
        <div className="flex items-center gap-4">
            <input type="text" placeholder="Global Style (e.g. 8k photography)" value={globalImageStylePrompt} onChange={e => onGlobalImageStylePromptChange(e.target.value)} className="neu-pressed text-neu-text-dark text-xs p-2 rounded-lg w-48 focus:outline-none" />
            <ActionButton onClick={onNavigateToNextStep} className="py-2 px-6 text-xs">Step 5: Final Export</ActionButton>
        </div>
      </div>
      
      <div className="space-y-12">
        {sceneImageDefinitions.map(def => (
          <div key={def.sceneNumber} className="neu-flat p-8 rounded-3xl flex flex-col md:flex-row gap-8 transition-all relative">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <span className="neu-pressed px-3 py-1 rounded text-xs font-bold text-neu-text-dark">SCENE {def.sceneNumber}</span>
                <span className="text-xs font-bold text-accent-orange uppercase">{def.assetType} Production</span>
              </div>
              <p className="text-sm text-neu-text leading-relaxed italic border-l-2 border-gray-300 pl-4">"{def.sceneContentExcerpt}"</p>
              <TextAreaInput label="Image Generation Prompt" value={def.userEditedPrompt} onChange={e => onSceneImageDefinitionsChange((prev: any[]) => prev.map(d => d.sceneNumber === def.sceneNumber ? { ...d, userEditedPrompt: e.target.value } : d))} rows={3} />
              
              <div className="flex gap-3">
                <button onClick={() => handleGenerate(def.sceneNumber, 'image')} disabled={def.isGenerating} className="flex-1 py-4 neu-btn text-xs font-bold uppercase text-neu-text-dark">Draw Still Image</button>
                <button onClick={() => handleGenerate(def.sceneNumber, 'video')} disabled={def.isGenerating || !def.generatedImageUrl} className="flex-1 py-4 neu-btn text-xs font-bold uppercase text-accent-orange disabled:opacity-50">Animate Video</button>
              </div>
            </div>
            
            <div className="w-full md:w-[360px] aspect-video rounded-2xl neu-pressed overflow-hidden relative flex items-center justify-center group/preview">
              {def.isGenerating ? (
                <div className="absolute inset-0 bg-neu-base/80 flex flex-col items-center justify-center p-6 text-center">
                    <LoadingSpinner size="sm" />
                    <p className="text-xs font-bold text-accent-orange uppercase mt-2">Splicing Visual Substrate...</p>
                </div>
              ) : def.generatedVideoUrl ? (
                <video src={def.generatedVideoUrl} controls className="w-full h-full object-cover" />
              ) : def.generatedImageUrl ? (
                <img src={def.generatedImageUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-8 opacity-40 group-hover/preview:opacity-60 transition-opacity">
                    <svg className="w-12 h-12 mx-auto mb-4 text-neu-text" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span className="text-xs font-bold uppercase text-neu-text">Awaiting Generation</span>
                </div>
              )}
              
              {def.generatedImageUrl && !def.isGenerating && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                  <DownloadButton fileUrl={def.generatedImageUrl} fileName={`scene_${def.sceneNumber}_still.png`} buttonText="IMAGE" className="neu-btn text-xs py-1.5 px-3" />
                  {def.generatedVideoUrl && <DownloadButton fileUrl={def.generatedVideoUrl} fileName={`scene_${def.sceneNumber}_vid.mp4`} buttonText="VIDEO" className="neu-btn text-xs py-1.5 px-3" />}
                </div>
              )}
            </div>
            {def.generationError && <div className="absolute bottom-2 left-8 right-8 text-xs text-red-500 bg-red-100 p-1 rounded text-center">{def.generationError}</div>}
          </div>
        ))}
      </div>
    </SectionCard>
  );
};
