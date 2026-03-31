import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SectionCard } from '../SectionCard.tsx';
import { ActionButton } from '../common/ActionButton.tsx';
import { StoryIdea, SceneImageDefinition, TitleCardData, GeneratedImage, SynthesizedChunk, AIAnalyzedScript } from '../../types.ts';
import JSZip from 'jszip';

interface Props {
  story: StoryIdea | null;
  selectedEpisodes: StoryIdea[];
  scripts: Record<string, string>;
  editableScripts: Record<string, string>;
  sceneImageDefinitions: Record<string, SceneImageDefinition[]>;
  titles: Record<string, TitleCardData[]>;
  thumbnail: GeneratedImage | null;
  audioChunks: Record<string, SynthesizedChunk[]>;
  analyzedScripts: Record<string, AIAnalyzedScript | null>;
}

export const ProjectExport: React.FC<Props> = ({ 
  story, selectedEpisodes, scripts, editableScripts, 
  sceneImageDefinitions, titles, thumbnail, audioChunks, analyzedScripts 
}) => {
  const [exporting, setExporting] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(story?.id || null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeStory = selectedEpisodes.find(e => e.id === activeEpisodeId) || story;
  const currentScript = activeStory ? (editableScripts[activeStory.id] || scripts[activeStory.id] || '') : '';
  
  const currentScenes = useMemo(() => activeStory ? (sceneImageDefinitions[activeStory.id] || []) : [], [activeStory, sceneImageDefinitions]);
  const currentAudio = useMemo(() => activeStory ? (audioChunks[activeStory.id] || []) : [], [activeStory, audioChunks]);
  const currentAnalyzed = activeStory ? analyzedScripts[activeStory.id] : null;

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.currentTime = time;
    }
    if (videoRef.current) {
      videoRef.current.currentTime = time % (videoRef.current.duration || 1);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const handlePlayPause = () => {
    if (playingIndex === null) {
      handlePlayPreview();
      return;
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (videoRef.current) videoRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        if (videoRef.current) videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const packageEpisode = async (zip: JSZip, episode: StoryIdea) => {
    const epFolder = zip.folder(episode.title.replace(/\s+/g, '_'));
    if (!epFolder) return;

    const script = editableScripts[episode.id] || scripts[episode.id] || '';
    epFolder.file("script.txt", script);

    const scenes = sceneImageDefinitions[episode.id] || [];
    const imgFolder = epFolder.folder("images");
    const vidFolder = epFolder.folder("videos");

    for (const s of scenes) {
      if (s.generatedImageUrl) {
        const imgData = s.generatedImageUrl.split(',')[1];
        if (imgData) imgFolder?.file(`scene_${s.sceneNumber}.png`, imgData, { base64: true });
      }
      if (s.generatedVideoUrl) {
        try {
          const vid = await (await fetch(s.generatedVideoUrl)).blob();
          vidFolder?.file(`scene_${s.sceneNumber}.mp4`, vid);
        } catch (e) {
          console.error(`Failed to fetch video for scene ${s.sceneNumber}`, e);
        }
      }
    }

    const audio = audioChunks[episode.id] || [];
    const audioFolder = epFolder.folder("audio");
    for (const a of audio) {
      if (a.audioDataUrl) {
        const b64 = a.audioDataUrl.split(',')[1];
        if (b64) audioFolder?.file(a.downloadFilename, b64, { base64: true });
      }
    }
  };

  const handleExport = async () => {
    if (!activeStory) return;
    setExporting(true);
    try {
      const zip = new JSZip();
      await packageEpisode(zip, activeStory);
      
      if (thumbnail) {
        const thumbData = thumbnail.src.split(',')[1];
        if (thumbData) zip.file("thumbnail.png", thumbData, { base64: true });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${activeStory.title}_project_package.zip`;
      link.click();
    } catch (e) { 
      console.error(e);
      alert("Failed to package files."); 
    } finally { 
      setExporting(false); 
    }
  };

  const handleExportAll = async () => {
    if (selectedEpisodes.length === 0) return;
    setExporting(true);
    try {
      const zip = new JSZip();
      for (const ep of selectedEpisodes) {
        await packageEpisode(zip, ep);
      }
      
      if (thumbnail) {
        const thumbData = thumbnail.src.split(',')[1];
        if (thumbData) zip.file("thumbnail.png", thumbData, { base64: true });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${story?.title || 'Series'}_Full_Package.zip`;
      link.click();
    } catch (e) { 
      console.error(e);
      alert("Failed to package series."); 
    } finally { 
      setExporting(false); 
    }
  };

  const handlePlayPreview = () => {
    if (currentScenes.length === 0) return;
    setPlayingIndex(0);
  };

  const handleStopPreview = () => {
    setPlayingIndex(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (playingIndex !== null && playingIndex < currentScenes.length) {
      const scene = currentScenes[playingIndex];
      if (!scene) return;
      const audioChunk = currentAudio.find(a => a.sceneNumbers?.includes(scene.sceneNumber));
      
      if (audioChunk && audioRef.current) {
        audioRef.current.src = audioChunk.audioDataUrl;
        audioRef.current.volume = volume;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        const timer = setTimeout(() => {
          setPlayingIndex(playingIndex + 1);
        }, 4000);
        setDuration(4);
        setCurrentTime(0);
        setIsPlaying(true);
        return () => clearTimeout(timer);
      }
    } else if (playingIndex !== null && playingIndex >= currentScenes.length) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setPlayingIndex(null);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [playingIndex, currentScenes, currentAudio]);

  const currentScene = playingIndex !== null ? currentScenes[playingIndex] : null;

  if (!story) return <SectionCard title="Export"><p className="text-neu-text italic">Matrix empty. Select a narrative node first.</p></SectionCard>;

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
                  <span className="text-[9px] font-bold text-neu-text uppercase">
                    {sceneImageDefinitions[ep.id]?.length || 0} Scenes • {audioChunks[ep.id]?.length || 0} Audio
                  </span>
                </div>
              </div>
            ))}
          </div>
          {selectedEpisodes.length > 1 && (
            <button 
              onClick={handleExportAll}
              disabled={exporting}
              className="w-full neu-btn py-3 text-xs font-bold uppercase text-accent-orange mt-4"
            >
              Export Full Series
            </button>
          )}
        </section>
      )}

      <section className={`${selectedEpisodes.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'} space-y-8`}>
        {currentScenes.length > 0 && (
          <SectionCard title={`Preview: ${activeStory?.title}`}>
            <div className="flex flex-col items-center space-y-6">
              <div className="w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center border-4 border-neu-base">
                {currentScene ? (
                  <>
                    {currentScene.generatedVideoUrl ? (
                      <video 
                        ref={videoRef}
                        src={currentScene.generatedVideoUrl || undefined} 
                        className="w-full h-full object-cover"
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                      />
                    ) : currentScene.generatedImageUrl ? (
                      <img 
                        src={currentScene.generatedImageUrl || undefined} 
                        alt={`Scene ${currentScene.sceneNumber}`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-neu-text font-bold uppercase tracking-widest">
                        Scene {currentScene.sceneNumber} - No Visuals
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                      <p className="text-white font-bold text-lg drop-shadow-md">
                        Scene {currentScene.sceneNumber}
                      </p>
                      {currentAnalyzed && (
                        <p className="text-white/80 text-sm mt-1 drop-shadow-md line-clamp-2">
                          {currentAnalyzed.scenes?.find(s => s.sceneNumber === currentScene.sceneNumber)?.dialogue?.map(d => `${d.speaker}: ${d.text}`)?.join(' ')}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-neu-text-dark font-black text-2xl tracking-widest uppercase opacity-20">
                    Ready to Play
                  </div>
                )}
                <audio 
                  ref={audioRef} 
                  className="hidden" 
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                  onEnded={() => setPlayingIndex(prev => prev !== null ? prev + 1 : null)}
                />
              </div>

              <div className="flex flex-col w-full gap-4 mt-4 bg-neu-base p-4 rounded-xl border-2 border-neu-border">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handlePlayPause}
                    className="w-12 h-12 flex items-center justify-center bg-accent-orange text-white rounded-full hover:scale-105 transition-transform text-xl"
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-neu-text-dark font-bold font-mono">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <input 
                      type="range" 
                      min={0} 
                      max={duration || 100} 
                      step={0.1}
                      value={currentTime} 
                      onChange={handleSeek}
                      className="w-full accent-accent-orange"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-32">
                    <span className="text-neu-text-dark text-lg">🔊</span>
                    <input 
                      type="range" 
                      min={0} 
                      max={1} 
                      step={0.01}
                      value={volume} 
                      onChange={handleVolumeChange}
                      className="w-full accent-accent-orange"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setPlayingIndex(prev => prev !== null ? Math.max(0, prev - 1) : 0)}
                    disabled={playingIndex === null || playingIndex === 0}
                    className="text-xs font-bold text-neu-text-dark uppercase hover:text-accent-orange disabled:opacity-50"
                  >
                    ⏮ Previous Scene
                  </button>
                  <span className="text-xs font-bold text-neu-text uppercase">
                    Scene {playingIndex !== null ? playingIndex + 1 : 0} of {currentScenes.length}
                  </span>
                  <button 
                    onClick={() => setPlayingIndex(prev => prev !== null ? Math.min(currentScenes.length - 1, prev + 1) : 0)}
                    disabled={playingIndex === null || playingIndex === currentScenes.length - 1}
                    className="text-xs font-bold text-neu-text-dark uppercase hover:text-accent-orange disabled:opacity-50"
                  >
                    Next Scene ⏭
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard title="Final Project Export">
          <div className="text-center py-10 space-y-8">
            <div className="w-20 h-20 neu-pressed rounded-full flex items-center justify-center mx-auto text-3xl text-accent-orange">📦</div>
            <div>
              <h3 className="text-xl font-bold uppercase text-neu-text-dark">Ready for Download</h3>
              <p className="text-sm text-neu-text mt-2 max-w-sm mx-auto">Download all assets for "{activeStory?.title}" in one organized ZIP folder.</p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="neu-flat p-4 rounded-xl text-center">
                <span className="text-lg text-accent-orange font-black block">{currentScenes.length}</span>
                <span className="text-xs font-bold text-neu-text-dark uppercase">Visuals</span>
              </div>
              <div className="neu-flat p-4 rounded-xl text-center">
                <span className="text-lg text-accent-orange font-black block">{currentAudio.length}</span>
                <span className="text-xs font-bold text-neu-text-dark uppercase">Audio</span>
              </div>
              <div className="neu-flat p-4 rounded-xl text-center">
                <span className="text-lg text-accent-orange font-black block">{currentScenes.filter(s => s.generatedVideoUrl).length}</span>
                <span className="text-xs font-bold text-neu-text-dark uppercase">Videos</span>
              </div>
            </div>
            <ActionButton onClick={handleExport} isLoading={exporting} className="w-full max-w-md mx-auto py-6">Download Episode Package</ActionButton>
          </div>
        </SectionCard>
      </section>
    </div>
  );
};