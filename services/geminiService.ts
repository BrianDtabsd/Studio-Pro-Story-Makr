
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { GoogleGenAI, Modality } from "@google/genai";
import {
  GEMINI_TEXT_MODEL,
  GEMINI_ANALYSIS_MODEL,
  GEMINI_TTS_MODEL,
  GEMINI_IMAGE_MODEL,
  PRESET_VOICES_CONFIG,
} from "../constants.ts";
import {
  StoryIdea,
  ScriptType,
  VideoGenreId,
  VIDEO_GENRES,
  ProStorySettings,
  AIAnalyzedScript,
  CharacterVoicePreset,
  PresetVoiceKey,
  PodcastFormat,
} from "../types.ts";

const getFns = () => getFunctions(getApp(), "us-central1");
const getAIInstance = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Fallback AI key missing. Set GEMINI_API_KEY in .env.local.");
  }
  return new GoogleGenAI({ apiKey });
};

const getCallableCode = (error: unknown): string => {
  const raw = typeof (error as { code?: unknown })?.code === "string"
    ? String((error as { code?: string }).code)
    : "";
  const normalized = raw.toLowerCase();
  return normalized.startsWith("functions/")
    ? normalized.replace("functions/", "")
    : normalized;
};

const shouldFallbackToDirect = (error: unknown): boolean => {
  const code = getCallableCode(error);
  return (
    code === "internal" ||
    code === "unavailable" ||
    code === "permission-denied" ||
    code === "unauthenticated" ||
    code === "deadline-exceeded" ||
    code === "resource-exhausted" ||
    code === "unknown" ||
    code === "not-found"
  );
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
  try {
    const fn = httpsCallable<unknown, { ideas: StoryIdea[] }>(getFns(), "generateStoryIdeas");
    const result = await fn({ keywords, genres, videoStructure, proSettings, variationCount });
    return result.data.ideas;
  } catch (error) {
    if (!shouldFallbackToDirect(error)) throw error;
  }

  const ai = getAIInstance();
  const topicLabels = genres.map(g => VIDEO_GENRES.find(v => v.id === g)?.label).join(", ");
  const prompt = `You are a world-class narrative designer and content strategist known for sophisticated, high-tension storytelling.

CORE OBJECTIVE: Generate ${variationCount} ${videoStructure === "episodic" ? "series concepts" : "standalone story ideas"} that are deeply engaging and avoid generic cliches.

PARAMETERS:
- Content Style: ${proSettings?.contentStyle || "General"}
- Podcast/Upload Format: ${proSettings?.podcastFormat || "Standard"}
- Topics: ${topicLabels}
- Core Concept: ${keywords}
- Character Count: ${proSettings?.characterCount || 1}
- Target Audience: ${proSettings?.subGenre || "General"}

WRITING STYLE:
- Nuanced, cinematic, clear, and production-ready.
- High dramatic tension and concrete scene hooks.
- Strong visual framing and conflict.

Return JSON only. ${videoStructure === "episodic"
    ? '{ "seriesConcept": { "title": "string", "description": "string" }, "episodeIdeas": [ { "episodeTitle": "string", "episodeDescription": "string" } ] }'
    : '[ { "title": "string", "description": "string" } ]'
  }`;

  const response = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.8 }
  });

  const parsed = JSON.parse(response.text || "[]");
  const targetAudience = proSettings?.subGenre || "General";
  if (videoStructure === "episodic") {
    const all: StoryIdea[] = [{
      id: "series",
      title: parsed.seriesConcept.title,
      description: parsed.seriesConcept.description,
      isSeriesConcept: true,
      proSettingsUsed: proSettings,
      targetAudience
    }];
    parsed.episodeIdeas.forEach((e: { episodeTitle: string; episodeDescription: string }, i: number) => {
      all.push({
        id: `ep-${i}`,
        title: e.episodeTitle,
        description: e.episodeDescription,
        episodeNumber: i + 1,
        parentSeriesTitle: parsed.seriesConcept.title,
        proSettingsUsed: proSettings,
        targetAudience
      });
    });
    return all;
  }
  return parsed.map((p: { title: string; description: string }, i: number) => ({
    ...p,
    id: `idea-${i}`,
    proSettingsUsed: proSettings,
    targetAudience
  }));
};

// ─── generateScript ──────────────────────────────────────────────────────────

export const generateScript = async (
  outline: string,
  scriptType: ScriptType,
  story?: StoryIdea
): Promise<string> => {
  try {
    const fn = httpsCallable<unknown, { text: string }>(getFns(), "generateScript");
    const result = await fn({ outline, scriptType, story });
    return result.data.text;
  } catch (error) {
    if (!shouldFallbackToDirect(error)) throw error;
  }

  const ai = getAIInstance();
  const pro = story?.proSettingsUsed;

  let scriptStyle = "";
  if (pro?.characterCount === 1) {
    scriptStyle = "One Narrator/Voice-over only with rich internal framing.";
  } else if (pro?.characterCount === 2) {
    if (pro.podcastFormat === PodcastFormat.Interview) {
      scriptStyle = "High-stakes interview format with sharp questions and revealing answers.";
    } else if (pro.podcastFormat === PodcastFormat.React || pro.podcastFormat === PodcastFormat.Review) {
      scriptStyle = "Two characters with distinct viewpoints and intelligent reaction analysis.";
    } else {
      scriptStyle = "Intense dramatic conversation with subtext and emotional weight.";
    }
  } else {
    scriptStyle =
      scriptType === ScriptType.SingleVoice
        ? "Sophisticated single voice narrative"
        : scriptType === ScriptType.TwoVoice
          ? "High-tension two-voice dialogue"
          : "Complex multi-character ensemble";
  }

  const prompt = `You are an award-winning screenwriter.

TASK: Write a comprehensive, production-ready script based on this outline:
${outline}

SPECIFICATIONS:
- Content Style: ${pro?.contentStyle || "General"}
- Podcast/Upload Format: ${pro?.podcastFormat || "Standard"}
- Mode: ${scriptStyle}
- Character Bible: ${pro?.characters?.map(c => `${c.name}: ${c.physicalDescription}, ${c.personality}`).join("; ") || "none"}
- Setting: ${pro?.primarySetting || "Not specified"}
- Target Audience: ${story?.targetAudience || "General"}

WRITING DIRECTIVES:
1) Extend narrative beats with clear escalation.
2) Keep dialogue sharp, natural, and subtext-aware.
3) Add concrete [VISUAL] descriptions with lighting/composition cues.
4) Use [TIMESTAMP: MM:SS] markers frequently.
5) Clearly mark speakers for TTS parsing.`;

  const response = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: prompt,
    config: { temperature: 0.85 }
  });
  return response.text || "";
};

