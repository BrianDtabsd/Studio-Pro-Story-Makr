
import React, { useState, useCallback, useEffect } from 'react';
import { generateScript } from '../../services/geminiService.ts'; 
import { ActionButton } from '../common/ActionButton.tsx';
import { TextAreaInput } from '../common/TextAreaInput.tsx';
import { SectionCard } from '../SectionCard.tsx';
import { LoadingSpinner } from '../LoadingSpinner.tsx';
import { ErrorDisplay } from '../ErrorDisplay.tsx';
import { CopyButton } from '../common/CopyButton.tsx';
import { StoryIdea, ScriptType } from '../../types.ts';
import {
  DEFAULT_SCRIPT_DURATION_MAX_MINUTES,
  DEFAULT_SCRIPT_DURATION_MINUTES,
  PRO_SCRIPT_DURATION_MAX_BOUND,
  PRO_SCRIPT_DURATION_MIN_BOUND,
} from '../../constants.ts';

interface ScriptWriterProps {
  story: StoryIdea | null; 
  selectedEpisodes: StoryIdea[];
  outlines: Record<string, string>;
  onOutlinesChange: (outlines: Record<string, string>) => void;
  scripts: Record<string, string>;
  onScriptsChange: (scripts: Record<string, string>) => void; 
  initialScriptType: ScriptType;
  onScriptTypeChange: (scriptType: ScriptType) => void;
  onNavigateToNextStep: () => void; 
}

const ScriptIcon = () => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const clampRuntimeMinutes = (value: number): number =>
  Math.max(PRO_SCRIPT_DURATION_MIN_BOUND, Math.min(PRO_SCRIPT_DURATION_MAX_BOUND, value));

const resolveDurationWindow = (story?: StoryIdea | null): { min: number; max: number } => {
  const settings = story?.proSettingsUsed;
  const safeMin = clampRuntimeMinutes(
    Number.isFinite(settings?.scriptDurationMinMinutes)
      ? Number(settings?.scriptDurationMinMinutes)
      : DEFAULT_SCRIPT_DURATION_MINUTES
  );
  const safeMax = clampRuntimeMinutes(
    Number.isFinite(settings?.scriptDurationMaxMinutes)
      ? Number(settings?.scriptDurationMaxMinutes)
      : DEFAULT_SCRIPT_DURATION_MAX_MINUTES
  );
  return { min: Math.min(safeMin, safeMax), max: Math.max(safeMin, safeMax) };
};

const buildContractDrivenOutline = (outline: string, scriptType: ScriptType, story?: StoryIdea | null): string => {
  const duration = resolveDurationWindow(story);
  const settings = story?.proSettingsUsed;
  const styleAnchors = [
    `content style: ${settings?.contentStyle || 'Drama'}`,
    `sub-genre: ${settings?.subGenre || 'general'}`,
    `production tone: ${settings?.productionProtocol || 'Cinematic'}`,
    `topic blend: ${settings?.topics?.length ? settings.topics.join(', ') : 'open'}`,
  ].join(' | ');

  return [
    'SCRIPT OUTPUT CONTRACT (required):',
    `- Runtime target: ${duration.min}-${duration.max} minutes.`,
    `- Script mode: ${scriptType}.`,
    '- Include narrator lines, dialogue exchanges, and explicit [SFX: ...] cues.',
    '- Include [Stage Direction: ...] and [Scene Direction: ...] blocks before each major beat.',
    '- Include [Visual Beat Prompt: ...] tied to each story milestone so scene generation is coherent.',
    '- Keep milestone continuity explicit: setup, escalation, climax, and resolution must be traceable.',
    '- Style blending is allowed and encouraged when coherent with the story brief.',
    `- Style anchors: ${styleAnchors}.`,
    '',
    'SOURCE OUTLINE:',
    outline.trim(),
  ].join('\n');
};

