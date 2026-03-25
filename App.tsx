
import React, { useState, useEffect, useRef } from 'react';
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
import { LandingPage } from './components/LandingPage.tsx';
import CheckoutModal from './components/CheckoutModal';
import { InfoBar } from './components/InfoBar.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { FirebaseProvider, useFirebase } from './FirebaseContext';
import { uploadImageAsset, uploadAudioAsset } from './services/storageService';
import { computeProjectProgress } from './projectProgress.ts';
import { DEFAULT_SCRIPT_DURATION_MAX_MINUTES, DEFAULT_SCRIPT_DURATION_MINUTES } from './constants.ts';
import { ContextualStepGuide, WorkflowCriterion, WorkflowGuideStep } from './components/workflow/ContextualStepGuide.tsx';

const createDefaultProSettings = (): ProStorySettings => ({
  contentStyle: ContentStyle.Drama,
  topics: [],
  characterCount: 1,
  subGenre: STORY_SUB_GENRES[0].id,
  characters: [],
  primarySetting: '',
  incitingIncidentIdea: '',
  productionProtocol: ProductionProtocol.Cinematic,
  videoBudget: 3,
  scriptDurationMinMinutes: DEFAULT_SCRIPT_DURATION_MINUTES,
  scriptDurationMaxMinutes: DEFAULT_SCRIPT_DURATION_MAX_MINUTES,
  realisticImages: false
});

