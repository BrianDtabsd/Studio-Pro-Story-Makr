
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

const isCompiledMasterChunk = (chunk: SynthesizedChunk): boolean =>
  chunk.kind === 'compiled_master' || chunk.downloadFilename.includes('master_compiled');

const toSceneChunks = (chunks: SynthesizedChunk[]): SynthesizedChunk[] =>
  chunks.filter((chunk) => !isCompiledMasterChunk(chunk));

const toMasterChunk = (chunks: SynthesizedChunk[]): SynthesizedChunk | null =>
  chunks.find((chunk) => isCompiledMasterChunk(chunk)) || null;

const writeWavString = (view: DataView, offset: number, value: string) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
};

const combineSceneWavsToMaster = async (sceneChunks: SynthesizedChunk[]): Promise<string> => {
  const sorted = [...sceneChunks].sort((a, b) => (a.sceneNumbers[0] ?? 0) - (b.sceneNumbers[0] ?? 0));
  if (sorted.length === 0) throw new Error('No scene clips available for master compile.');

  const clipBuffers = await Promise.all(sorted.map(async (chunk) => {
    const response = await fetch(chunk.audioDataUrl);
    if (!response.ok) throw new Error(`Failed to read scene audio (${response.status}).`);
    return response.arrayBuffer();
  }));

  const firstHeader = new DataView(clipBuffers[0], 0, 44);
  const channels = firstHeader.getUint16(22, true);
  const sampleRate = firstHeader.getUint32(24, true);
  const bitsPerSample = firstHeader.getUint16(34, true);
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  const pcmParts: Uint8Array[] = [];
  let totalDataSize = 0;

  clipBuffers.forEach((buffer) => {
    const header = new DataView(buffer, 0, 44);
    const clipChannels = header.getUint16(22, true);
    const clipRate = header.getUint32(24, true);
    const clipBits = header.getUint16(34, true);
    if (clipChannels !== channels || clipRate !== sampleRate || clipBits !== bitsPerSample) {
      throw new Error('Scene clips use mixed WAV formats. Master compile requires matching WAV format.');
    }
    const dataSize = header.getUint32(40, true);
    const pcm = new Uint8Array(buffer, 44, dataSize);
    pcmParts.push(pcm);
    totalDataSize += pcm.length;
  });

  const merged = new ArrayBuffer(44 + totalDataSize);
  const mergedView = new DataView(merged);
  writeWavString(mergedView, 0, 'RIFF');
  mergedView.setUint32(4, 36 + totalDataSize, true);
  writeWavString(mergedView, 8, 'WAVE');
  writeWavString(mergedView, 12, 'fmt ');
  mergedView.setUint32(16, 16, true);
  mergedView.setUint16(20, 1, true);
  mergedView.setUint16(22, channels, true);
  mergedView.setUint32(24, sampleRate, true);
  mergedView.setUint32(28, byteRate, true);
  mergedView.setUint16(32, blockAlign, true);
  mergedView.setUint16(34, bitsPerSample, true);
  writeWavString(mergedView, 36, 'data');
  mergedView.setUint32(40, totalDataSize, true);

  const mergedPcm = new Uint8Array(merged, 44);
  let cursor = 0;
  pcmParts.forEach((pcm) => {
    mergedPcm.set(pcm, cursor);
    cursor += pcm.length;
  });

  return URL.createObjectURL(new Blob([merged], { type: 'audio/wav' }));
};

const resolveNarratorFallbackVoice = (voiceKey: PresetVoiceKey): PresetVoiceKey =>
  voiceKey.endsWith('_M') ? voiceKey : 'Narrator_M';