export const ScriptWriter: React.FC<ScriptWriterProps> = ({ 
  story, 
  selectedEpisodes,
  outlines, onOutlinesChange,
  scripts, onScriptsChange,
  initialScriptType, onScriptTypeChange,
  onNavigateToNextStep, 
}) => {
  const asUiError = (error: unknown, prefix: string): string => {
    if (error instanceof Error && error.message.trim().length > 0) {
      return `${prefix} ${error.message}`;
    }
    if (typeof error === 'string' && error.trim().length > 0) {
      return `${prefix} ${error}`;
    }
    try {
      const asJson = JSON.stringify(error);
      if (asJson && asJson !== '{}') return `${prefix} ${asJson}`;
    } catch {
      // ignore JSON serialization errors
    }
    return prefix;
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(selectedEpisodes[0]?.id || story?.id || null);

  const activeStory =
    selectedEpisodes.find((e) => e.id === activeEpisodeId) ||
    selectedEpisodes[0] ||
    story;
  const currentOutline = activeStory ? (outlines[activeStory.id] || '') : '';
  const currentScript = activeStory ? (scripts[activeStory.id] || '') : '';

  useEffect(() => {
    setActiveEpisodeId((prev) => {
      if (selectedEpisodes.length > 0) {
        if (prev && selectedEpisodes.some((episode) => episode.id === prev)) return prev;
        return selectedEpisodes[0].id;
      }
      return story?.id || null;
    });
  }, [selectedEpisodes, story?.id]);

  const handleGenerateFullScript = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStory) return;
    
    setLoading(true);
    setError(null);
    try {
      const scriptInput = buildContractDrivenOutline(currentOutline || activeStory.description, initialScriptType, activeStory);
      const script = await generateScript(scriptInput, initialScriptType, activeStory);
      onScriptsChange({ ...scripts, [activeStory.id]: script }); 
    } catch (err: unknown) {
      setError(asUiError(err, 'Script synthesis failed.'));
    } finally {
      setLoading(false);
    }
  }, [activeStory, currentOutline, initialScriptType, onScriptsChange, scripts]);

  const handleBatchGenerate = async () => {
    if (selectedEpisodes.length === 0) return;
    setLoading(true);
    setError(null);
    try {
        const newScripts = { ...scripts };
        for (const ep of selectedEpisodes) {
            const outline = outlines[ep.id] || ep.description;
            const scriptInput = buildContractDrivenOutline(outline, initialScriptType, ep);
            const script = await generateScript(scriptInput, initialScriptType, ep);
            newScripts[ep.id] = script;
        }
        onScriptsChange(newScripts);
    } catch (err: unknown) {
        setError(asUiError(err, 'Batch synthesis failed.'));
    } finally {
        setLoading(false);
    }
  };

  if (!story) return <SectionCard title="Script Architect"><p className="text-neu-text italic">Matrix empty. Select a narrative node first.</p></SectionCard>;
  
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
                  {scripts[ep.id] ? (
                    <span className="text-[9px] font-bold text-green-500 uppercase">Script Ready</span>
                  ) : (
                    <span className="text-[9px] font-bold text-neu-text uppercase">No Script</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {selectedEpisodes.length > 1 && (
            <button 
              onClick={handleBatchGenerate}
              disabled={loading}
              className="w-full neu-btn py-3 text-xs font-bold uppercase text-accent-orange mt-4"
            >
              Batch Generate All
            </button>
          )}
        </section>
      )}

      <section className={`${selectedEpisodes.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
        <SectionCard title="Script Architect">
          <div className="mb-10 p-6 neu-pressed rounded-2xl relative">
            <h3 className="text-xs font-bold text-accent-orange uppercase tracking-widest mb-3">
              {activeStory?.isSeriesConcept ? 'Series Concept' : `Episode ${activeStory?.episodeNumber || ''}`}
            </h3>
            <h4 className="text-xl font-black text-neu-text-dark uppercase mb-2">{activeStory?.title}</h4>
            <p className="text-sm text-neu-text leading-relaxed max-w-2xl">{activeStory?.description}</p>
          </div>

          <form onSubmit={handleGenerateFullScript} className="space-y-10">
            <TextAreaInput 
              label="Structural Outline (Editable)" 
              value={currentOutline} 
              onChange={(e) => onOutlinesChange({ ...outlines, [activeStory!.id]: e.target.value })} 
              rows={12} 
              className="font-mono text-xs" 
              placeholder="The AI will expand this into a full script..." 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div>
                <label htmlFor="script-type-select" className="block text-sm font-bold text-neu-text-dark mb-3">Narrative Style</label>
                <select id="script-type-select" aria-label="Narrative Style" value={initialScriptType} onChange={(e) => onScriptTypeChange(e.target.value as ScriptType)} className="w-full neu-pressed text-neu-text-dark rounded-xl p-4 text-sm focus:outline-none focus:ring-0">
                  <option value={ScriptType.SingleVoice}>One Person Talking</option>
                  <option value={ScriptType.TwoVoice}>Two Person Dialogue</option>
                  <option value={ScriptType.MultiVoice}>Full Cinematic Cast</option>
                </select>
              </div>
              <div className="flex gap-4">
                  <ActionButton type="submit" isLoading={loading} className="flex-1 py-5 h-[56px]">
                    {currentScript ? 'RE-SYNTHESIZE SCRIPT' : 'SYNTHESIZE SCRIPT'}
                  </ActionButton>
              </div>
            </div>
          </form>

          {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
          {loading && !currentScript && <LoadingSpinner text="Splicing narrative threads..." />}

          {currentScript && (
            <div className="mt-16 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-sm font-bold text-neu-text-dark uppercase">Final Synthetic Script</h3>
                <CopyButton textToCopy={currentScript} className="neu-btn" />
              </div>
              <div className="neu-pressed p-8 rounded-3xl relative overflow-hidden">
                <pre className="text-neu-text-dark whitespace-pre-wrap break-words font-mono text-sm leading-relaxed max-h-[600px] overflow-y-auto custom-scrollbar relative z-10">{currentScript}</pre>
              </div>
              <ActionButton onClick={onNavigateToNextStep} className="w-full mt-10 py-6 text-lg">PROCEED TO VOICE ENGINE</ActionButton>
            </div>
          )}
        </SectionCard>
      </section>
    </div>
  );
};
