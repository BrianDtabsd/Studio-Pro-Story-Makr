import {
  StoryIdea,
  ScriptType,
  VideoGenreId,
  ProStorySettings,
  AIAnalyzedScript,
  PresetVoiceKey,
  CharacterDefinition,
} from "../types.ts";
import { getStoryMakrCallableNames, getStoryMakrFunctionsMode, type StoryMakrCallableKey } from "../appConfig.ts";
import { makeCallable } from "./firebaseFunctions.ts";

const getCallableName = (key: StoryMakrCallableKey): string => {
  const callableName = getStoryMakrCallableNames()[key];
  if (typeof callableName !== "string") {
    throw new Error(`Callable name for "${key}" is missing.`);
  }
  const trimmed = callableName.trim();
  if (!trimmed || trimmed.toLowerCase() === "undefined" || trimmed.toLowerCase() === "null") {
    throw new Error(`Callable name for "${key}" is invalid: "${callableName}".`);
  }
  return trimmed;
};

const ensureCloudFunctionsEnabled = () => {
  const mode = getStoryMakrFunctionsMode();
  if (mode === "off") {
    throw new Error(
      "STORYMAKR_AI_MODE is 'off'. This build is Cloud-Functions-only. Set STORYMAKR_AI_MODE to 'strict' or 'fallback'."
    );
  }
};

const asMessage = (error: unknown): string => {
  if (error instanceof Error && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

const fail = (prefix: string, error: unknown): never => {
  throw new Error(`${prefix} ${asMessage(error)}`.trim());
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  typeof value === "object" && value !== null ? (value as UnknownRecord) : null;

const readStringFromRecord = (record: UnknownRecord | null, key: string): string | null => {
  if (!record) return null;
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

const readNestedRecord = (record: UnknownRecord | null, key: string): UnknownRecord | null =>
  asRecord(record ? record[key] : null);

const readBase64 = (data: unknown): string | null => {
  const root = asRecord(data);
  return (
    readStringFromRecord(root, "base64") ||
    readStringFromRecord(root, "imageBase64") ||
    readStringFromRecord(readNestedRecord(root, "data"), "base64")
  );
};

const readUrl = (data: unknown): string | null => {
  const root = asRecord(data);
  return (
    readStringFromRecord(root, "url") ||
    readStringFromRecord(root, "videoUrl") ||
    readStringFromRecord(root, "resultUrl") ||
    readStringFromRecord(readNestedRecord(root, "data"), "url")
  );
};

const call = <Req, Res>(key: StoryMakrCallableKey, timeout?: number) =>
  makeCallable<Req, Res>(getCallableName(key), timeout ? { timeout } : undefined);

interface StoryIdeasResponse {
  ideas?: unknown;
}

const ensureIdeas = (data: StoryIdeasResponse): StoryIdea[] => {
  const ideas = data.ideas;
  if (!Array.isArray(ideas)) {
    throw new Error("Callable returned no ideas array.");
  }
  return ideas as StoryIdea[];
};

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
  ensureCloudFunctionsEnabled();
  try {
    const fn = call<unknown, { ideas: StoryIdea[] }>("generateStoryIdeas");
    const result = await fn({ keywords, genres, videoStructure, proSettings, variationCount });
    return ensureIdeas(result.data);
  } catch (error) {
    fail("Story idea generation failed.", error);
  }
};

// ─── generateScript ──────────────────────────────────────────────────────────

export const generateScript = async (
  outline: string,
  scriptType: ScriptType,
  story?: StoryIdea
): Promise<string> => {
  ensureCloudFunctionsEnabled();
  try {
    const fn = call<unknown, { text: string }>("generateScript");
    const result = await fn({ outline, scriptType, story });
    if (typeof result.data?.text !== "string") {
      throw new Error("Callable returned no script text.");
    }
    return result.data.text;
  } catch (error) {
    fail("Script generation failed.", error);
  }
};

// ─── analyzeScript ───────────────────────────────────────────────────────────

export const analyzeScript = async (
  fullScript: string,
  characterDefinitions: CharacterDefinition[] = []
): Promise<AIAnalyzedScript> => {
  ensureCloudFunctionsEnabled();
  try {
    const fn = call<unknown, AIAnalyzedScript>("analyzeScript", 120000);
    const result = await fn({ fullScript, characterDefinitions });
    return result.data;
  } catch (error) {
    fail("Script analysis failed.", error);
  }
};

// ─── analyzeCharacterAvatar ──────────────────────────────────────────────────

export const analyzeCharacterAvatar = async (
  imageBase64: string,
  characterName: string
): Promise<string> => {
  ensureCloudFunctionsEnabled();
  try {
    const fn = call<unknown, { text: string }>("analyzeCharacterAvatar");
    const result = await fn({ imageBase64, characterName });
    if (typeof result.data?.text !== "string") {
      throw new Error("Callable returned no avatar analysis text.");
    }
    return result.data.text;
  } catch (error) {
    fail("Avatar analysis failed.", error);
  }
};

// ─── generateSpeech ──────────────────────────────────────────────────────────
// CF returns raw base64 PCM. WAV encoding happens here on the client.

export const generateSpeech = async (
  dialogueItems: Array<{ speaker: string; text: string }>,
  _voicePresets: Record<string, unknown>,
  defaultVoiceKey: PresetVoiceKey = "Narrator_M"
): Promise<string> => {
  ensureCloudFunctionsEnabled();
  try {
    const fn = call<unknown, { base64Pcm: string; sampleRate: number }>("generateSpeech", 120000);
    const result = await fn({ dialogueItems, defaultVoiceKey });
    if (typeof result.data?.base64Pcm !== "string" || result.data.base64Pcm.length === 0) {
      throw new Error("Callable returned no PCM audio.");
    }
    return createWavBlobUrl(result.data.base64Pcm, result.data.sampleRate || 24000);
  } catch (error) {
    fail("Speech generation failed.", error);
  }
};

// ─── generateImageForPrompt ──────────────────────────────────────────────────

export const generateImageForPrompt = async (
  prompt: string,
  realistic: boolean = false
): Promise<string> => {
  ensureCloudFunctionsEnabled();
  try {
    const fn = call<unknown, { base64?: string; imageBase64?: string }>("generateImageForPrompt", 120000);
    const result = await fn({ prompt, realistic });
    const base64 = readBase64(result.data);
    if (!base64) {
      throw new Error("Callable returned no image base64.");
    }
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    fail("Image generation failed.", error);
  }
};

// ─── generateVideoForPrompt ──────────────────────────────────────────────────
export const generateVideoForPrompt = async (
  prompt: string,
  res: "720p" | "1080p" = "1080p",
  img?: string
): Promise<string> => {
  ensureCloudFunctionsEnabled();
  try {
    const fn = call<
      { prompt: string; resolution: "720p" | "1080p"; imageUrl?: string },
      { url?: string; videoUrl?: string; resultUrl?: string; data?: { url?: string } }
    >("generateVideoForPrompt", 300000);
    const result = await fn({ prompt, resolution: res, imageUrl: img });
    const url = readUrl(result.data);
    if (!url) {
      throw new Error("Callable returned no video URL.");
    }
    return url;
  } catch (error) {
    fail("Video generation failed.", error);
  }
};