// ─── analyzeScript ───────────────────────────────────────────────────────────

export const analyzeScript = async (
  fullScript: string,
  characterDefinitions: any[] = []
): Promise<AIAnalyzedScript> => {
  try {
    const fn = httpsCallable<unknown, AIAnalyzedScript>(getFns(), "analyzeScript", { timeout: 120000 });
    const result = await fn({ fullScript, characterDefinitions });
    return result.data;
  } catch (error) {
    if (!shouldFallbackToDirect(error)) throw error;
  }

  const ai = getAIInstance();
  const characterBible = characterDefinitions.map(c =>
    `- ${c.name}: ${c.physicalDescription || "n/a"} (${c.relationalStatus || "n/a"})`
  ).join("\n");

  const prompt = `ROLE: Director of Photography & Script Supervisor.

VISUAL RULES (Character Bible):
${characterBible || "None provided."}

SCRIPT:
${fullScript}

TASK:
Break this script into distinct scenes. For every scene, write a visualPrompt with consistent character appearance and setting continuity.

RETURN JSON ONLY:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "Brief summary",
      "visualPrompt": "Detailed visual generation prompt",
      "charactersInScene": ["Names"],
      "dialogue": [ { "speaker": "Name", "text": "Line" } ]
    }
  ],
  "allCharacters": ["List of all names found"]
}`;

  const response = await ai.models.generateContent({
    model: GEMINI_ANALYSIS_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.2 }
  });
  return JSON.parse(response.text || "{}") as AIAnalyzedScript;
};

// ─── analyzeCharacterAvatar ──────────────────────────────────────────────────

export const analyzeCharacterAvatar = async (
  imageBase64: string,
  characterName: string
): Promise<string> => {
  try {
    const fn = httpsCallable<unknown, { text: string }>(getFns(), "analyzeCharacterAvatar");
    const result = await fn({ imageBase64, characterName });
    return result.data.text;
  } catch (error) {
    if (!shouldFallbackToDirect(error)) throw error;
  }

  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: GEMINI_ANALYSIS_MODEL,
    contents: {
      parts: [
        { inlineData: { data: imageBase64.split(",")[1], mimeType: "image/jpeg" } },
        { text: `Precisely describe character ${characterName} from this photo for continuity in generated scenes.` }
      ]
    }
  });
  return response.text || "";
};

// ─── generateSpeech ──────────────────────────────────────────────────────────
// CF returns raw base64 PCM. WAV encoding happens here on the client.

export const generateSpeech = async (
  dialogueItems: Array<{ speaker: string; text: string }>,
  _voicePresets: Record<string, CharacterVoicePreset>,
  defaultVoiceKey: PresetVoiceKey = "Narrator_M"
): Promise<string> => {
  try {
    const fn = httpsCallable<unknown, { base64Pcm: string; sampleRate: number }>(
      getFns(),
      "generateSpeech",
      { timeout: 120000 }
    );
    const result = await fn({ dialogueItems, defaultVoiceKey });
    return createWavBlobUrl(result.data.base64Pcm, result.data.sampleRate);
  } catch (error) {
    if (!shouldFallbackToDirect(error)) throw error;
  }

  const text = dialogueItems.map(d => `${d.speaker}: ${d.text}`).join("\n").trim();
  if (!text) throw new Error("No dialogue text to synthesize.");

  const ai = getAIInstance();
  const voiceName = PRESET_VOICES_CONFIG[defaultVoiceKey]?.name || "Fenrir";
  const response = await ai.models.generateContent({
    model: GEMINI_TTS_MODEL,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
    }
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio synthesis returned no data.");
  return createWavBlobUrl(base64Audio, 24000);
};

// ─── generateImageForPrompt ──────────────────────────────────────────────────

export const generateImageForPrompt = async (
  prompt: string,
  realistic: boolean = false
): Promise<string> => {
  try {
    const fn = httpsCallable<unknown, { base64: string }>(getFns(), "generateImage", { timeout: 120000 });
    const result = await fn({ prompt, realistic });
    return `data:image/png;base64,${result.data.base64}`;
  } catch (error) {
    if (!shouldFallbackToDirect(error)) throw error;
  }

  const ai = getAIInstance();
  const finalPrompt = realistic
    ? `${prompt}. Cinematic photography, highly realistic, 8k resolution, natural lighting, sharp focus.`
    : prompt;
  const response = await ai.models.generateContent({
    model: GEMINI_IMAGE_MODEL,
    contents: { parts: [{ text: finalPrompt }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Image generation returned no image data.");
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
