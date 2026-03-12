
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { StoryIdea, ScriptType, VideoGenreId, ProStorySettings, AIAnalyzedScript, CharacterVoicePreset, PresetVoiceKey } from "../types.ts";

const getFns = () => getFunctions(getApp(), "us-central1");

// ─── WAV encoding helpers (kept client-side — CF returns raw PCM) ────────────

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function createWavBlobUrl(base64Pcm: string, sampleRate: number): string {
  const binaryString = atob(base64Pcm);
  const pcmData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    pcmData[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const pcmArray = new Uint8Array(buffer, 44);
  pcmArray.set(pcmData);

  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

// ─── generateStoryIdeas ──────────────────────────────────────────────────────

export const generateStoryIdeas = async (
  keywords: string,
  genres: VideoGenreId[],
  videoStructure: "standalone" | "episodic",
  proSettings?: ProStorySettings,
  variationCount: number = 5
): Promise<StoryIdea[]> => {
  const fn = httpsCallable<unknown, { ideas: StoryIdea[] }>(getFns(), "generateStoryIdeas");
  const result = await fn({ keywords, genres, videoStructure, proSettings, variationCount });
  return result.data.ideas;
};

// ─── generateScript ──────────────────────────────────────────────────────────

export const generateScript = async (
  outline: string,
  scriptType: ScriptType,
  story?: StoryIdea
): Promise<string> => {
  const fn = httpsCallable<unknown, { text: string }>(getFns(), "generateScript");
  const result = await fn({ outline, scriptType, story });
  return result.data.text;
};

// ─── analyzeScript ───────────────────────────────────────────────────────────

export const analyzeScript = async (
  fullScript: string,
  characterDefinitions: any[] = []
): Promise<AIAnalyzedScript> => {
  const fn = httpsCallable<unknown, AIAnalyzedScript>(getFns(), "analyzeScript", { timeout: 120000 });
  const result = await fn({ fullScript, characterDefinitions });
  return result.data;
};

// ─── analyzeCharacterAvatar ──────────────────────────────────────────────────

export const analyzeCharacterAvatar = async (
  imageBase64: string,
  characterName: string
): Promise<string> => {
  const fn = httpsCallable<unknown, { text: string }>(getFns(), "analyzeCharacterAvatar");
  const result = await fn({ imageBase64, characterName });
  return result.data.text;
};

// ─── generateSpeech ──────────────────────────────────────────────────────────
// CF returns raw base64 PCM. WAV encoding happens here on the client.

export const generateSpeech = async (
  dialogueItems: Array<{ speaker: string; text: string }>,
  _voicePresets: Record<string, CharacterVoicePreset>,
  defaultVoiceKey: PresetVoiceKey = "Narrator_M"
): Promise<string> => {
  const fn = httpsCallable<unknown, { base64Pcm: string; sampleRate: number }>(
    getFns(),
    "generateSpeech",
    { timeout: 120000 }
  );
  const result = await fn({ dialogueItems, defaultVoiceKey });
  return createWavBlobUrl(result.data.base64Pcm, result.data.sampleRate);
};

// ─── generateImageForPrompt ──────────────────────────────────────────────────

export const generateImageForPrompt = async (
  prompt: string,
  realistic: boolean = false
): Promise<string> => {
  const fn = httpsCallable<unknown, { base64: string }>(getFns(), "generateImage", { timeout: 120000 });
  const result = await fn({ prompt, realistic });
  return `data:image/png;base64,${result.data.base64}`;
};

// ─── generateVideoForPrompt ──────────────────────────────────────────────────
// Phase 2 stub — CF throws unimplemented. Surfaces a clear user-facing error.

export const generateVideoForPrompt = async (
  _prompt: string,
  _res: "720p" | "1080p" = "1080p",
  _img?: string
): Promise<string> => {
  throw new Error("Video generation is coming in Phase 2. Use image generation for now.");
};
