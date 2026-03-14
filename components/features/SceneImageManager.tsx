
import React, { useState, useEffect } from 'react';
import { SceneImageDefinition, StoryIdea, AIAnalyzedScript } from '../../types.ts';
import { SectionCard } from '../SectionCard.tsx';
import { TextAreaInput } from '../common/TextAreaInput.tsx';
import { ActionButton } from '../common/ActionButton.tsx';
import { ErrorDisplay } from '../ErrorDisplay.tsx';
import { LoadingSpinner } from '../LoadingSpinner.tsx';
import { DownloadButton } from '../common/DownloadButton.tsx';
import { generateImageForPrompt, generateVideoForPrompt, analyzeScript } from '../../services/geminiService.ts';

interface Props {
  story: StoryIdea | null;
  selectedEpisodes: StoryIdea[];
  scripts: Record<string, string>;
  editableScripts: Record<string, string>;
  sceneImageDefinitions: Record<string, SceneImageDefinition[]>;
  onSceneImageDefinitionsChange: (defs: Record<string, SceneImageDefinition[]>) => void;
  globalImageStylePrompt: string;
  onGlobalImageStylePromptChange: (s: string) => void;
  onNavigateToNextStep: () => void;
  analyzedScripts: Record<string, AIAnalyzedScript | null>;
  onAnalyzedScriptsChange: (scripts: Record<string, AIAnalyzedScript | null>) => void;
}

