
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
  avatarChoice?: string; // 'initials' | 'preset-0'..'preset-9' | https:// Storage URL
  bio?: string;
  defaultContentStyle?: ContentStyle;
  joinedDate: number;
  isPro?: boolean;
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
  isProUser: boolean;
  storyForScripting: StoryIdea | null;
  sw_scriptOutlines: Record<string, string>; // Map of ideaId -> outline
  sw_generatedScripts: Record<string, string>; // Map of ideaId -> script
  sw_selectedScriptType: ScriptType;
  simg_sceneImageDefinitions: Record<string, SceneImageDefinition[]>; // Map of ideaId -> scenes
  simg_globalImageStylePrompt: string;
  tts_editableScripts: Record<string, string>; // Map of ideaId -> script
  tts_defaultVoiceKey: PresetVoiceKey;
  tts_characterVoicePresets: Record<string, CharacterVoicePreset>;
  tcg_titleCards: Record<string, TitleCardData[]>; // Map of ideaId -> titles
  ffimg_prompt: string;
  ffimg_generatedImages: GeneratedImage[];
  tm_prompt: string;
  tm_generatedThumbnail: GeneratedImage | null;
  analyzedScriptData: Record<string, AIAnalyzedScript | null>; // Map of ideaId -> analysis
  audioChunks: Record<string, SynthesizedChunk[]>; // Map of ideaId -> audio
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
  { id: 'sci_fi', label: 'Sci-Fi' },
  { id: 'explainer', label: 'Explainer' },
  { id: 'instructional', label: 'Instructional' },
  { id: 'educational', label: 'Educational' },
  { id: 'true_crime', label: 'True Crime' },
  { id: 'mystery', label: 'Mystery' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'horror', label: 'Horror' },
  { id: 'romance', label: 'Romance' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'tech', label: 'Tech' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'business', label: 'Business' },
  { id: 'sports', label: 'Sports' },
  { id: 'gaming', label: 'Video Games' },
] as const;

export type VideoGenreId = typeof VIDEO_GENRES[number]['id'];

export enum ContentStyle {
  Comedy = 'Comedy',
  Drama = 'Drama',
  Documentary = 'Documentary',
  Reality = 'Reality',
}

export enum PodcastFormat {
  Recap = 'Recap',
  Review = 'Review',
  React = 'React',
  Interview = 'Interview',
}

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
  contentStyle: ContentStyle;
  topics: VideoGenreId[];
  podcastFormat?: PodcastFormat;
  characterCount: 1 | 2;
  subGenre: StorySubGenreId;
  characters: CharacterDefinition[];
  primarySetting: string; 
  incitingIncidentIdea: string; 
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
  videoGenreId?: VideoGenreId;
  targetAudience?: string;
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
