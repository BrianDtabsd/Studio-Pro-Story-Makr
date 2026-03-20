
import React, { useState, useEffect, useRef } from 'react';
import { SectionCard } from '../SectionCard.tsx';
import { ActionButton } from '../common/ActionButton.tsx';
import { ErrorDisplay } from '../ErrorDisplay.tsx';
import { analyzeScript, generateSpeech } from '../../services/geminiService.ts';
import { AIAnalyzedScript, CharacterVoicePreset, SynthesizedChunk, PresetVoiceKey, ScriptType, StoryIdea } from '../../types.ts';
import { PRESET_VOICES_CONFIG, PRESET_VOICE_KEYS_ORDERED } from '../../constants.ts';
import { DownloadButton } from '../common/DownloadButton.tsx';

interface Props {
  story: StoryIdea | null;
  selectedEpisodes: StoryIdea[];
  scripts: Record<string, string>;
  editableScripts: Record<string, string>;
  onEditableScriptsChange: (scripts: Record<string, string>) => void;
  defaultVoiceKey: PresetVoiceKey;
  onDefaultVoiceKeyChange: (key: PresetVoiceKey) => void;
  characterVoicePresets: Record<string, CharacterVoicePreset>;
  analyzedScripts: Record<string, AIAnalyzedScript | null>;
  onAnalyzedScriptsChange: (scripts: Record<string, AIAnalyzedScript | null>) => void;
  audioChunks: Record<string, SynthesizedChunk[]>;
  onAudioChunksChange: (chunks: Record<string, SynthesizedChunk[]>) => void;
  onNavigateToNextStep: () => void;
}