export const SceneImageManager: React.FC<Props> = ({ 
  story, selectedEpisodes, scripts, editableScripts,
  sceneImageDefinitions, onSceneImageDefinitionsChange, 
  globalImageStylePrompt, onGlobalImageStylePromptChange, onNavigateToNextStep, 
  analyzedScripts, onAnalyzedScriptsChange 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(selectedEpisodes[0]?.id || story?.id || null);

  const activeStory =
    selectedEpisodes.find((e) => e.id === activeEpisodeId) ||
    selectedEpisodes[0] ||
    story;
  const currentScript = activeStory ? (editableScripts[activeStory.id] || scripts[activeStory.id] || '') : '';
  const currentAnalyzedScript = activeStory ? analyzedScripts[activeStory.id] : null;
  const currentDefs = activeStory ? (sceneImageDefinitions[activeStory.id] || []) : [];

  const IMAGE_TIMEOUT_MS = 150000;
  const VIDEO_TIMEOUT_MS = 420000;
  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    setActiveEpisodeId((prev) => {
      if (selectedEpisodes.length > 0) {
        if (prev && selectedEpisodes.some((episode) => episode.id === prev)) return prev;
        return selectedEpisodes[0].id;
      }
      return story?.id || null;
    });
  }, [selectedEpisodes, story?.id]);

  const handleAnalyze = async () => {
    if (!activeStory || !currentScript.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const chars = activeStory.proSettingsUsed?.characters || [];
      const res = await analyzeScript(currentScript, chars);
      onAnalyzedScriptsChange({ ...analyzedScripts, [activeStory.id]: res });
      
      const defs: SceneImageDefinition[] = res.scenes.map(s => ({
        sceneNumber: s.sceneNumber, 
        sceneContentExcerpt: s.description, 
        aiSuggestedPrompt: s.visualPrompt, 
        userEditedPrompt: s.visualPrompt,
        isImageGenerationEnabled: true, 
        isGenerating: false, 
        assetType: s.assetType || 'image'
      }));
      onSceneImageDefinitionsChange({ ...sceneImageDefinitions, [activeStory.id]: defs });
    } catch (e: any) { 
        setError("Script layout failed."); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleGenerate = async (sceneNum: number, type: 'image' | 'video') => {
    if (!activeStory) return;
    const def = currentDefs.find(d => d.sceneNumber === sceneNum);
    if (!def) return;

    const updateDef = (sceneId: number, updates: Partial<SceneImageDefinition>) => {
      const newDefs = currentDefs.map(d => d.sceneNumber === sceneId ? { ...d, ...updates } : d);
      onSceneImageDefinitionsChange({ ...sceneImageDefinitions, [activeStory.id]: newDefs });
    };

    updateDef(sceneNum, { isGenerating: true, generationError: undefined });
    try {
      if (type === 'image') {
        const url = await withTimeout(
          generateImageForPrompt(`${def.userEditedPrompt} ${globalImageStylePrompt}`, activeStory.proSettingsUsed?.realisticImages),
          IMAGE_TIMEOUT_MS,
          'Image generation timed out. Please retry or simplify the prompt.'
        );
        updateDef(sceneNum, { generatedImageUrl: url, isGenerating: false, generationError: undefined });
      } else {
        const url = await withTimeout(
          generateVideoForPrompt(def.userEditedPrompt, '1080p', def.generatedImageUrl),
          VIDEO_TIMEOUT_MS,
          'Video generation timed out. Please retry with a shorter, simpler motion prompt.'
        );
        updateDef(sceneNum, { generatedVideoUrl: url, isGenerating: false, generationError: undefined });
      }
    } catch (e: any) { 
      const message = e instanceof Error ? e.message : 'Generation failed. Please retry.';
      updateDef(sceneNum, { isGenerating: false, generationError: message });
    }
  };

  if (!story) return <SectionCard title="Visual Layout"><p className="text-neu-text italic">Matrix empty. Select a narrative node first.</p></SectionCard>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar for Episodes */}
      {selectedEpisodes.length > 0 && (
        <section className="lg:col-span-3 space-y-4">
          <h3 className="text-sm font-bold text-neu-text-dark uppercase px-2">Episodes</h3>
          <div className="space-y-3">
            {selectedEpisodes.map(ep => (
              <div 
                key={ep.id}
                onClick={() => setActiveEpisodeId(ep.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${activeEpisodeId === ep.id ? 'neu-pressed border-l-4 border-accent-orange' : 'neu-flat hover:scale-[1.02]'}`}
              >
                <h4 className="text-xs font-bold text-neu-text-dark line-clamp-1">{ep.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {sceneImageDefinitions[ep.id]?.length > 0 ? (
                    <span className="text-[9px] font-bold text-green-500 uppercase">{sceneImageDefinitions[ep.id].length} Scenes Ready</span>
                  ) : (
                    <span className="text-[9px] font-bold text-neu-text uppercase">No Visuals</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={`${selectedEpisodes.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
        <SectionCard title="Scene Production">
          {!currentAnalyzedScript ? (
            <div className="py-20 flex flex-col items-center">
              <p className="text-neu-text mb-8 text-center max-w-sm">Cross-reference the script for "{activeStory?.title}" with your character designs to create high-consistency image prompts.</p>
              <ActionButton onClick={handleAnalyze} isLoading={loading}>Prepare Scene Prompts</ActionButton>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-sm font-bold text-neu-text-dark uppercase">Visual Assets Registry</h3>
                <div className="flex items-center gap-4">
                    <input type="text" placeholder="Global Style (e.g. 8k photography)" value={globalImageStylePrompt} onChange={e => onGlobalImageStylePromptChange(e.target.value)} className="neu-pressed text-neu-text-dark text-xs p-2 rounded-lg w-48 focus:outline-none" />
                    <ActionButton onClick={onNavigateToNextStep} className="py-2 px-6 text-xs">Step 5: Final Export</ActionButton>
                </div>
              </div>
              
              <div className="space-y-12">
                {currentDefs.map(def => (
                  <div key={def.sceneNumber} className="neu-flat p-8 rounded-3xl flex flex-col md:flex-row gap-8 transition-all relative">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-3">
                        <span className="neu-pressed px-3 py-1 rounded text-xs font-bold text-neu-text-dark">SCENE {def.sceneNumber}</span>
                        <span className="text-xs font-bold text-accent-orange uppercase">{def.assetType} Production</span>
                      </div>
                      <p className="text-sm text-neu-text leading-relaxed italic border-l-2 border-gray-300 pl-4">"{def.sceneContentExcerpt}"</p>
                      <TextAreaInput label="Image Generation Prompt" value={def.userEditedPrompt} onChange={e => {
                        const newDefs = currentDefs.map(d => d.sceneNumber === def.sceneNumber ? { ...d, userEditedPrompt: e.target.value } : d);
                        onSceneImageDefinitionsChange({ ...sceneImageDefinitions, [activeStory.id]: newDefs });
                      }} rows={3} />
                      
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
            </>
          )}
        </SectionCard>
      </section>
      {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
    </div>
  );
};
