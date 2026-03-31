
import { PresetVoiceKey, PresetVoiceConfig } from "./types";

export const GEMINI_TEXT_MODEL = 'gemini-3-flash-preview';
export const GEMINI_ANALYSIS_MODEL = 'gemini-3.1-pro-preview';
export const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
export const GEMINI_VIDEO_MODEL = 'veo-3.1-fast-generate-preview';

export const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';
export const API_KEY_MISSING_MESSAGE = 'API Key is missing. Please check your settings.';

export const STORY_IDEAS_PLACEHOLDER = "Enter a topic like 'A documentary on marine life' or 'A true crime mystery about a missing painting'.";
export const SCRIPT_WRITER_PLACEHOLDER = "Outline your script here. Include characters, key locations, and main events.";
export const SCENE_IMAGE_GLOBAL_STYLE_PLACEHOLDER = "e.g., 'Realistic 8k photography', 'Cinematic lighting', 'Anime style'";

export const IMAGE_GENERATOR_PLACEHOLDER = "Describe the image you want to create...";
export const THUMBNAIL_MAKER_PLACEHOLDER = "Describe your YouTube thumbnail idea...";
export const GCP_TTS_API_KEY_MISSING_MESSAGE = "TTS configuration error.";

export const PRESET_VOICES_CONFIG: Record<PresetVoiceKey, PresetVoiceConfig> = {
  Narrator_F: { key: 'Narrator_F', name: 'Aoede', displayName: "Female - Warm Adult (American)", languageCode: 'en-US', ssmlGender: 'FEMALE', type: "Gemini" },
  Narrator_M: { key: 'Narrator_M', name: 'Fenrir', displayName: "Male - Deep Adult (American)", languageCode: 'en-US', ssmlGender: 'MALE', type: "Gemini" },
  Friendly_F: { key: 'Friendly_F', name: 'Kore', displayName: "Female - Friendly Youth (American)", languageCode: 'en-US', ssmlGender: 'FEMALE', type: "Gemini" },
  Friendly_M: { key: 'Friendly_M', name: 'Puck', displayName: "Male - Enthusiastic Youth (American)", languageCode: 'en-US', ssmlGender: 'MALE', type: "Gemini" },
  Professional_M: { key: 'Professional_M', name: 'Charon', displayName: "Male - Sophisticated Adult (British)", languageCode: 'en-GB', ssmlGender: 'MALE', type: "Gemini" },
  Calm_F: { key: 'Calm_F', name: 'Zephyr', displayName: "Female - Calm Adult (American)", languageCode: 'en-US', ssmlGender: 'FEMALE', type: "Gemini" },
};

export const PRESET_VOICE_KEYS_ORDERED: PresetVoiceKey[] = [
  'Narrator_F', 'Narrator_M', 'Friendly_F', 'Friendly_M', 'Professional_M', 'Calm_F'
];
