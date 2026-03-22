
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
  const [editorOpenForId, setEditorOpenForId] = useState<string | null>(null);
  const [editorDrafts, setEditorDrafts] = useState<Record<string, string>>({});

  const orderedEpisodes = [...selectedEpisodes].sort(
    (a, b) => (a.episodeNumber ?? Number.MAX_SAFE_INTEGER) - (b.episodeNumber ?? Number.MAX_SAFE_INTEGER)
  );

  const activeStory =
    orderedEpisodes.find((e) => e.id === activeEpisodeId) ||
    orderedEpisodes[0] ||
    story;
  const currentOutline = activeStory ? (outlines[activeStory.id] || '') : '';
  const currentScript = activeStory ? (scripts[activeStory.id] || '') : '';
  const activeStoryId = activeStory?.id || '';
  const activeDuration = resolveDurationWindow(activeStory);
  const firstPendingEpisode = orderedEpisodes.find((episode) => !scripts[episode.id]?.trim());
  const activeDraft = activeStory ? (editorDrafts[activeStory.id] ?? '') : '';

  useEffect(() => {
    setActiveEpisodeId((prev) => {
      if (orderedEpisodes.length > 0) {
        if (prev && orderedEpisodes.some((episode) => episode.id === prev)) return prev;
        return orderedEpisodes[0].id;
      }
      return story?.id || null;
    });
  }, [orderedEpisodes, story?.id]);

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

  const handleSendToEditor = () => {
    if (!activeStory || !currentScript.trim()) return;
    setEditorDrafts((prev) => ({ ...prev, [activeStory.id]: currentScript }));
    setEditorOpenForId(activeStory.id);
  };

  const handleAcceptEdit = () => {
    if (!activeStory) return;
    const draft = (editorDrafts[activeStory.id] || '').trim();
    if (!draft) {
      setError('Edited script cannot be empty.');
      return;
    }
    onScriptsChange({ ...scripts, [activeStory.id]: editorDrafts[activeStory.id] });
    setEditorOpenForId(null);
  };

  const handleCancelEdit = () => {
    setEditorOpenForId(null);
  };

  if (!story) return <SectionCard title="Script Architect"><p className="text-neu-text italic">Matrix empty. Select a narrative node first.</p></SectionCard>;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3 space-y-4">
        <SectionCard title="Selected Story Context">
          <div className="space-y-4">
            <div className="neu-pressed p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-accent-orange uppercase tracking-widest mb-2">
                {activeStory?.episodeNumber ? `Episode ${activeStory.episodeNumber}` : 'Active Story'}
              </p>
              <h3 className="text-sm font-black text-neu-text-dark uppercase">{activeStory?.title}</h3>
              <p className="text-xs text-neu-text mt-2 leading-relaxed">{activeStory?.description}</p>
            </div>
            <div className="neu-pressed p-4 rounded-2xl">
              <h4 className="text-[10px] font-black text-neu-text-dark uppercase tracking-widest mb-2">
                Script Contract Snapshot
              </h4>
              <ul className="space-y-1 text-[11px] text-neu-text">
                <li>Runtime target: {activeDuration.min}-{activeDuration.max} minutes</li>
                <li>Narrator + dialogue + SFX cues required</li>
                <li>Stage directions + visual beat prompts required</li>
              </ul>
            </div>
            <div className="neu-pressed p-4 rounded-2xl">
              <h4 className="text-[10px] font-black text-neu-text-dark uppercase tracking-widest mb-2">
                Completion Criteria
              </h4>
              <ul className="space-y-1 text-[11px] text-neu-text">
                <li>{currentOutline.trim() ? '✓' : '○'} Outline is drafted</li>
                <li>{currentScript.trim() ? '✓' : '○'} Script is generated</li>
                <li>{activeDraft.trim() ? '✓' : '○'} Edited draft prepared (optional)</li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </aside>

      <section className="lg:col-span-6">
        <SectionCard title="Outline & Script Workspace">
          <div className="flex items-center gap-2 mb-6 px-1">
            <ScriptIcon />
            <span className="text-xs font-black text-neu-text-dark uppercase tracking-widest">
              Active Workspace
            </span>
          </div>

          <form onSubmit={handleGenerateFullScript} className="space-y-8">
            <TextAreaInput
              label="Structural Outline (Editable)"
              value={currentOutline}
              onChange={(e) => onOutlinesChange({ ...outlines, [activeStory!.id]: e.target.value })}
              rows={12}
              className="font-mono text-xs"
              placeholder="The AI will expand this into a full script..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div>
                <label htmlFor="script-type-select" className="block text-sm font-bold text-neu-text-dark mb-3">
                  Narrative Style
                </label>
                <select
                  id="script-type-select"
                  aria-label="Narrative Style"
                  value={initialScriptType}
                  onChange={(e) => onScriptTypeChange(e.target.value as ScriptType)}
                  className="w-full neu-pressed text-neu-text-dark rounded-xl p-4 text-sm focus:outline-none focus:ring-0"
                >
                  <option value={ScriptType.SingleVoice}>One Person Talking</option>
                  <option value={ScriptType.TwoVoice}>Two Person Dialogue</option>
                  <option value={ScriptType.MultiVoice}>Full Cinematic Cast</option>
                </select>
              </div>
              <ActionButton type="submit" isLoading={loading} className="py-5 h-[56px]">
                {currentScript ? 'RE-SYNTHESIZE SCRIPT' : 'SYNTHESIZE SCRIPT'}
              </ActionButton>
            </div>
          </form>

          {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
          {loading && !currentScript && <LoadingSpinner text="Splicing narrative threads..." />}

          {currentScript && (
            <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-neu-text-dark uppercase">Final Synthetic Script</h3>
                <CopyButton textToCopy={currentScript} className="neu-btn" />
              </div>
              <div className="neu-pressed p-6 rounded-3xl relative overflow-hidden">
                <pre className="text-neu-text-dark whitespace-pre-wrap break-words font-mono text-sm leading-relaxed max-h-[520px] overflow-y-auto custom-scrollbar relative z-10">
                  {currentScript}
                </pre>
              </div>

              <div className="flex flex-wrap gap-3">
                <ActionButton type="button" onClick={handleSendToEditor} className="px-5 py-3 text-xs">
                  Send to Editor
                </ActionButton>
                <ActionButton type="button" onClick={onNavigateToNextStep} className="px-5 py-3 text-xs bg-accent-orange text-white">
                  Proceed to Voice Engine
                </ActionButton>
              </div>
            </div>
          )}

          {editorOpenForId === activeStory?.id && (
            <div className="mt-6 neu-pressed p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-neu-text-dark uppercase tracking-widest">
                Script Editor
              </h4>
              <textarea
                value={activeDraft}
                onChange={(e) =>
                  setEditorDrafts((prev) => ({ ...prev, [activeStoryId]: e.target.value }))
                }
                rows={12}
                className="w-full neu-flat rounded-xl p-4 text-sm font-mono text-neu-text-dark focus:outline-none resize-y"
              />
              <div className="flex gap-3">
                <ActionButton type="button" onClick={handleAcceptEdit} className="px-4 py-2 text-xs">
                  Accept Edit
                </ActionButton>
                <button type="button" onClick={handleCancelEdit} className="neu-btn px-4 py-2 text-xs font-bold uppercase text-neu-text">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </section>

      <aside className="lg:col-span-3">
        <SectionCard title="Ordered Episodes">
          {orderedEpisodes.length > 0 ? (
            <div className="space-y-3">
              {orderedEpisodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() => setActiveEpisodeId(episode.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    activeEpisodeId === episode.id
                      ? 'neu-pressed border-l-4 border-accent-orange'
                      : 'neu-flat hover:scale-[1.02]'
                  }`}
                >
                  <p className="text-[9px] font-black text-accent-orange uppercase tracking-widest mb-1">
                    {episode.episodeNumber ? `Episode ${episode.episodeNumber}` : 'Episode'}
                  </p>
                  <h4 className="text-xs font-bold text-neu-text-dark line-clamp-1">{episode.title}</h4>
                  <p className="text-[10px] text-neu-text mt-1 uppercase font-bold">
                    {scripts[episode.id] ? 'Script Ready' : 'Pending Script'}
                  </p>
                </button>
              ))}

              <div className="pt-2 flex flex-col gap-2">
                {firstPendingEpisode && (
                  <button
                    type="button"
                    onClick={() => setActiveEpisodeId(firstPendingEpisode.id)}
                    className="neu-btn w-full py-2 text-[10px] font-black uppercase tracking-widest text-neu-text-dark"
                  >
                    Return to Next Pending
                  </button>
                )}
                {orderedEpisodes.length > 1 && (
                  <button
                    type="button"
                    onClick={handleBatchGenerate}
                    disabled={loading}
                    className="neu-btn w-full py-3 text-xs font-bold uppercase text-accent-orange"
                  >
                    Batch Generate All
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="neu-pressed p-4 rounded-2xl">
              <p className="text-xs text-neu-text">
                Single-story mode active. The current story stays selected until you return to Settings.
              </p>
            </div>
          )}
        </SectionCard>
      </aside>
    </div>
  );
};
