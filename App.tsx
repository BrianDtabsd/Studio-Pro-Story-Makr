
import React, { useState, useEffect } from 'react';
import { ActiveView, NavItem, StoryIdea, ScriptType, VideoGenreId, GeneratedImage, CharacterVoicePreset, ProStorySettings, STORY_SUB_GENRES, PresetVoiceKey, SceneImageDefinition, AIAnalyzedScript, TitleCardData, UserProfile, Project, ProjectState, ProductionProtocol } from './types.ts';
import { LeftSidebar } from './components/layout/LeftSidebar.tsx';
import { RightSidebar } from './components/layout/RightSidebar.tsx';
import { StoryIdeaGenerator } from './components/features/StoryIdeaGenerator.tsx';
import { ScriptWriter } from './components/features/ScriptWriter.tsx';
import { SceneImageManager } from './components/features/SceneImageManager.tsx';
import { TitleCardGenerator } from './components/features/TitleCardGenerator.tsx';
import { FreeformImageGenerator } from './components/features/FreeformImageGenerator.tsx';
import { ThumbnailMaker } from './components/features/ThumbnailMaker.tsx';
import { TextToSpeech } from './components/features/TextToSpeech.tsx';
import { ProfileManager } from './components/features/ProfileManager.tsx';
import { ProjectExport } from './components/features/ProjectExport.tsx';
import { InfoBar } from './components/InfoBar.tsx';
import { ActionButton } from './components/common/ActionButton.tsx';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    /* FIX: Removed readonly to ensure compatibility with other declarations of aistudio during interface merging. */
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>(ActiveView.Hub);
  const [keywords, setKeywords] = useState(''); 
  const [ideas, setIdeas] = useState<StoryIdea[]>([]);
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<string[]>([]);
  const [proEnabled, setProEnabled] = useState(false);
  const [proSettings, setProSettings] = useState<ProStorySettings>({ subGenre: STORY_SUB_GENRES[0].id, characters: [], primarySetting: '', incitingIncidentIdea: '', explicitnessLevel: 'General', productionProtocol: ProductionProtocol.Cinematic, videoBudget: 3, realisticImages: false });
  const [story, setStory] = useState<StoryIdea | null>(null);
  const [outline, setOutline] = useState('');
  const [script, setScript] = useState('');
  const [scriptType, setScriptType] = useState<ScriptType>(ScriptType.SingleVoice);
  const [sceneDefs, setSceneDefs] = useState<SceneImageDefinition[]>([]);
  const [stylePrompt, setStylePrompt] = useState('');
  const [editableScript, setEditableScript] = useState('');
  const [defaultVoice, setDefaultVoice] = useState<PresetVoiceKey>('Narrator_F');
  const [charVoices, setCharVoices] = useState<Record<string, CharacterVoicePreset>>({});
  const [titles, setTitles] = useState<TitleCardData[]>([]);
  const [ffPrompt, setFfPrompt] = useState('');
  const [ffImages, setFfImages] = useState<GeneratedImage[]>([]);
  const [tmPrompt, setTmPrompt] = useState('');
  const [thumbnail, setThumbnail] = useState<GeneratedImage | null>(null);
  const [analyzedScriptData, setAnalyzedScriptData] = useState<AIAnalyzedScript | null>(null);
  const [hasVeoKey, setHasVeoKey] = useState(false);

  useEffect(() => {
    if (window.aistudio) {
      window.aistudio.hasSelectedApiKey().then(setHasVeoKey);
    }
  }, []);

  const navItems: NavItem[] = [
    { id: ActiveView.Hub, label: 'Projects', icon: '📁' },
    { id: ActiveView.StoryIdeas, label: '1. Settings', icon: '⚙️' },
    { id: ActiveView.ScriptWriter, label: '2. Script', icon: '📝' },
    { id: ActiveView.TextToSpeech, label: '3. Voice', icon: '🎙️' },
    { id: ActiveView.SceneImages, label: '4. Visuals', icon: '🎬' },
    { id: ActiveView.ThumbnailMaker, label: 'Cover', icon: '🖼️' },
    { id: ActiveView.ProjectExport, label: 'Export', icon: '📦' },
  ];

  const handleOpenSelectKey = async () => {
    await window.aistudio.openSelectKey();
    setHasVeoKey(true);
  };

  const renderView = () => {
    if (!user || activeView === ActiveView.Hub) return <ProfileManager currentUser={user} projects={[]} onSignIn={u => setUser({ username: u, avatarSeed: '1', joinedDate: Date.now() })} onSignOut={() => setUser(null)} onCreateProject={() => setActiveView(ActiveView.StoryIdeas)} onLoadProject={() => {}} onDeleteProject={() => {}} />;
    
    // Video view needs a billing check
    if (activeView === ActiveView.SceneImages && !hasVeoKey) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
        <h3 className="text-xl font-bold uppercase tracking-widest text-xray-neon">Video Creation Requires Billing</h3>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
          High-quality video generation (Veo) requires a paid project API key. 
          Please consult the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener" className="text-xray-accent underline">billing documentation</a> for setup.
        </p>
        <ActionButton onClick={handleOpenSelectKey}>Connect Paid Project</ActionButton>
      </div>
    );

    switch (activeView) {
      case ActiveView.StoryIdeas: 
        return <StoryIdeaGenerator 
          onIdeasGenerated={(k, i, g, f) => { setKeywords(k); setIdeas(i); setSelectedIdeaIds([]); }} 
          onProceedToScripting={() => { 
            // For now, if multiple are selected, we just take the first one or combine them.
            // Since the user wants to "make them episodes", we can pass the first one as the main story,
            // or if it's a series concept, pass that.
            const s = ideas.find(x => x.id === selectedIdeaIds[0]); 
            if (s) { 
              setStory(s); 
              setActiveView(ActiveView.ScriptWriter); 
            } 
          }} 
          currentKeywords={keywords} currentIdeas={ideas} selectedIdeaIds={selectedIdeaIds} setSelectedIdeaIds={setSelectedIdeaIds} 
          proSettingsEnabled={proEnabled} onProSettingsEnabledChange={setProEnabled} 
          proSettings={proSettings} onProSettingsChange={setProSettings} 
          onCharacterVoicePresetsChange={setCharVoices} 
        />;
      case ActiveView.ScriptWriter: 
        return <ScriptWriter 
          story={story} initialOutline={outline} onOutlineChange={setOutline} 
          initialScript={script} onScriptChange={s => { setScript(s); setEditableScript(s); setAnalyzedScriptData(null); }} 
          initialScriptType={scriptType} onScriptTypeChange={setScriptType} 
          onNavigateToNextStep={() => setActiveView(ActiveView.TextToSpeech)} 
        />;
      case ActiveView.TextToSpeech: 
        return <TextToSpeech 
          scriptText={editableScript} 
          defaultVoiceKey={defaultVoice} onDefaultVoiceKeyChange={setDefaultVoice} 
          characterVoicePresets={charVoices} onCharacterVoicePresetsChange={setCharVoices} 
          onNavigateToSceneImageSetup={() => setActiveView(ActiveView.SceneImages)} 
          onLoadAudioQueue={() => {}} 
          scriptType={scriptType}
          analyzedScript={analyzedScriptData}
          onAnalyzedScriptChange={setAnalyzedScriptData}
          storyIdea={story}
        />;
      case ActiveView.SceneImages: 
        return <SceneImageManager 
          scriptText={editableScript} 
          sceneImageDefinitions={sceneDefs} onSceneImageDefinitionsChange={setSceneDefs} 
          globalImageStylePrompt={stylePrompt} onGlobalImageStylePromptChange={setStylePrompt} 
          onNavigateToNextStep={() => setActiveView(ActiveView.ProjectExport)} 
          storyIdea={story}
          analyzedScript={analyzedScriptData}
          onAnalyzedScriptChange={setAnalyzedScriptData}
        />;
      case ActiveView.ThumbnailMaker: 
        return <ThumbnailMaker 
          initialPrompt={tmPrompt} onPromptChange={setTmPrompt} 
          initialThumbnail={thumbnail} onThumbnailChange={setThumbnail} 
          storyIdeaForTitle={story} 
        />;
      case ActiveView.ProjectExport: 
        return <ProjectExport story={story} script={editableScript} scenes={sceneDefs} titles={titles} thumbnail={thumbnail} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 bg-neu-base text-neu-text">
      <header className="neu-flat px-8 py-5 flex flex-col md:flex-row items-center justify-between">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <h1 className="text-2xl font-black tracking-wide text-neu-text-dark uppercase">Story Makr</h1>
          <p className="text-sm font-medium text-neu-text">Script Idea Architect</p>
        </div>
        
        {user && (
          <nav className="flex flex-wrap justify-center gap-4">
            {navItems.map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`neu-btn px-6 py-2 font-medium relative ${activeView === item.id ? 'text-neu-text-dark font-bold' : 'text-neu-text hover:text-neu-text-dark'}`}
              >
                {item.label}
                {activeView === item.id && (
                  <span className="absolute inset-0 rounded-full border-2 border-orange-300 opacity-50 blur-[1px]"></span>
                )}
              </button>
            ))}
          </nav>
        )}

        {user && (
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="text-sm font-bold text-neu-text-dark">{user.username}</span>
            <button onClick={() => setUser(null)} className="neu-btn px-4 py-1 text-xs font-bold text-neu-text hover:text-red-500">Sign Out</button>
          </div>
        )}
      </header>

      <main className="flex-grow flex flex-col">
        {renderView()}
      </main>
      <InfoBar />
    </div>
  );
};

export default App;