export const TextToSpeech: React.FC<Props> = ({
  story, selectedEpisodes, scripts, editableScripts, onEditableScriptsChange,
  defaultVoiceKey, onDefaultVoiceKeyChange, characterVoicePresets, analyzedScripts, onAnalyzedScriptsChange,
  audioChunks, onAudioChunksChange, onNavigateToNextStep
}) => {
  const [loading, setLoading] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [manualPlayingKey, setManualPlayingKey] = useState<string | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(selectedEpisodes[0]?.id || story?.id || null);
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const activeStory =
    selectedEpisodes.find((e) => e.id === activeEpisodeId) ||
    selectedEpisodes[0] ||
    story;
  const currentScript = activeStory ? (editableScripts[activeStory.id] || scripts[activeStory.id] || '') : '';
  const currentAnalyzedScript = activeStory ? analyzedScripts[activeStory.id] : null;
  const currentChunks = activeStory ? (audioChunks[activeStory.id] || []) : [];

  const handleAnalyze = async () => {
    if (!activeStory || !currentScript.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const chars = activeStory.proSettingsUsed?.characters || [];
      const result = await analyzeScript(currentScript, chars);
      onAnalyzedScriptsChange({ ...analyzedScripts, [activeStory.id]: result });
    } catch (e: any) {
      setError("Script analysis failed. Check your script format.");
    } finally {
      setLoading(false);
    }
  };

  const synthesizeEpisode = async (episodeId: string, script: string, analyzed: AIAnalyzedScript) => {
    const episodeChunks: SynthesizedChunk[] = [...(audioChunks[episodeId] || [])];
    for (const scene of analyzed.scenes) {
      if (episodeChunks.some(c => c.sceneNumbers.includes(scene.sceneNumber))) continue;
      if (!scene.dialogue || scene.dialogue.length === 0) continue;

      const audioUrl = await generateSpeech(scene.dialogue, characterVoicePresets, defaultVoiceKey);
      const chunk = { 
        id: `s-${episodeId}-${scene.sceneNumber}-${Date.now()}`, 
        audioDataUrl: audioUrl, 
        sceneNumbers: [scene.sceneNumber], 
        downloadFilename: `ep_${episodeId}_scene_${scene.sceneNumber}.wav` 
      };
      episodeChunks.push(chunk);
      onAudioChunksChange({ ...audioChunks, [episodeId]: [...episodeChunks] });
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  };

  const handleSynthesizeAll = async () => {
    if (!activeStory || !currentAnalyzedScript) return;
    setSynthesizing(true);
    setError(null);
    try {
      await synthesizeEpisode(activeStory.id, currentScript, currentAnalyzedScript);
    } catch (e: any) {
      setError("Synthesis failed.");
    } finally {
      setSynthesizing(false);
    }
  };

  const handleBatchSynthesize = async () => {
    if (selectedEpisodes.length === 0) return;
    setSynthesizing(true);
    setError(null);
    try {
      const nextAnalyzedScripts: Record<string, AIAnalyzedScript | null> = { ...analyzedScripts };
      for (const ep of selectedEpisodes) {
        const script = editableScripts[ep.id] || scripts[ep.id];
        if (!script) continue;
        
        let analyzed = nextAnalyzedScripts[ep.id];
        if (!analyzed) {
          const chars = ep.proSettingsUsed?.characters || [];
          analyzed = await analyzeScript(script, chars);
          nextAnalyzedScripts[ep.id] = analyzed;
          onAnalyzedScriptsChange(nextAnalyzedScripts);
        }
        
        await synthesizeEpisode(ep.id, script, analyzed);
      }
    } catch (e: any) {
      setError("Batch synthesis failed.");
    } finally {
      setSynthesizing(false);
    }
  };

  const handlePlayAll = () => {
    if (currentChunks.length === 0) return;
    setManualPlayingKey(null);
    Object.values(audioRefs.current).forEach((audioEl: HTMLAudioElement | null) => {
      if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }
    });
    setPlayingIndex(0);
  };

  const handleToggleSceneAudio = (sceneNumber: number) => {
    const key = `${activeEpisodeId}-${sceneNumber}`;
    const audioEl = audioRefs.current[key];
    if (!audioEl) return;

    // Manual playback cancels batch playback state.
    setPlayingIndex(null);

    if (manualPlayingKey === key && !audioEl.paused) {
      audioEl.pause();
      setManualPlayingKey(null);
      return;
    }

    Object.entries(audioRefs.current).forEach(([otherKey, otherAudio]) => {
      const audioEl = otherAudio as HTMLAudioElement | null;
      if (audioEl && otherKey !== key) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }
    });

    if (manualPlayingKey !== key) {
      audioEl.currentTime = 0;
    }
    audioEl.play().then(() => {
      setManualPlayingKey(key);
    }).catch((playError) => {
      console.error("Audio play failed:", playError);
      setManualPlayingKey(null);
    });
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

  useEffect(() => {
    if (playingIndex !== null && playingIndex < currentChunks.length) {
      const sceneNum = currentChunks[playingIndex].sceneNumbers[0];
      const audioEl = audioRefs.current[`${activeEpisodeId}-${sceneNum}`];
      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(playError => {
          console.error("Audio play failed:", playError);
          setPlayingIndex(playingIndex + 1);
        });
        audioEl.onended = () => {
          setPlayingIndex(playingIndex + 1);
        };
      } else {
        setPlayingIndex(playingIndex + 1);
      }
    } else if (playingIndex !== null && playingIndex >= currentChunks.length) {
      setPlayingIndex(null);
    }
  }, [playingIndex, currentChunks, activeEpisodeId]);

  useEffect(() => {
    setManualPlayingKey(null);
    setPlayingIndex(null);
    Object.values(audioRefs.current).forEach((audioEl: HTMLAudioElement | null) => {
      if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }
    });
  }, [activeEpisodeId]);

  if (!story) return <SectionCard title="Voice Production"><p className="text-neu-text italic">Matrix empty. Select a narrative node first.</p></SectionCard>;

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
                  {audioChunks[ep.id]?.length > 0 ? (
                    <span className="text-[9px] font-bold text-green-500 uppercase">{audioChunks[ep.id].length} Clips Ready</span>
                  ) : (
                    <span className="text-[9px] font-bold text-neu-text uppercase">No Audio</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {selectedEpisodes.length > 1 && (
            <button 
              onClick={handleBatchSynthesize}
              disabled={synthesizing}
              className="w-full neu-btn py-3 text-xs font-bold uppercase text-accent-orange mt-4"
            >
              Batch Synthesize All
            </button>
          )}
        </section>
      )}

      <section className={`${selectedEpisodes.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
        <SectionCard title="Voice Production">
          {!currentAnalyzedScript ? (
            <div className="py-20 flex flex-col items-center">
              <p className="text-neu-text text-sm mb-8 text-center max-w-sm">Analyze the script for "{activeStory?.title}" to prepare the voice recording sequence.</p>
              <ActionButton onClick={handleAnalyze} isLoading={loading}>Start Script Analysis</ActionButton>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="neu-pressed p-6 rounded-2xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label htmlFor="defaultVoiceKeySelect" className="text-sm font-bold text-neu-text-dark mb-3 block">Main Narrator Voice</label>
                        <select id="defaultVoiceKeySelect" className="w-full neu-pressed text-neu-text-dark p-4 rounded-xl text-sm focus:outline-none focus:ring-0" value={defaultVoiceKey} onChange={e => onDefaultVoiceKeyChange(e.target.value as PresetVoiceKey)}>
                            {PRESET_VOICE_KEYS_ORDERED.map(k => <option key={k} value={k}>{PRESET_VOICES_CONFIG[k].displayName}</option>)}
                        </select>
                    </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-bold text-neu-text-dark uppercase">Generated Audio Clips</h3>
                    <div className="flex gap-3">
                      {currentChunks.length > 0 && (
                        <ActionButton onClick={handlePlayAll} className="py-2 px-6 text-xs bg-accent-orange text-white">
                          {playingIndex !== null ? 'PLAYING...' : 'PLAY ALL'}
                        </ActionButton>
                      )}
                      <ActionButton onClick={handleSynthesizeAll} isLoading={synthesizing} className="py-2 px-6 text-xs">SYNTHESIZE ALL AUDIO</ActionButton>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {currentAnalyzedScript.scenes.map(s => {
                    const chunk = currentChunks.find(c => c.sceneNumbers.includes(s.sceneNumber));
                    const isPlaying = playingIndex !== null && playingIndex < currentChunks.length && currentChunks[playingIndex].sceneNumbers.includes(s.sceneNumber);
                    const audioKey = `${activeEpisodeId}-${s.sceneNumber}`;
                    const isManualPlaying = manualPlayingKey === audioKey;
                    return (
                      <div key={s.sceneNumber} className={`neu-flat p-4 rounded-xl flex items-center justify-between transition-all hover:scale-[1.01] ${isPlaying || isManualPlaying ? 'border-2 border-accent-orange' : ''}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center neu-pressed rounded-lg text-xs font-black text-neu-text-dark">S{s.sceneNumber}</div>
                          <div>
                            <p className="text-sm text-neu-text-dark font-bold truncate max-w-[300px]">{s.description}</p>
                            <p className="text-xs text-neu-text uppercase font-bold mt-0.5">{s.charactersInScene.join(', ') || 'NARRATOR'}</p>
                          </div>
                        </div>
                        {chunk ? (
                            <div className="flex gap-2">
                                 <audio 
                                   ref={el => {
                                     audioRefs.current[audioKey] = el;
                                     if (el) {
                                       el.onended = () => {
                                         if (manualPlayingKey === audioKey) {
                                           setManualPlayingKey(null);
                                         }
                                       };
                                     }
                                   }}
                                   src={chunk.audioDataUrl} 
                                   className="hidden" 
                                 />
                                 <button
                                   onClick={() => handleToggleSceneAudio(s.sceneNumber)}
                                   className="neu-btn p-2 text-accent-orange font-bold min-w-[36px]"
                                   title={isManualPlaying ? "Pause clip" : "Play clip"}
                                   aria-label={isManualPlaying ? "Pause clip" : "Play clip"}
                                 >
                                   {isManualPlaying ? '⏸' : '▶'}
                                 </button>
                                 <DownloadButton fileUrl={chunk.audioDataUrl} fileName={chunk.downloadFilename} buttonText="WAV" className="neu-btn text-xs py-1 px-4" />
                            </div>
                        ) : (
                            <div className="text-xs text-neu-text font-bold uppercase">
                              {synthesizing ? 'Pending...' : 'Not Generated'}
                            </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <ActionButton onClick={onNavigateToNextStep} className="w-full py-5 text-sm">Next Step: Visualize Scenes</ActionButton>
            </div>
          )}
        </SectionCard>
      </section>
      {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
    </div>
  );
};
