
import React, { useState, useEffect } from 'react';
import { ActiveView, NavItem, StoryIdea, ScriptType, VideoGenreId, GeneratedImage, CharacterVoicePreset, ProStorySettings, STORY_SUB_GENRES, PresetVoiceKey, SceneImageDefinition, AIAnalyzedScript, TitleCardData, UserProfile, Project, ProjectState, ProductionProtocol, SynthesizedChunk, ContentStyle } from './types.ts';
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
import { FirebaseProvider, useFirebase } from './FirebaseContext';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
  }
}

const AppContent: React.FC = () => {
  const { user, profile, projects, loading: firebaseLoading, signIn, signOut, saveProject, deleteProject, upgradeToPro } = useFirebase();
  const [activeView, setActiveView] = useState<ActiveView>(ActiveView.Hub);
  const [authError, setAuthError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  
  const [projectState, setProjectState] = useState<ProjectState>({
    activeView: ActiveView.Hub,
    storyIdeasKeywords: '',
    generatedStoryIdeas: [],
    selectedIdeaIds: [],
    isProUser: false,
    storyForScripting: null,
    sw_scriptOutlines: {},
    sw_generatedScripts: {},
    sw_selectedScriptType: ScriptType.SingleVoice,
    simg_sceneImageDefinitions: {},
    simg_globalImageStylePrompt: 'Cinematic, high-detail, dramatic lighting, 8k resolution',
    tts_editableScripts: {},
    tts_defaultVoiceKey: 'Narrator_M',
    tts_characterVoicePresets: {},
    tcg_titleCards: {},
    ffimg_prompt: '',
    ffimg_generatedImages: [],
    tm_prompt: '',
    tm_generatedThumbnail: null,
    analyzedScriptData: {},
    audioChunks: {},
  });

  const [proSettings, setProSettings] = useState<ProStorySettings>({ 
    contentStyle: ContentStyle.Drama,
    topics: [],
    characterCount: 1,
    subGenre: STORY_SUB_GENRES[0].id, 
    characters: [], 
    primarySetting: '', 
    incitingIncidentIdea: '', 
    productionProtocol: ProductionProtocol.Cinematic, 
    videoBudget: 3, 
    realisticImages: false 
  });

  const [hasVeoKey, setHasVeoKey] = useState(false);

  useEffect(() => {
    if (window.aistudio) {
      window.aistudio.hasSelectedApiKey().then(setHasVeoKey);
    }
  }, []);

  // Update isProUser when user changes
  useEffect(() => {
    if (profile) {
      setProjectState(prev => ({ ...prev, isProUser: !!profile.isPro }));
    }
  }, [profile]);

  useEffect(() => {
    if (user) setAuthError(null);
  }, [user]);

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

  const handleUpgradeToPro = async () => {
    setBillingError(null);
    try {
      await upgradeToPro();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pro upgrade failed.";
      setBillingError(message);
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signIn();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed.";
      setAuthError(message);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign out failed.";
      setAuthError(message);
    }
  };

  // Auto-save project state
  useEffect(() => {
    const save = async () => {
      if (user && projectState.storyForScripting) {
        const project: Project = {
          id: projectState.storyForScripting.id,
          title: projectState.storyForScripting.title,
          description: projectState.storyForScripting.description,
          lastModified: Date.now(),
          progress: 50,
          state: projectState
        };
        await saveProject(project);
      }
    };

    const timeoutId = setTimeout(save, 2000); // Debounce save
    return () => clearTimeout(timeoutId);
  }, [projectState, user, saveProject]);

  const renderView = () => {
    if (firebaseLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    if (!user || activeView === ActiveView.Hub) return (
      <ProfileManager 
        currentUser={profile} 
        projects={projects} 
        onSignIn={handleSignIn} 
        onSignOut={handleSignOut} 
        onUpgradeToPro={handleUpgradeToPro}
        authError={authError}
        billingError={billingError}
        onCreateProject={() => setActiveView(ActiveView.StoryIdeas)} 
        onLoadProject={(p) => {
          setProjectState(p.state);
          setActiveView(p.state.activeView || ActiveView.StoryIdeas);
        }} 
        onDeleteProject={deleteProject} 
      />
    );
    
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

    const selectedEpisodes = projectState.generatedStoryIdeas.filter(i => projectState.selectedIdeaIds.includes(i.id) && !i.isSeriesConcept);

    switch (activeView) {
      case ActiveView.StoryIdeas: 
        return <StoryIdeaGenerator 
          onIdeasGenerated={(k, i) => { 
            setProjectState(prev => ({ 
              ...prev, 
              storyIdeasKeywords: k, 
              generatedStoryIdeas: i, 
              selectedIdeaIds: [] 
            })); 
          }} 
          onProceedToScripting={() => { 
            const s = projectState.generatedStoryIdeas.find(x => x.id === projectState.selectedIdeaIds[0]); 
            if (s) { 
              setProjectState(prev => ({ ...prev, storyForScripting: s }));
              setActiveView(ActiveView.ScriptWriter); 
            } 
          }} 
          currentKeywords={projectState.storyIdeasKeywords} 
          currentIdeas={projectState.generatedStoryIdeas} 
          selectedIdeaIds={projectState.selectedIdeaIds} 
          setSelectedIdeaIds={(ids) => setProjectState(prev => ({ ...prev, selectedIdeaIds: typeof ids === 'function' ? ids(prev.selectedIdeaIds) : ids }))} 
          isProUser={projectState.isProUser}
          proSettings={proSettings} 
          onProSettingsChange={setProSettings} 
          onCharacterVoicePresetsChange={(v) => setProjectState(prev => ({ ...prev, tts_characterVoicePresets: v }))} 
        />;
      case ActiveView.ScriptWriter: 
        return <ScriptWriter 
          story={projectState.storyForScripting} 
          selectedEpisodes={selectedEpisodes}
          outlines={projectState.sw_scriptOutlines} 
          onOutlinesChange={(o) => setProjectState(prev => ({ ...prev, sw_scriptOutlines: o }))} 
          scripts={projectState.sw_generatedScripts} 
          onScriptsChange={(s) => setProjectState(prev => ({ ...prev, sw_generatedScripts: s }))} 
          initialScriptType={projectState.sw_selectedScriptType} 
          onScriptTypeChange={(t) => setProjectState(prev => ({ ...prev, sw_selectedScriptType: t }))} 
          onNavigateToNextStep={() => setActiveView(ActiveView.TextToSpeech)} 
        />;
      case ActiveView.TextToSpeech:
        return <TextToSpeech 
          story={projectState.storyForScripting}
          selectedEpisodes={selectedEpisodes}
          scripts={projectState.sw_generatedScripts}
          editableScripts={projectState.tts_editableScripts}
          onEditableScriptsChange={(s) => setProjectState(prev => ({ ...prev, tts_editableScripts: s }))}
          defaultVoiceKey={projectState.tts_defaultVoiceKey}
          onDefaultVoiceKeyChange={(v) => setProjectState(prev => ({ ...prev, tts_defaultVoiceKey: v }))}
          characterVoicePresets={projectState.tts_characterVoicePresets}
          audioChunks={projectState.audioChunks}
          onAudioChunksChange={(a) => setProjectState(prev => ({ ...prev, audioChunks: a }))}
          onNavigateToNextStep={() => setActiveView(ActiveView.SceneImages)}
        />;
      case ActiveView.SceneImages: 
        return <SceneImageManager 
          story={projectState.storyForScripting}
          selectedEpisodes={selectedEpisodes}
          scripts={projectState.sw_generatedScripts}
          editableScripts={projectState.tts_editableScripts}
          sceneImageDefinitions={projectState.simg_sceneImageDefinitions}
          onSceneImageDefinitionsChange={(d) => setProjectState(prev => ({ ...prev, simg_sceneImageDefinitions: d }))}
          globalImageStylePrompt={projectState.simg_globalImageStylePrompt}
          onGlobalImageStylePromptChange={(s) => setProjectState(prev => ({ ...prev, simg_globalImageStylePrompt: s }))}
          onNavigateToNextStep={() => setActiveView(ActiveView.ProjectExport)}
          analyzedScripts={projectState.analyzedScriptData}
          onAnalyzedScriptsChange={(s) => setProjectState(prev => ({ ...prev, analyzedScriptData: s }))}
        />;
      case ActiveView.ThumbnailMaker: 
        return <ThumbnailMaker 
          initialPrompt={projectState.tm_prompt} 
          onPromptChange={(p) => setProjectState(prev => ({ ...prev, tm_prompt: p }))} 
          initialThumbnail={projectState.tm_generatedThumbnail} 
          onThumbnailChange={(t) => setProjectState(prev => ({ ...prev, tm_generatedThumbnail: t }))} 
          storyIdeaForTitle={projectState.storyForScripting} 
        />;
      case ActiveView.ProjectExport: 
        return <ProjectExport 
          story={projectState.storyForScripting} 
          selectedEpisodes={selectedEpisodes}
          scripts={projectState.sw_generatedScripts}
          editableScripts={projectState.tts_editableScripts}
          sceneImageDefinitions={projectState.simg_sceneImageDefinitions}
          titles={projectState.tcg_titleCards}
          thumbnail={projectState.tm_generatedThumbnail}
          audioChunks={projectState.audioChunks}
          analyzedScripts={projectState.analyzedScriptData}
        />;
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
            <span className="text-sm font-bold text-neu-text-dark">{profile?.username}</span>
            <button onClick={signOut} className="neu-btn px-4 py-1 text-xs font-bold text-neu-text hover:text-red-500">Sign Out</button>
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

const App: React.FC = () => {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
};

export default App;