const createEmptyProjectState = (isProUser = false): ProjectState => ({
  projectId: undefined,
  activeView: ActiveView.Hub,
  lastEditorView: undefined,
  storyIdeasKeywords: '',
  generatedStoryIdeas: [],
  selectedIdeaIds: [],
  isProUser,
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

const createProjectId = () =>
  `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const isLocalMediaUrl = (url: string | undefined) =>
  !!url && (url.startsWith('data:') || url.startsWith('blob:'));

const stateHasPersistableContent = (state: ProjectState): boolean =>
  state.storyIdeasKeywords.trim().length > 0 ||
  state.generatedStoryIdeas.length > 0 ||
  state.selectedIdeaIds.length > 0 ||
  !!state.storyForScripting ||
  Object.keys(state.sw_scriptOutlines).length > 0 ||
  Object.keys(state.sw_generatedScripts).length > 0 ||
  Object.keys(state.audioChunks).length > 0 ||
  Object.keys(state.simg_sceneImageDefinitions).length > 0 ||
  !!state.tm_generatedThumbnail ||
  state.ffimg_generatedImages.length > 0;

const hasGeneratedVisuals = (state: ProjectState): boolean =>
  Object.values(state.simg_sceneImageDefinitions).some((scenes) =>
    scenes.some((scene) => !!scene.generatedImageUrl || !!scene.generatedVideoUrl)
  );

const hasGeneratedAudio = (state: ProjectState): boolean =>
  Object.values(state.audioChunks).some((chunks) =>
    chunks.some((chunk) => !!chunk.audioDataUrl && chunk.audioDataUrl.trim().length > 0)
  );

const deriveResumeViewFromState = (state: ProjectState): ActiveView => {
  const preferred = state.lastEditorView || state.activeView;
  if (
    preferred &&
    preferred !== ActiveView.Hub &&
    preferred !== ActiveView.TitleCardGenerator &&
    preferred !== ActiveView.FreeformImageGenerator
  ) {
    return preferred;
  }
  if (hasGeneratedVisuals(state) || Object.keys(state.simg_sceneImageDefinitions).length > 0) return ActiveView.SceneImages;
  if (hasGeneratedAudio(state) || Object.keys(state.analyzedScriptData).length > 0) return ActiveView.TextToSpeech;
  if (Object.keys(state.sw_generatedScripts).length > 0 || Object.keys(state.sw_scriptOutlines).length > 0) return ActiveView.ScriptWriter;
  if (state.generatedStoryIdeas.length > 0 || state.storyIdeasKeywords.trim().length > 0) return ActiveView.StoryIdeas;
  return ActiveView.StoryIdeas;
};

const deriveProjectIdentity = (state: ProjectState): { id: string; title: string; description: string } | null => {
  if (!stateHasPersistableContent(state)) return null;

  const idea =
    state.storyForScripting ||
    state.generatedStoryIdeas.find((i) => state.selectedIdeaIds.includes(i.id)) ||
    state.generatedStoryIdeas.find((i) => !i.isSeriesConcept) ||
    state.generatedStoryIdeas[0];

  const fallbackTitle = state.storyIdeasKeywords.trim().slice(0, 80);
  const fallbackDescription = state.storyIdeasKeywords.trim().slice(0, 500);
  const title = (idea?.title || fallbackTitle || 'Untitled Project').trim();
  const description = (idea?.description || fallbackDescription || 'Story project draft').trim();
  return {
    id: state.projectId || createProjectId(),
    title,
    description,
  };
};

const getStableProjectId = (state: ProjectState): string | undefined => {
  if (state.projectId) return state.projectId;
  const identity = deriveProjectIdentity(state);
  return identity?.id;
};

const clearStaleGenerationFlags = (state: ProjectState): ProjectState => ({
  ...state,
  simg_sceneImageDefinitions: Object.fromEntries(
    Object.entries(state.simg_sceneImageDefinitions).map(([ideaId, scenes]) => [
      ideaId,
      scenes.map((scene) => ({
        ...scene,
        isGenerating: false,
        generatedImageUrl: scene.generatedImageUrl?.trim() ? scene.generatedImageUrl : undefined,
        generatedVideoUrl: scene.generatedVideoUrl?.trim() ? scene.generatedVideoUrl : undefined,
      })),
    ])
  ),
  audioChunks: Object.fromEntries(
    Object.entries(state.audioChunks).map(([ideaId, chunks]) => [
      ideaId,
      chunks.filter((chunk) => chunk.audioDataUrl?.trim().length > 0),
    ])
  ),
  ffimg_generatedImages: state.ffimg_generatedImages.filter((img) => img.src?.trim().length > 0),
  tm_generatedThumbnail: state.tm_generatedThumbnail?.src?.trim()
    ? state.tm_generatedThumbnail
    : null,
  tcg_titleCards: Object.fromEntries(
    Object.entries(state.tcg_titleCards).map(([ideaId, cards]) => [
      ideaId,
      cards.filter((card) => card.src?.trim().length > 0),
    ])
  ),
});

const AppContent: React.FC = () => {
  const { user, profile, projects, loading: firebaseLoading, signIn, signOut, saveProject, deleteProject, updateProfile } = useFirebase();
  const [activeView, setActiveView] = useState<ActiveView>(ActiveView.Hub);
  
  const [projectState, setProjectState] = useState<ProjectState>(() => createEmptyProjectState(false));

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const saveAttemptRef = useRef(0);
  const sceneUploadRunRef = useRef(0);
  const audioUploadRunRef = useRef(0);
  const thumbnailUploadRunRef = useRef(0);

  const getActiveProjectId = (state: ProjectState): string | undefined =>
    getStableProjectId(state);

  // After sign-in: check for a pending checkout the user initiated from the landing page
  useEffect(() => {
    if (!user) return;
    const priceId = sessionStorage.getItem('sm_pending_checkout');
    if (priceId) {
      sessionStorage.removeItem('sm_pending_checkout');
      setCheckoutPriceId(priceId);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'complete') {
      setPaymentSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  // Strip raw binary assets before writing to Firestore.
  // base64 data: URLs and ephemeral blob: URLs are replaced with empty string
  // so they never cause a document size overflow. Storage URLs (https://) pass through.
  const sanitizeStateForFirestore = (state: ProjectState): ProjectState => {
    const cleanUrl = (url: string | undefined) =>
      !url || isLocalMediaUrl(url) ? '' : url;
    return {
      ...state,
      simg_sceneImageDefinitions: Object.fromEntries(
        Object.entries(state.simg_sceneImageDefinitions).map(([id, scenes]) => [
          id, scenes.map(s => ({ ...s, generatedImageUrl: cleanUrl(s.generatedImageUrl), generatedVideoUrl: cleanUrl(s.generatedVideoUrl), isGenerating: false }))
        ])
      ),
      audioChunks: Object.fromEntries(
        Object.entries(state.audioChunks).map(([id, chunks]) => [
          id, chunks.map(c => ({ ...c, audioDataUrl: cleanUrl(c.audioDataUrl) }))
        ])
      ),
      ffimg_generatedImages: state.ffimg_generatedImages.map(img => ({ ...img, src: cleanUrl(img.src) })),
      tm_generatedThumbnail: state.tm_generatedThumbnail
        ? { ...state.tm_generatedThumbnail, src: cleanUrl(state.tm_generatedThumbnail.src) }
        : null,
      tcg_titleCards: Object.fromEntries(
        Object.entries(state.tcg_titleCards).map(([id, cards]) => [
          id, cards.map(c => ({ ...c, src: cleanUrl(c.src) }))
        ])
      ),
    };
  };

  const [proSettings, setProSettings] = useState<ProStorySettings>(() => createDefaultProSettings());

  // Veo video generation is Phase 2 — images work now, video coming soon
  const hasVeoKey = true;

  // Update isProUser when user changes
  useEffect(() => {
    if (profile) {
      setProjectState(prev => ({ ...prev, isProUser: !!profile.isPro }));
    }
  }, [profile]);

  useEffect(() => {
    setProjectState((prev) => {
      const nextLastEditorView = activeView === ActiveView.Hub ? prev.lastEditorView : activeView;
      if (prev.activeView === activeView && prev.lastEditorView === nextLastEditorView) {
        return prev;
      }
      return {
        ...prev,
        activeView,
        lastEditorView: nextLastEditorView,
      };
    });
  }, [activeView]);

  const navItems: NavItem[] = [
    { id: ActiveView.Hub, label: 'Projects', icon: '📁' },
    { id: ActiveView.StoryIdeas, label: '1. Settings', icon: '⚙️' },
    { id: ActiveView.ScriptWriter, label: '2. Script', icon: '📝' },
    { id: ActiveView.TextToSpeech, label: '3. Voice', icon: '🎙️' },
    { id: ActiveView.SceneImages, label: '4. Visuals', icon: '🎬' },
    { id: ActiveView.ThumbnailMaker, label: 'Cover', icon: '🖼️' },
    { id: ActiveView.ProjectExport, label: 'Export', icon: '📦' },
  ];

  // Opens the Stripe embedded checkout. Default to USD monthly; landing page
  // handles the CAD/annual toggle for pre-signup visitors.
  const handleUpgradeToPro = () => {
    setCheckoutPriceId('price_1TAG2vAHxmIA77jAagUXCyht');
  };

  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const uploadAudioAssetWithRetry = async (
    userId: string,
    projectId: string,
    chunkId: string,
    audioUrl: string
  ): Promise<string> => {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await uploadAudioAsset(userId, projectId, chunkId, audioUrl);
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await wait(350 * (2 ** (attempt - 1)));
      }
    }
    throw new Error('Audio upload retry exhausted.');
  };

  const isRetryableSaveError = (error: unknown): boolean => {
    const code = typeof (error as { code?: unknown })?.code === 'string'
      ? String((error as { code?: string }).code).toLowerCase()
      : '';
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    return (
      code.includes('unavailable') ||
      code.includes('deadline-exceeded') ||
      code.includes('aborted') ||
      code.includes('internal') ||
      code.includes('resource-exhausted') ||
      message.includes('quota')
    );
  };

  const handleManualSave = async () => {
    if (!user) return;
    if (!stateHasPersistableContent(projectState)) {
      setSaveStatus('idle');
      return;
    }

    const persistedState: ProjectState = {
      ...projectState,
      activeView,
      projectId: projectState.projectId || createProjectId(),
    };
    if (!projectState.projectId) {
      setProjectState((prev) =>
        prev.projectId ? prev : { ...prev, projectId: persistedState.projectId }
      );
    }

    const identity = deriveProjectIdentity(persistedState);
    if (!identity) {
      setSaveStatus('idle');
      return;
    }

    const saveAttemptId = ++saveAttemptRef.current;
    const project: Project = {
      id: identity.id,
      title: identity.title,
      description: identity.description,
      lastModified: Date.now(),
      progress: computeProjectProgress(persistedState),
      state: sanitizeStateForFirestore(persistedState),
    };

    const maxAttempts = 3;
    const retryBaseDelayMs = 350;
    setSaveStatus('saving');

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await saveProject(project);
        if (saveAttemptId === saveAttemptRef.current) {
          setSaveStatus('saved');
        }
        return;
      } catch (error) {
        const shouldRetry = attempt < maxAttempts && isRetryableSaveError(error);
        if (!shouldRetry) {
          if (saveAttemptId === saveAttemptRef.current) {
            setSaveStatus('error');
          }
          return;
        }
        await wait(retryBaseDelayMs * (2 ** (attempt - 1)));
        if (saveAttemptId !== saveAttemptRef.current) return;
      }
    }
  };

  // Upload scene images to Storage immediately after generation.
  // Optimistic: state updates instantly with base64 for UI, then updates again
  // with the permanent Storage URL once upload completes.
  const handleSceneImageDefinitionsChange = async (definitions: Record<string, SceneImageDefinition[]>) => {
    const uploadRunId = ++sceneUploadRunRef.current;
    const capturedProjectId = getActiveProjectId(projectState);
    setProjectState(prev => ({ ...prev, simg_sceneImageDefinitions: definitions }));
    if (!user || !capturedProjectId) return;
    const hasNewBase64 = Object.values(definitions).some(scenes =>
      scenes.some(s => s.generatedImageUrl?.startsWith('data:'))
    );
    if (!hasNewBase64) return;
    const uploaded = { ...definitions };
    for (const [ideaId, scenes] of Object.entries(definitions)) {
      uploaded[ideaId] = await Promise.all(scenes.map(async scene => {
        if (scene.generatedImageUrl?.startsWith('data:')) {
          try {
            const url = await uploadImageAsset(user.uid, capturedProjectId, `scene_${ideaId}_${scene.sceneNumber}`, scene.generatedImageUrl);
            return { ...scene, generatedImageUrl: url };
          } catch { return scene; }
        }
        return scene;
      }));
    }
    setProjectState((prev) => {
      const currentProjectId = getActiveProjectId(prev);
      if (
        uploadRunId !== sceneUploadRunRef.current ||
        !currentProjectId ||
        currentProjectId !== capturedProjectId
      ) {
        return prev;
      }
      return { ...prev, simg_sceneImageDefinitions: uploaded };
    });
  };

  // Upload audio chunks to Storage immediately after generation.
  const handleAudioChunksChange = async (chunks: Record<string, SynthesizedChunk[]>) => {
    const uploadRunId = ++audioUploadRunRef.current;
    const capturedProjectId = getActiveProjectId(projectState);
    setProjectState(prev => ({ ...prev, audioChunks: chunks }));
    if (!user || !capturedProjectId) return;
    const uploadCandidates = Object.entries(chunks).flatMap(([ideaId, list]) =>
      list
        .filter((chunk) => isLocalMediaUrl(chunk.audioDataUrl))
        .map((chunk) => ({ ideaId, chunk }))
    );
    if (uploadCandidates.length === 0) return;

    await Promise.all(uploadCandidates.map(async ({ ideaId, chunk }) => {
      try {
        const url = await uploadAudioAssetWithRetry(user.uid, capturedProjectId, chunk.id, chunk.audioDataUrl);
        setProjectState((prev) => {
          const currentProjectId = getActiveProjectId(prev);
          if (
            uploadRunId !== audioUploadRunRef.current ||
            !currentProjectId ||
            currentProjectId !== capturedProjectId
          ) {
            return prev;
          }
          const existing = prev.audioChunks[ideaId] || [];
          return {
            ...prev,
            audioChunks: {
              ...prev.audioChunks,
              [ideaId]: existing.map((existingChunk) =>
                existingChunk.id === chunk.id ? { ...existingChunk, audioDataUrl: url } : existingChunk
              )
            }
          };
        });
      } catch (error) {
        console.error(`Audio upload failed for chunk ${chunk.id}:`, error);
      }
    }));
  };

  // Upload thumbnail to Storage immediately after generation.
  const handleThumbnailChange = async (thumbnail: GeneratedImage | null) => {
    const uploadRunId = ++thumbnailUploadRunRef.current;
    const capturedProjectId = getActiveProjectId(projectState);
    setProjectState(prev => ({ ...prev, tm_generatedThumbnail: thumbnail }));
    if (!user || !capturedProjectId || !thumbnail?.src?.startsWith('data:')) return;
    try {
      const url = await uploadImageAsset(user.uid, capturedProjectId, 'thumbnail', thumbnail.src, 0.75);
      setProjectState((prev) => {
        const currentProjectId = getActiveProjectId(prev);
        if (
          uploadRunId !== thumbnailUploadRunRef.current ||
          !currentProjectId ||
          currentProjectId !== capturedProjectId
        ) {
          return prev;
        }
        return { ...prev, tm_generatedThumbnail: { ...thumbnail, src: url } };
      });
    } catch { /* keep base64 in memory, sanitizer strips it from Firestore */ }
  };

  const handleCreateProject = () => {
    setProjectState(createEmptyProjectState(!!profile?.isPro));
    setProSettings(createDefaultProSettings());
    setSaveStatus('idle');
    setActiveView(ActiveView.StoryIdeas);
  };

  const selectedEpisodes = projectState.generatedStoryIdeas.filter(
    (idea) => projectState.selectedIdeaIds.includes(idea.id) && !idea.isSeriesConcept
  );
  const workflowTargetIds = selectedEpisodes.length > 0
    ? selectedEpisodes.map((episode) => episode.id)
    : projectState.storyForScripting?.id
      ? [projectState.storyForScripting.id]
      : [];
  const hasSelectedStory = workflowTargetIds.length > 0;
  const scriptsReadyForTargets = hasSelectedStory && workflowTargetIds.every(
    (id) => (projectState.sw_generatedScripts[id] || '').trim().length > 0
  );
  const analyzedReadyForTargets = hasSelectedStory && workflowTargetIds.every(
    (id) => !!projectState.analyzedScriptData[id]
  );
  const audioReadyForTargets = hasSelectedStory && workflowTargetIds.every(
    (id) => (projectState.audioChunks[id] || []).length > 0
  );
  const scenePlansReadyForTargets = hasSelectedStory && workflowTargetIds.every(
    (id) => (projectState.simg_sceneImageDefinitions[id] || []).length > 0
  );
  const allSceneDefinitions = Object.values(projectState.simg_sceneImageDefinitions) as SceneImageDefinition[][];
  const hasAnyVisualOutput = allSceneDefinitions.some((scenes) =>
    scenes.some((scene) => !!scene.generatedImageUrl || !!scene.generatedVideoUrl)
  );
  const hasThumbnail = !!projectState.tm_generatedThumbnail?.src;
  const exportReady = scriptsReadyForTargets && (audioReadyForTargets || hasAnyVisualOutput);

  const workflowSteps: WorkflowGuideStep[] = [
    {
      id: ActiveView.StoryIdeas,
      label: 'Settings',
      complete:
        projectState.storyIdeasKeywords.trim().length > 0 &&
        projectState.generatedStoryIdeas.length > 0 &&
        hasSelectedStory,
    },
    { id: ActiveView.ScriptWriter, label: 'Script', complete: scriptsReadyForTargets },
    { id: ActiveView.TextToSpeech, label: 'Voice', complete: audioReadyForTargets },
    { id: ActiveView.SceneImages, label: 'Visuals', complete: scenePlansReadyForTargets || hasAnyVisualOutput },
    { id: ActiveView.ThumbnailMaker, label: 'Cover', complete: hasThumbnail },
    { id: ActiveView.ProjectExport, label: 'Export', complete: exportReady },
  ];

  const guidanceByView: Partial<Record<ActiveView, { title: string; instructions: string[]; criteria: WorkflowCriterion[] }>> = {
    [ActiveView.StoryIdeas]: {
      title: 'Step 1: Settings Guidance',
      instructions: [
        'Describe the core concept, then generate ideas.',
        'Pick a story or episodes to carry into script writing.',
        'Use style and duration settings to set script intent before writing.',
      ],
      criteria: [
        { label: 'Concept prompt is provided.', complete: projectState.storyIdeasKeywords.trim().length > 0 },
        { label: 'At least one idea has been generated.', complete: projectState.generatedStoryIdeas.length > 0 },
        { label: 'At least one story/episode is selected.', complete: hasSelectedStory },
      ],
    },
    [ActiveView.ScriptWriter]: {
      title: 'Step 2: Script Guidance',
      instructions: [
        'Refine the structural outline for the active episode.',
        'Generate the script using the quality contract and duration target.',
        'Review script output, then continue only after target episodes are scripted.',
      ],
      criteria: [
        {
          label: 'Narrative style is selected.',
          complete: [ScriptType.SingleVoice, ScriptType.TwoVoice, ScriptType.MultiVoice].includes(projectState.sw_selectedScriptType),
        },
        { label: 'A story or episode is selected.', complete: hasSelectedStory },
        { label: 'Scripts exist for selected targets.', complete: scriptsReadyForTargets },
      ],
    },
    [ActiveView.TextToSpeech]: {
      title: 'Step 3: Voice Guidance',
      instructions: [
        'Analyze the script so scenes and dialogue are parsed.',
        'Synthesize all scenes for the active episode(s).',
        'Verify playback and downloadable clips before moving to visuals.',
      ],
      criteria: [
        { label: 'Scripts are available for selected targets.', complete: scriptsReadyForTargets },
        { label: 'Script analysis exists for selected targets.', complete: analyzedReadyForTargets },
        { label: 'At least one synthesized clip exists per selected target.', complete: audioReadyForTargets },
      ],
    },
    [ActiveView.SceneImages]: {
      title: 'Step 4: Visual Guidance',
      instructions: [
        'Generate scene plans from the script for each target episode.',
        'Create visuals for key scenes and verify style consistency.',
        'Continue after each selected episode has at least a scene plan.',
      ],
      criteria: [
        { label: 'Scripts are available for selected targets.', complete: scriptsReadyForTargets },
        { label: 'Scene plans exist for selected targets.', complete: scenePlansReadyForTargets },
        { label: 'At least one visual output exists.', complete: hasAnyVisualOutput },
      ],
    },
    [ActiveView.ThumbnailMaker]: {
      title: 'Cover Guidance',
      instructions: [
        'Draft a cover prompt matching the project tone.',
        'Generate and select the preferred thumbnail.',
        'Save the cover before final export packaging.',
      ],
      criteria: [
        { label: 'A project story context exists.', complete: !!projectState.storyForScripting || selectedEpisodes.length > 0 },
        { label: 'Thumbnail prompt is set or a thumbnail exists.', complete: projectState.tm_prompt.trim().length > 0 || hasThumbnail },
        { label: 'Thumbnail image is generated.', complete: hasThumbnail },
      ],
    },
    [ActiveView.ProjectExport]: {
      title: 'Export Guidance',
      instructions: [
        'Review scripts, audio clips, and generated visuals for the active episode.',
        'Run episode export or full-series export as needed.',
        'Confirm packaged assets before publishing.',
      ],
      criteria: [
        { label: 'Scripts are available for selected targets.', complete: scriptsReadyForTargets },
        { label: 'Audio or visuals are available for export.', complete: audioReadyForTargets || hasAnyVisualOutput },
        { label: 'Export prerequisites are complete.', complete: exportReady },
      ],
    },
  };

  const renderView = () => {
    if (firebaseLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    if (!user) return <LandingPage onSignIn={signIn} />;

    if (activeView === ActiveView.Hub) return (
      <ProfileManager
        currentUser={profile}
        projects={projects}
        onSignIn={signIn}
        onSignOut={signOut}
        onUpgradeToPro={handleUpgradeToPro}
        onCreateProject={handleCreateProject}
        onLoadProject={(p) => {
          const hydratedState = clearStaleGenerationFlags(p.state);
          const resumeView = deriveResumeViewFromState(hydratedState);
          const loadedState: ProjectState = {
            ...hydratedState,
            projectId: hydratedState.projectId || p.id,
            activeView: resumeView,
            lastEditorView: hydratedState.lastEditorView || (resumeView !== ActiveView.Hub ? resumeView : undefined),
            isProUser: !!profile?.isPro || hydratedState.isProUser,
          };
          setProjectState(loadedState);
          const loadedSettings =
            loadedState.storyForScripting?.proSettingsUsed ||
            loadedState.generatedStoryIdeas.find((idea) => idea.proSettingsUsed)?.proSettingsUsed;
          if (loadedSettings) {
            setProSettings(loadedSettings);
          }
          setSaveStatus('saved');
          setActiveView(resumeView);
        }}
        onDeleteProject={deleteProject}
        onUpdateProfile={updateProfile}
        userId={user?.uid ?? ''}
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
        <button onClick={() => {}} className="px-6 py-2 bg-orange-500 text-white rounded font-bold">Video Coming Soon (Phase 2)</button>
      </div>
    );

    switch (activeView) {
      case ActiveView.StoryIdeas: 
        return <StoryIdeaGenerator 
          onIdeasGenerated={(k, i) => { 
            setProjectState(prev => ({ 
              ...prev, 
              projectId: prev.projectId || createProjectId(),
              activeView: ActiveView.StoryIdeas,
              storyIdeasKeywords: k, 
              generatedStoryIdeas: i, 
              selectedIdeaIds: [] 
            })); 
          }} 
          onProceedToScripting={() => { 
            const s = projectState.generatedStoryIdeas.find(x => x.id === projectState.selectedIdeaIds[0]); 
            if (s) { 
              setProjectState(prev => ({ ...prev, storyForScripting: s, activeView: ActiveView.ScriptWriter }));
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
          analyzedScripts={projectState.analyzedScriptData}
          onAnalyzedScriptsChange={(s) => setProjectState(prev => ({ ...prev, analyzedScriptData: s }))}
          audioChunks={projectState.audioChunks}
          onAudioChunksChange={handleAudioChunksChange}
          onNavigateToNextStep={() => setActiveView(ActiveView.SceneImages)}
        />;
      case ActiveView.SceneImages: 
        return <SceneImageManager 
          story={projectState.storyForScripting}
          selectedEpisodes={selectedEpisodes}
          scripts={projectState.sw_generatedScripts}
          editableScripts={projectState.tts_editableScripts}
          sceneImageDefinitions={projectState.simg_sceneImageDefinitions}
          onSceneImageDefinitionsChange={handleSceneImageDefinitionsChange}
          globalImageStylePrompt={projectState.simg_globalImageStylePrompt}
          onGlobalImageStylePromptChange={(s) => setProjectState(prev => ({ ...prev, simg_globalImageStylePrompt: s }))}
          onNavigateToNextStep={() => setActiveView(ActiveView.ThumbnailMaker)}
          analyzedScripts={projectState.analyzedScriptData}
          onAnalyzedScriptsChange={(s) => setProjectState(prev => ({ ...prev, analyzedScriptData: s }))}
        />;
      case ActiveView.ThumbnailMaker: 
        return <ThumbnailMaker 
          initialPrompt={projectState.tm_prompt} 
          onPromptChange={(p) => setProjectState(prev => ({ ...prev, tm_prompt: p }))} 
          initialThumbnail={projectState.tm_generatedThumbnail}
          onThumbnailChange={handleThumbnailChange} 
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

  // Landing page renders as a full standalone page — skip app shell entirely
  if (!firebaseLoading && !user) {
    return <LandingPage onSignIn={signIn} />;
  }

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
                onClick={() => {
                  setActiveView(item.id);
                  setProjectState(prev => ({ ...prev, activeView: item.id }));
                }}
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
            {projectState.projectId && (
              <span className={`text-[10px] font-bold uppercase tracking-widest transition-all ${
                saveStatus === 'saving' ? 'text-amber-500 animate-pulse' :
                saveStatus === 'saved'  ? 'text-emerald-500' :
                saveStatus === 'error'  ? 'text-red-500' : 'text-neu-text opacity-30'
              }`}>
                {saveStatus === 'saving' ? '● Saving...' :
                 saveStatus === 'saved'  ? '✓ Saved' :
                 saveStatus === 'error'  ? '✕ Save failed' : '● Unsaved'}
              </span>
            )}
            <button
              type="button"
              onClick={() => { void handleManualSave(); }}
              disabled={saveStatus === 'saving' || !stateHasPersistableContent(projectState)}
              className="neu-btn px-4 py-1 text-xs font-bold text-neu-text-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveStatus === 'saving' ? 'Saving…' : 'Save'}
            </button>
            <span className="text-sm font-bold text-neu-text-dark">{profile?.username}</span>
            <button onClick={signOut} className="neu-btn px-4 py-1 text-xs font-bold text-neu-text hover:text-red-500">Sign Out</button>
          </div>
        )}
      </header>

      <main className="flex-grow flex flex-col">
        {activeView !== ActiveView.Hub && guidanceByView[activeView] && (
          <ContextualStepGuide
            activeView={activeView}
            steps={workflowSteps}
            title={guidanceByView[activeView]!.title}
            instructions={guidanceByView[activeView]!.instructions}
            criteria={guidanceByView[activeView]!.criteria}
          />
        )}
        {renderView()}
      </main>
      <InfoBar />

      {checkoutPriceId && (
        <CheckoutModal
          priceId={checkoutPriceId}
          onClose={() => setCheckoutPriceId(null)}
        />
      )}

      {paymentSuccess && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 900, display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 24px', background: '#16a34a', color: '#fff',
          borderRadius: 999, boxShadow: '0 8px 32px rgba(22,163,74,0.4)',
          fontSize: 13, fontWeight: 700,
        }}>
          ✓ Subscription activated — welcome to Story Makr Pro!
          <button
            onClick={() => setPaymentSuccess(false)}
            style={{ marginLeft: 8, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          >×</button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <FirebaseProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </FirebaseProvider>
  );
};

export default App;
