import { ActiveView, ProjectState } from './types.ts';

const hasText = (value: string | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const mapHasAnyText = (entries: Record<string, string>): boolean =>
  Object.values(entries).some((entry) => hasText(entry));

const mapHasAny = <T>(entries: Record<string, T | null | undefined>): boolean =>
  Object.values(entries).some((entry) => !!entry);

const getSelectedEpisodeIds = (state: ProjectState): string[] =>
  state.generatedStoryIdeas
    .filter((idea) => state.selectedIdeaIds.includes(idea.id) && !idea.isSeriesConcept)
    .map((idea) => idea.id);

const getKeyedIdeaIds = (state: ProjectState): string[] => {
  const keyedIds = new Set<string>();
  [
    ...Object.keys(state.sw_scriptOutlines),
    ...Object.keys(state.sw_generatedScripts),
    ...Object.keys(state.analyzedScriptData),
    ...Object.keys(state.audioChunks),
    ...Object.keys(state.simg_sceneImageDefinitions),
    ...Object.keys(state.tcg_titleCards),
  ].forEach((id) => {
    if (id.trim().length > 0) keyedIds.add(id);
  });
  return Array.from(keyedIds);
};

export const getProductionTargetIds = (state: ProjectState): string[] => {
  const selectedEpisodeIds = getSelectedEpisodeIds(state);
  if (selectedEpisodeIds.length > 0) return selectedEpisodeIds;

  if (state.storyForScripting && !state.storyForScripting.isSeriesConcept) {
    return [state.storyForScripting.id];
  }

  const keyedIds = getKeyedIdeaIds(state);
  if (keyedIds.length > 0) return keyedIds;

  if (state.storyForScripting?.id) return [state.storyForScripting.id];

  return [];
};

const coverageRatio = (
  targetIds: string[],
  hasForTarget: (targetId: string) => boolean,
  hasAnyFallback: boolean
): number => {
  if (targetIds.length === 0) return hasAnyFallback ? 1 : 0;
  const completedCount = targetIds.filter((targetId) => hasForTarget(targetId)).length;
  return completedCount / targetIds.length;
};

const hasGeneratedVisuals = (state: ProjectState): boolean =>
  Object.values(state.simg_sceneImageDefinitions).some((scenes) =>
    scenes.some((scene) => !!scene.generatedImageUrl || !!scene.generatedVideoUrl)
  );

const hasGeneratedAudio = (state: ProjectState): boolean =>
  Object.values(state.audioChunks).some((chunks) =>
    chunks.some((chunk) => hasText(chunk.audioDataUrl))
  );

export const computeProjectProgress = (state: ProjectState): number => {
  const targetIds = getProductionTargetIds(state);
  let progress = 0;

  if (hasText(state.storyIdeasKeywords) || state.generatedStoryIdeas.length > 0) progress += 15;
  if (targetIds.length > 0 || !!state.storyForScripting) progress += 10;

  progress += 10 * coverageRatio(
    targetIds,
    (targetId) => hasText(state.sw_scriptOutlines[targetId]),
    mapHasAnyText(state.sw_scriptOutlines)
  );

  progress += 20 * coverageRatio(
    targetIds,
    (targetId) => hasText(state.sw_generatedScripts[targetId]),
    mapHasAnyText(state.sw_generatedScripts)
  );

  progress += 10 * coverageRatio(
    targetIds,
    (targetId) => !!state.analyzedScriptData[targetId],
    mapHasAny(state.analyzedScriptData)
  );

  progress += 15 * coverageRatio(
    targetIds,
    (targetId) => (state.audioChunks[targetId] || []).some((chunk) => hasText(chunk.audioDataUrl)),
    hasGeneratedAudio(state)
  );

  progress += 10 * coverageRatio(
    targetIds,
    (targetId) =>
      (state.simg_sceneImageDefinitions[targetId] || []).some(
        (scene) => !!scene.generatedImageUrl || !!scene.generatedVideoUrl
      ),
    hasGeneratedVisuals(state)
  );

  if (!!state.tm_generatedThumbnail) progress += 5;

  progress += 5 * coverageRatio(
    targetIds,
    (targetId) => (state.tcg_titleCards[targetId] || []).length > 0,
    Object.values(state.tcg_titleCards).some((cards) => (cards || []).length > 0)
  );

  return Math.max(0, Math.min(100, Math.round(progress)));
};

export const inferWorkflowType = (state: ProjectState): 'episodic' | 'single' => {
  const selectedEpisodeIds = getSelectedEpisodeIds(state);
  const hasSeriesConcept = state.generatedStoryIdeas.some((idea) => idea.isSeriesConcept);
  const storyMarkedEpisodic = state.storyForScripting?.videoStructure === 'episodic';
  if (selectedEpisodeIds.length > 1 || hasSeriesConcept || storyMarkedEpisodic) return 'episodic';
  return 'single';
};

export const getWorkflowStats = (state: ProjectState) => {
  const targetIds = getProductionTargetIds(state);
  const scriptCount = targetIds.filter((targetId) => hasText(state.sw_generatedScripts[targetId])).length;
  const audioCount = targetIds.reduce(
    (total, targetId) =>
      total + (state.audioChunks[targetId] || []).filter((chunk) => hasText(chunk.audioDataUrl)).length,
    0
  );
  const visualCount = targetIds.reduce(
    (total, targetId) =>
      total +
      (state.simg_sceneImageDefinitions[targetId] || []).filter(
        (scene) => !!scene.generatedImageUrl || !!scene.generatedVideoUrl
      ).length,
    0
  );
  return {
    workflow: inferWorkflowType(state),
    episodeCount: targetIds.length,
    scriptCount,
    audioCount,
    visualCount,
    resumeView: state.lastEditorView || (state.activeView !== ActiveView.Hub ? state.activeView : undefined),
  };
};
