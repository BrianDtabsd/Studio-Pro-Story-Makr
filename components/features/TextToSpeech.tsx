
import React, { useState } from 'react';
import { SectionCard } from '../SectionCard.tsx';
import { ActionButton } from '../common/ActionButton.tsx';
import { ErrorDisplay } from '../ErrorDisplay.tsx';
import { LoadingSpinner } from '../LoadingSpinner.tsx';
import { analyzeScript, generateSpeech } from '../../services/geminiService.ts';
import { AIAnalyzedScript, CharacterVoicePreset, SynthesizedChunk, PresetVoiceKey, ScriptType, StoryIdea } from '../../types.ts';
import { PRESET_VOICES_CONFIG, PRESET_VOICE_KEYS_ORDERED } from '../../constants.ts';
import { DownloadButton } from '../common/DownloadButton.tsx';

interface Props {
  scriptText: string;
  defaultVoiceKey: PresetVoiceKey;
  onDefaultVoiceKeyChange: (key: PresetVoiceKey) => void;
  characterVoicePresets: Record<string, CharacterVoicePreset>;
  onCharacterVoicePresetsChange: (u: any) => void;
  onNavigateToSceneImageSetup: () => void;
  onLoadAudioQueue: (q: SynthesizedChunk[]) => void;
  scriptType?: ScriptType;
  analyzedScript: AIAnalyzedScript | null;
  onAnalyzedScriptChange: (s: AIAnalyzedScript | null) => void;
  storyIdea: StoryIdea | null;
}

export const TextToSpeech: React.FC<Props> = ({
  scriptText, defaultVoiceKey, onDefaultVoiceKeyChange, characterVoicePresets,
  onCharacterVoicePresetsChange, onNavigateToSceneImageSetup, onLoadAudioQueue, scriptType,
  analyzedScript, onAnalyzedScriptChange, storyIdea
}) => {
  const [loading, setLoading] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [chunks, setChunks] = useState<SynthesizedChunk[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isMultiVoice = scriptType === ScriptType.MultiVoice || scriptType === ScriptType.TwoVoice;

  const handleAnalyze = async () => {
    if (!scriptText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const chars = storyIdea?.proSettingsUsed?.characters || [];
      const result = await analyzeScript(scriptText, chars);
      onAnalyzedScriptChange(result);
      const presets = { ...characterVoicePresets };
      result.allCharacters.forEach(c => {
        if (!presets[c.toUpperCase()]) presets[c.toUpperCase()] = { assignedVoiceKey: null };
      });
      onCharacterVoicePresetsChange(presets);
    } catch (e: any) {
      setError("Script analysis failed. Check your script format.");
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesizeAll = async () => {
    if (!analyzedScript) return;
    setSynthesizing(true);
    setError(null);
    try {
      const newChunks: SynthesizedChunk[] = [];
      for (const scene of analyzedScript.scenes) {
        const audioUrl = await generateSpeech(scene.dialogue, characterVoicePresets, defaultVoiceKey);
        newChunks.push({ 
          id: `s-${scene.sceneNumber}-${Date.now()}`, 
          audioDataUrl: audioUrl, 
          sceneNumbers: [scene.sceneNumber], 
          downloadFilename: `scene_${scene.sceneNumber}.mp3` 
        });
      }
      setChunks(newChunks);
      onLoadAudioQueue(newChunks);
    } catch (e: any) {
      setError("Synthesis batch failed.");
    } finally {
      setSynthesizing(false);
    }
  };

  return (
    <SectionCard title="Voice Production">
      {!analyzedScript ? (
        <div className="py-20 flex flex-col items-center">
          <p className="text-neu-text text-sm mb-8 text-center max-w-sm">Analyze your generated script to prepare the voice recording sequence.</p>
          <ActionButton onClick={handleAnalyze} isLoading={loading}>Start Script Analysis</ActionButton>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="neu-pressed p-6 rounded-2xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="text-sm font-bold text-neu-text-dark mb-3 block">Main Narrator Voice</label>
                    <select className="w-full neu-pressed text-neu-text-dark p-4 rounded-xl text-sm focus:outline-none focus:ring-0" value={defaultVoiceKey} onChange={e => onDefaultVoiceKeyChange(e.target.value as PresetVoiceKey)}>
                        {PRESET_VOICE_KEYS_ORDERED.map(k => <option key={k} value={k}>{PRESET_VOICES_CONFIG[k].displayName}</option>)}
                    </select>
                </div>
                {isMultiVoice && (
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-neu-text-dark block">Character Overrides</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                            {analyzedScript.allCharacters.map(c => (
                                <div key={c} className="flex items-center justify-between p-3 neu-flat rounded-xl">
                                    <span className="text-xs font-bold text-neu-text-dark uppercase">{c}</span>
                                    <select className="bg-transparent text-xs outline-none text-neu-text" value={characterVoicePresets[c.toUpperCase()]?.assignedVoiceKey || 'INHERIT'}
                                        onChange={e => onCharacterVoicePresetsChange((prev: any) => ({ ...prev, [c.toUpperCase()]: { assignedVoiceKey: e.target.value === 'INHERIT' ? null : e.target.value } }))}>
                                        <option value="INHERIT">Default</option>
                                        {PRESET_VOICE_KEYS_ORDERED.map(k => <option key={k} value={k}>{PRESET_VOICES_CONFIG[k].displayName}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-sm font-bold text-neu-text-dark uppercase">Generated Audio Clips</h3>
                <ActionButton onClick={handleSynthesizeAll} isLoading={synthesizing} className="py-2 px-6 text-xs">SYNTHESIZE ALL AUDIO</ActionButton>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {analyzedScript.scenes.map(s => {
                const chunk = chunks.find(c => c.sceneNumbers.includes(s.sceneNumber));
                return (
                  <div key={s.sceneNumber} className="neu-flat p-4 rounded-xl flex items-center justify-between transition-all hover:scale-[1.01]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center neu-pressed rounded-lg text-xs font-black text-neu-text-dark">S{s.sceneNumber}</div>
                      <div>
                        <p className="text-sm text-neu-text-dark font-bold truncate max-w-[300px]">{s.description}</p>
                        <p className="text-xs text-neu-text uppercase font-bold mt-0.5">{s.charactersInScene.join(', ') || 'NARRATOR'}</p>
                      </div>
                    </div>
                    {chunk ? (
                        <div className="flex gap-2">
                             <audio src={chunk.audioDataUrl} className="hidden" id={`audio-${s.sceneNumber}`} />
                             <button onClick={() => (document.getElementById(`audio-${s.sceneNumber}`) as HTMLAudioElement)?.play()} className="neu-btn p-2 text-accent-orange font-bold">▶</button>
                             <DownloadButton fileUrl={chunk.audioDataUrl} fileName={chunk.downloadFilename} buttonText="MP3" className="neu-btn text-xs py-1 px-4" />
                        </div>
                    ) : (
                        <div className="text-xs text-neu-text font-bold uppercase">Pending...</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <ActionButton onClick={onNavigateToSceneImageSetup} className="w-full py-5 text-sm">Next Step: Visualize Scenes</ActionButton>
        </div>
      )}
      {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
    </SectionCard>
  );
};
