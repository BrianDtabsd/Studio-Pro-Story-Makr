import React, { useState, useEffect, useRef } from 'react';
import { SectionCard } from '../SectionCard.tsx';
import { ActionButton } from '../common/ActionButton.tsx';
import { StoryIdea, SceneImageDefinition, TitleCardData, GeneratedImage, SynthesizedChunk, AIAnalyzedScript } from '../../types.ts';
import JSZip from 'jszip';

const sanitizeZipFilename = (value: string): string =>
  value.trim().replace(/[^a-zA-Z0-9._-]/g, '_');

const hasNonEmptyMediaUrl = (url: string | undefined): boolean =>
  typeof url === 'string' && url.trim().length > 0;
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
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(selectedEpisodes[0]?.id || story?.id || null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeStory =
    selectedEpisodes.find((e) => e.id === activeEpisodeId) ||
    selectedEpisodes[0] ||
    story;
  const currentScript = activeStory ? (editableScripts[activeStory.id] || scripts[activeStory.id] || '') : '';
  const currentScenes = activeStory ? (sceneImageDefinitions[activeStory.id] || []) : [];
  const currentAudio = activeStory ? (audioChunks[activeStory.id] || []).filter((chunk) => hasNonEmptyMediaUrl(chunk.audioDataUrl)) : [];
  const currentAnalyzed = activeStory ? analyzedScripts[activeStory.id] : null;

  useEffect(() => {
    setActiveEpisodeId((prev) => {
      if (selectedEpisodes.length > 0) {
        if (prev && selectedEpisodes.some((episode) => episode.id === prev)) return prev;
        return selectedEpisodes[0].id;
      }
      return story?.id || null;
    });
  }, [selectedEpisodes, story?.id]);

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
        try {
          const blob = await fetch(s.generatedImageUrl).then(r => r.blob());
          imgFolder?.file(`scene_${s.sceneNumber}.jpg`, blob);
        } catch (e) {
          console.error(`Failed to fetch image for scene ${s.sceneNumber}`, e);
        }
      }
      if (s.generatedVideoUrl) {
        try {
          const vid = await fetch(s.generatedVideoUrl).then(r => r.blob());
          vidFolder?.file(`scene_${s.sceneNumber}.mp4`, vid);
        } catch (e) {
          console.error(`Failed to fetch video for scene ${s.sceneNumber}`, e);
        }
      }
    }

    const audio = audioChunks[episode.id] || [];
    const audioFolder = epFolder.folder("audio");
    for (const a of audio) {
      if (hasNonEmptyMediaUrl(a.audioDataUrl)) {
        try {
          const blob = await fetch(a.audioDataUrl).then(r => r.blob());
          audioFolder?.file(sanitizeZipFilename(a.downloadFilename), blob);
        } catch (e) {
          console.error(`Failed to fetch audio chunk ${a.downloadFilename}`, e);
        }
      }
    }
  };

  const handleExport = async () => {
    if (!activeStory) return;
    setExporting(true);
    try {
      const zip = new JSZip();
      await packageEpisode(zip, activeStory);
      
      if (thumbnail?.src) {
        try {
          const blob = await fetch(thumbnail.src).then(r => r.blob());
          zip.file("thumbnail.jpg", blob);
        } catch (e) {
          console.error("Failed to fetch thumbnail", e);
        }
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
      
      if (thumbnail?.src) {
        try {
          const blob = await fetch(thumbnail.src).then(r => r.blob());
          zip.file("thumbnail.jpg", blob);
        } catch (e) {
          console.error("Failed to fetch thumbnail", e);
        }
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
      const audioChunk = currentAudio.find(a => a.sceneNumbers.includes(scene.sceneNumber));
      
      if (audioChunk && hasNonEmptyMediaUrl(audioChunk.audioDataUrl) && audioRef.current) {
        audioRef.current.src = audioChunk.audioDataUrl;
        audioRef.current.play().catch(console.error);
        
        audioRef.current.onended = () => {
          setPlayingIndex(playingIndex + 1);
        };
      } else {
        const timer = setTimeout(() => {
          setPlayingIndex(playingIndex + 1);
        }, 4000);
        return () => clearTimeout(timer);
      }
    } else if (playingIndex !== null && playingIndex >= currentScenes.length) {
      setPlayingIndex(null);
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
                        src={currentScene.generatedVideoUrl} 
                        className="w-full h-full object-cover"
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                      />
                    ) : currentScene.generatedImageUrl ? (
                      <img 
                        src={currentScene.generatedImageUrl} 
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
                          {currentAnalyzed.scenes.find(s => s.sceneNumber === currentScene.sceneNumber)?.dialogue.map(d => `${d.speaker}: ${d.text}`).join(' ')}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-neu-text-dark font-black text-2xl tracking-widest uppercase opacity-20">
                    Ready to Play
                  </div>
                )}
                <audio ref={audioRef} className="hidden" />
              </div>

              <div className="flex gap-4">
                {playingIndex === null ? (
                  <ActionButton onClick={handlePlayPreview} className="px-8 py-3 bg-accent-orange text-white">
                    ▶ Play Preview
                  </ActionButton>
                ) : (
                  <ActionButton onClick={handleStopPreview} className="px-8 py-3 bg-red-500 text-white">
                    ⏹ Stop Playback
                  </ActionButton>
                )}
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