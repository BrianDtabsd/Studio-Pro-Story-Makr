
import React from 'react';

export enum ActiveView {
  Hub = 'Hub',
  StoryIdeas = 'StoryIdeas',
  ScriptWriter = 'ScriptWriter',
  TextToSpeech = 'TextToSpeech',
  SceneImages = 'SceneImages', 
  TitleCardGenerator = 'TitleCardGenerator',
  FreeformImageGenerator = 'FreeformImageGenerator',
  ThumbnailMaker = 'ThumbnailMaker',
  ProjectExport = 'ProjectExport',
}

export enum ProductionProtocol {
  Voiceover = 'Voiceover',
  Podcast = 'Podcast',
  Cinematic = 'Cinematic'
}

export interface UserProfile {
  username: string;
  avatarSeed: string;
  joinedDate: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  lastModified: number;
  progress: number;
  thumbnailUrl?: string;
  state: ProjectState;
}

export interface ProjectState {
  activeView: ActiveView;
  storyIdeasKeywords: string;
  generatedStoryIdeas: StoryIdea[];
  selectedIdeaIds: string[];
  si_proSettingsEnabled: boolean;
  si_proSettings: ProStorySettings;
  storyForScripting: StoryIdea | null;
  sw_scriptOutline: string;
  sw_generatedScript: string;
  sw_episodeScripts: Record<string, string>; 
  sw_selectedScriptType: ScriptType;
  simg_sceneImageDefinitions: SceneImageDefinition[];
  simg_globalImageStylePrompt: string;
  tts_editableScript: string;
  tts_defaultVoiceKey: PresetVoiceKey;
  tts_characterVoicePresets: Record<string, CharacterVoicePreset>;
  tcg_titleCards: TitleCardData[];
  ffimg_prompt: string;
  ffimg_generatedImages: GeneratedImage[];
  tm_prompt: string;
  tm_generatedThumbnail: GeneratedImage | null;
  analyzedScriptData: AIAnalyzedScript | null;
}

export interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ReactNode;
}

export interface GeneratedImage {
  id: string;
  src: string;
  prompt: string;
  isVideo?: boolean;
  mimeType?: string;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  gender: string;
  personality: string;
  physicalDescription: string;
  refinedPhysicalDescription?: string;
  relationalStatus: string; 
  avatarUrl?: string;
  isGeneratingAvatar?: boolean;
  voicePresetKey?: PresetVoiceKey;
  generationError?: string;
}

export interface SceneImageDefinition {
  sceneNumber: number;
  sceneContentExcerpt: string; 
  aiSuggestedPrompt: string; 
  userEditedPrompt: string; 
  isImageGenerationEnabled: boolean;
  generatedImageUrl?: string;
  generatedVideoUrl?: string; 
  isVideoGenerationEnabled?: boolean; 
  generationError?: string;
  isGenerating?: boolean; 
  timestampMarker?: string; 
  assetType: 'video' | 'image' | 'title_card';
}

export const VIDEO_GENRES = [
  { id: 'explainer_how_to', label: 'Instructional' },
  { id: 'edutainment', label: 'Educational' },
  { id: 'storytelling_narrative', label: 'Storytelling' },
  { id: 'true_crime_mysteries', label: 'True Crime' },
  { id: 'podcast_style_video', label: 'Podcast' },
  { id: 'comedy_skit', label: 'Comedy' },
  { id: 'documentary_short', label: 'Documentary' },
] as const;

export type VideoGenreId = typeof VIDEO_GENRES[number]['id'];

export const STORY_SUB_GENRES = [
  { id: 'unselected', label: 'Select Category...' },
  { id: 'general', label: 'General' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'sci_fi', label: 'Sci-Fi' },
  { id: 'mystery', label: 'Mystery' },
  { id: 'horror', label: 'Horror' },
  { id: 'romance', label: 'Romance' },
  { id: 'drama', label: 'Drama' },
] as const;
export type StorySubGenreId = typeof STORY_SUB_GENRES[number]['id'];

export interface ProStorySettings {
  subGenre: StorySubGenreId;
  characters: CharacterDefinition[];
  primarySetting: string; 
  incitingIncidentIdea: string; 
  explicitnessLevel: string;
  aPlot?: string; 
  bPlot?: string; 
  cPlot?: string; 
  productionProtocol: ProductionProtocol;
  videoBudget: number;
  realisticImages: boolean;
  sourceFile?: { name: string; data: string; mimeType: string };
}

export interface StoryIdea {
  id: string;
  title: string;
  description: string;
  originalKeywords?: string;
  suggestedGenres?: VideoGenreId[];
  videoStructure?: 'standalone' | 'episodic';
  seriesConcept?: string | null;
  proSettingsUsed?: ProStorySettings; 
  isSeriesConcept?: boolean;
  parentSeriesTitle?: string;
  episodeNumber?: number;
}

export enum ScriptType {
  SingleVoice = 'SingleVoice',
  TwoVoice = 'TwoVoice',
  MultiVoice = 'MultiVoice',
}

export type PresetVoiceKey =
  | 'Narrator_F'
  | 'Narrator_M'
  | 'Friendly_F'
  | 'Friendly_M'
  | 'Professional_M'
  | 'Young_F' 
  | 'Young_M'; 

export interface PresetVoiceConfig {
  key: PresetVoiceKey;
  name: string;
  displayName: string;
  languageCode: string;
  ssmlGender: string;
  type: string;
}

export interface CharacterVoicePreset {
  assignedVoiceKey: PresetVoiceKey | null; 
}

export interface AIAnalyzedScene {
  sceneNumber: number;
  description: string;
  visualPrompt: string;
  charactersInScene: string[];
  dialogue: Array<{
    speaker: string;
    text: string;
  }>;
  assetType?: 'video' | 'image' | 'title_card';
  timestamp?: string;
}

export interface AIAnalyzedScript {
  scenes: AIAnalyzedScene[];
  allCharacters: string[];
}

export interface SynthesizedChunk {
  id: string;
  audioDataUrl: string; 
  sceneNumbers: number[];
  downloadFilename: string;
}

export interface TitleCardData {
  id: string;
  src: string; 
  prompt: string; 
  titleText: string;
  subtitleText?: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}