export const TextToSpeech: React.FC<Props> = ({
  story, selectedEpisodes, scripts, editableScripts, onEditableScriptsChange,
  defaultVoiceKey, onDefaultVoiceKeyChange, characterVoicePresets, analyzedScripts, onAnalyzedScriptsChange,
  audioChunks, onAudioChunksChange, onNavigateToNextStep
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
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [manualPlayingKey, setManualPlayingKey] = useState<string | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(selectedEpisodes[0]?.id || story?.id || null);
  const [synthesisStatus, setSynthesisStatus] = useState<string | null>(null);
  const [synthesisProgress, setSynthesisProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });
  const [failedScenesByEpisode, setFailedScenesByEpisode] = useState<Record<string, number[]>>({});
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const activeStory =
    selectedEpisodes.find((e) => e.id === activeEpisodeId) ||
    selectedEpisodes[0] ||
    story;
  const currentScript = activeStory ? (editableScripts[activeStory.id] || scripts[activeStory.id] || '') : '';
  const currentAnalyzedScript = activeStory ? analyzedScripts[activeStory.id] : null;
  const rawEpisodeChunks = activeStory ? (audioChunks[activeStory.id] || []) : [];
  const currentChunks = toSceneChunks(rawEpisodeChunks);
  const currentMasterChunk = toMasterChunk(rawEpisodeChunks);
  const narratorFallbackVoice = resolveNarratorFallbackVoice(defaultVoiceKey);
  const currentFailedScenes = activeStory ? (failedScenesByEpisode[activeStory.id] || []) : [];

  const handleAnalyze = async () => {
    if (!activeStory || !currentScript.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const chars = activeStory.proSettingsUsed?.characters || [];
      const result = await analyzeScript(currentScript, chars);
      onAnalyzedScriptsChange({ ...analyzedScripts, [activeStory.id]: result });
    } catch (e: unknown) {
      setError(asUiError(e, 'Script analysis failed.'));
    } finally {
      setLoading(false);
    }
  };

  const synthesizeEpisode = async (
    episodeId: string,
    _script: string,
    analyzed: AIAnalyzedScript,
    baseAudioChunks: Record<string, SynthesizedChunk[]>,
    onlySceneNumbers?: number[]
  ): Promise<{ nextAudioChunks: Record<string, SynthesizedChunk[]>; failedScenes: number[] }> => {
    const allEpisodeChunks: SynthesizedChunk[] = [...(baseAudioChunks[episodeId] || [])];
    const sceneChunks: SynthesizedChunk[] = toSceneChunks(allEpisodeChunks);
    const scenesToProcess = analyzed.scenes.filter((scene) => {
      if (!scene.dialogue || scene.dialogue.length === 0) return false;
      if (onlySceneNumbers && !onlySceneNumbers.includes(scene.sceneNumber)) return false;
      if (!onlySceneNumbers && sceneChunks.some((chunk) => chunk.sceneNumbers.includes(scene.sceneNumber))) return false;
      return true;
    });

    setSynthesisProgress({ completed: 0, total: scenesToProcess.length });
    const failedScenes: number[] = [];
    let nextAudioChunks: Record<string, SynthesizedChunk[]> = { ...baseAudioChunks };

    for (let index = 0; index < scenesToProcess.length; index += 1) {
      const scene = scenesToProcess[index];
      let sceneDone = false;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const audioUrl = await generateSpeech(scene.dialogue, characterVoicePresets, narratorFallbackVoice);
          const chunk: SynthesizedChunk = {
            id: `s-${episodeId}-${scene.sceneNumber}-${Date.now()}`,
            audioDataUrl: audioUrl,
            sceneNumbers: [scene.sceneNumber],
            downloadFilename: `ep_${episodeId}_scene_${scene.sceneNumber}.wav`,
            kind: 'scene',
          };
          const existingIndex = sceneChunks.findIndex((existing) => existing.sceneNumbers.includes(scene.sceneNumber));
          if (existingIndex >= 0) {
            sceneChunks[existingIndex] = chunk;
          } else {
            sceneChunks.push(chunk);
          }
          nextAudioChunks = { ...nextAudioChunks, [episodeId]: [...sceneChunks] };
          onAudioChunksChange(nextAudioChunks);
          setSynthesisProgress({ completed: index + 1, total: scenesToProcess.length });
          sceneDone = true;
          break;
        } catch (sceneError) {
          if (attempt === 2) {
            console.error('Scene synthesis failed:', sceneError);
          } else {
            await new Promise((resolve) => setTimeout(resolve, 450 * attempt));
          }
        }
      }
      if (!sceneDone) {
        failedScenes.push(scene.sceneNumber);
      }
      await new Promise(resolve => setTimeout(resolve, 450));
    }

    if (sceneChunks.length > 0) {
      try {
        const masterAudioUrl = await combineSceneWavsToMaster(sceneChunks);
        const compiled: SynthesizedChunk = {
          id: `master-${episodeId}-${Date.now()}`,
          audioDataUrl: masterAudioUrl,
          sceneNumbers: sceneChunks.flatMap((chunk) => chunk.sceneNumbers),
          downloadFilename: `ep_${episodeId}_master_compiled.wav`,
          kind: 'compiled_master',
        };
        nextAudioChunks = { ...nextAudioChunks, [episodeId]: [...sceneChunks, compiled] };
        onAudioChunksChange(nextAudioChunks);
      } catch (masterError) {
        setError(asUiError(masterError, 'Master compilation failed.'));
      }
    }
    return { nextAudioChunks, failedScenes };
  };

  const handleSynthesizeAll = async () => {
    if (!activeStory || !currentAnalyzedScript) return;
    setSynthesizing(true);
    setError(null);
    setSynthesisStatus('Running full synthesis...');
    try {
      const result = await synthesizeEpisode(activeStory.id, currentScript, currentAnalyzedScript, audioChunks);
      setFailedScenesByEpisode((prev) => ({ ...prev, [activeStory.id]: result.failedScenes }));
      if (result.failedScenes.length > 0) {
        setSynthesisStatus(`Completed with failed scenes: ${result.failedScenes.join(', ')}. Retry is available.`);
      } else {
        setSynthesisStatus('Synthesis complete. Scene clips and compiled master are ready.');
      }
    } catch (e: unknown) {
      setError(asUiError(e, 'Synthesis failed.'));
      setSynthesisStatus('Synthesis failed. Fix issues and retry.');
    } finally {
      setSynthesizing(false);
    }
  };

  const handleRetryFailedScenes = async () => {
    if (!activeStory || !currentAnalyzedScript || currentFailedScenes.length === 0) return;
    setSynthesizing(true);
    setError(null);
    setSynthesisStatus(`Retrying scenes: ${currentFailedScenes.join(', ')}`);
    try {
      const result = await synthesizeEpisode(
        activeStory.id,
        currentScript,
        currentAnalyzedScript,
        audioChunks,
        currentFailedScenes
      );
      setFailedScenesByEpisode((prev) => ({ ...prev, [activeStory.id]: result.failedScenes }));
      if (result.failedScenes.length > 0) {
        setSynthesisStatus(`Retry finished. Still failing scenes: ${result.failedScenes.join(', ')}.`);
      } else {
        setSynthesisStatus('Retry successful. All requested scenes synthesized.');
      }
    } catch (e: unknown) {
      setError(asUiError(e, 'Retry failed.'));
      setSynthesisStatus('Retry failed. Please try again.');
    } finally {
      setSynthesizing(false);
    }
  };

  const handleBatchSynthesize = async () => {
    if (selectedEpisodes.length === 0) return;
    setSynthesizing(true);
    setError(null);
    setSynthesisStatus('Batch synthesis running...');
    try {
      const nextAnalyzedScripts: Record<string, AIAnalyzedScript | null> = { ...analyzedScripts };
      let nextAudioChunks: Record<string, SynthesizedChunk[]> = { ...audioChunks };
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
        
        const result = await synthesizeEpisode(ep.id, script, analyzed, nextAudioChunks);
        nextAudioChunks = result.nextAudioChunks;
        setFailedScenesByEpisode((prev) => ({ ...prev, [ep.id]: result.failedScenes }));
      }
      setSynthesisStatus('Batch synthesis completed.');
    } catch (e: unknown) {
      setError(asUiError(e, 'Batch synthesis failed.'));
      setSynthesisStatus('Batch synthesis failed. Please retry.');
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
    setSynthesisStatus(null);
    setSynthesisProgress({ completed: 0, total: 0 });
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
                    <span className="text-[9px] font-bold text-green-500 uppercase">
                      {toSceneChunks(audioChunks[ep.id]).length} Scenes
                      {toMasterChunk(audioChunks[ep.id]) ? ' + Master' : ''}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-neu-text uppercase">No Audio</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {selectedEpisodes.length > 1 && (
            <button 
              type="button"
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
              <ActionButton type="button" onClick={handleAnalyze} isLoading={loading}>Start Script Analysis</ActionButton>
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
                        <p className="text-[10px] text-neu-text mt-2">
                          Unassigned narrator fallback always resolves to <span className="font-bold text-neu-text-dark">male</span> ({PRESET_VOICES_CONFIG[narratorFallbackVoice].displayName}).
                        </p>
                    </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-bold text-neu-text-dark uppercase">Generated Audio Clips</h3>
                    <div className="flex gap-3">
                      {currentChunks.length > 0 && (
                        <ActionButton type="button" onClick={handlePlayAll} className="py-2 px-6 text-xs bg-accent-orange text-white">
                          {playingIndex !== null ? 'PLAYING...' : 'PLAY ALL'}
                        </ActionButton>
                      )}
                      <ActionButton type="button" onClick={handleSynthesizeAll} isLoading={synthesizing} className="py-2 px-6 text-xs">
                        SYNTHESIZE ALL AUDIO
                      </ActionButton>
                      {currentFailedScenes.length > 0 && (
                        <ActionButton type="button" onClick={handleRetryFailedScenes} isLoading={synthesizing} className="py-2 px-6 text-xs">
                          RETRY FAILED
                        </ActionButton>
                      )}
                    </div>
                </div>
                {(synthesisStatus || synthesizing || currentFailedScenes.length > 0) && (
                  <div className="neu-pressed rounded-xl p-4 space-y-2">
                    {synthesisStatus && <p className="text-xs text-neu-text-dark font-bold">{synthesisStatus}</p>}
                    {synthesizing && synthesisProgress.total > 0 && (
                      <p className="text-[11px] text-neu-text">
                        Progress: {synthesisProgress.completed}/{synthesisProgress.total} scenes
                      </p>
                    )}
                    {currentFailedScenes.length > 0 && (
                      <p className="text-[11px] text-red-500 font-bold">
                        Failed scenes: {currentFailedScenes.join(', ')}
                      </p>
                    )}
                  </div>
                )}
                {currentMasterChunk && (
                  <div className="neu-pressed rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-neu-text-dark uppercase">Compiled Master Audio</p>
                        <p className="text-[11px] text-neu-text">
                          Combined episode track retained with scene clips.
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <audio controls src={currentMasterChunk.audioDataUrl} className="h-9" />
                        <DownloadButton
                          fileUrl={currentMasterChunk.audioDataUrl}
                          fileName={currentMasterChunk.downloadFilename}
                          buttonText="MASTER WAV"
                          className="neu-btn text-xs py-1 px-4"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                                   type="button"
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
              <ActionButton type="button" onClick={onNavigateToNextStep} className="w-full py-5 text-sm">Next Step: Visualize Scenes</ActionButton>
            </div>
          )}
        </SectionCard>
      </section>
      {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
    </div>
  );
};
