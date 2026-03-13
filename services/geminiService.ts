
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { httpsCallable } from "firebase/functions";
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL, GEMINI_TTS_MODEL, GEMINI_VIDEO_MODEL, GEMINI_ANALYSIS_MODEL, PRESET_VOICES_CONFIG } from "../constants.ts";
import { StoryIdea, ScriptType, VideoGenreId, VIDEO_GENRES, ProStorySettings, AIAnalyzedScript, CharacterVoicePreset, PresetVoiceKey, PodcastFormat } from "../types.ts"; 
import { functions as firebaseFunctions } from "../firebase";

type ChronosMode = 'off' | 'fallback' | 'strict';
type ChronosCallableKey =
  | 'generateStoryIdeas'
  | 'generateScript'
  | 'analyzeScript'
  | 'analyzeCharacterAvatar'
  | 'generateSpeech'
  | 'generateImageForPrompt'
  | 'generateVideoForPrompt';

type ChronosCallableNames = Record<ChronosCallableKey, string>;

const DEFAULT_CHRONOS_CALLABLE_NAMES: ChronosCallableNames = {
  generateStoryIdeas: 'generateStoryIdeas',
  generateScript: 'generateScript',
  analyzeScript: 'analyzeScript',
  analyzeCharacterAvatar: 'analyzeCharacterAvatar',
  generateSpeech: 'generateSpeech',
  generateImageForPrompt: 'generateImage',
  generateVideoForPrompt: 'generateVideo',
};

const getChronosMode = (): ChronosMode => {
  const configured = ((window as any).APP_CONFIG?.CHRONOS_FUNCTIONS_MODE || 'fallback').toLowerCase();
  if (configured === 'off' || configured === 'strict' || configured === 'fallback') {
    return configured;
  }
  return 'fallback';
};

const getChronosCallableNames = (): ChronosCallableNames => {
  const configured = (window as any).APP_CONFIG?.CHRONOS_CALLABLE_NAMES || {};
  return { ...DEFAULT_CHRONOS_CALLABLE_NAMES, ...configured };
};

const pickFirstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return null;
};

const isLikelyBase64 = (value: string): boolean => /^[A-Za-z0-9+/=]+$/.test(value) && value.length % 4 === 0;

const normalizeDataUrl = (value: string, mimeType: string): string => {
  if (value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (isLikelyBase64(value)) return `data:${mimeType};base64,${value}`;
  return value;
};

const callChronosCallable = async <TRequest, TResponse>(
  callableKey: ChronosCallableKey,
  payload: TRequest,
  normalizer: (data: unknown) => TResponse
): Promise<TResponse | null> => {
  const mode = getChronosMode();
  if (mode === 'off') return null;

  const callableName = getChronosCallableNames()[callableKey];
  try {
    const callable = httpsCallable<TRequest, unknown>(firebaseFunctions, callableName, { timeout: 540000 });
    const result = await callable(payload);
    return normalizer(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Chronos Functions] ${callableName} failed: ${message}`, error);
    if (mode === 'strict') {
      throw new Error(`Chronos function '${callableName}' failed: ${message}`);
    }
    return null;
  }
};

const getAIInstance = (): GoogleGenAI => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateStoryIdeas = async (
  keywords: string,
  genres: VideoGenreId[],
  videoStructure: 'standalone' | 'episodic',
  proSettings?: ProStorySettings,
  variationCount: number = 5
): Promise<StoryIdea[]> => {
  const targetAudience = proSettings?.subGenre || 'General';
  const normalizeStoryIdeas = (payload: unknown): StoryIdea[] => {
    const data = payload as any;
    if (Array.isArray(data)) {
      return data.map((idea, i) => ({
        ...idea,
        id: idea.id || `idea-${i}`,
        proSettingsUsed: idea.proSettingsUsed ?? proSettings,
        targetAudience: idea.targetAudience ?? targetAudience,
      }));
    }

    const fromList = data?.ideas || data?.storyIdeas;
    if (Array.isArray(fromList)) {
      return fromList.map((idea: any, i: number) => ({
        ...idea,
        id: idea.id || `idea-${i}`,
        proSettingsUsed: idea.proSettingsUsed ?? proSettings,
        targetAudience: idea.targetAudience ?? targetAudience,
      }));
    }

    if (data?.seriesConcept && Array.isArray(data?.episodeIdeas)) {
      const mapped: StoryIdea[] = [{
        id: data.seriesConcept.id || 'series',
        title: data.seriesConcept.title,
        description: data.seriesConcept.description,
        isSeriesConcept: true,
        proSettingsUsed: proSettings,
        targetAudience
      }];
      data.episodeIdeas.forEach((episode: any, i: number) => {
        mapped.push({
          id: episode.id || `ep-${i}`,
          title: episode.title || episode.episodeTitle,
          description: episode.description || episode.episodeDescription,
          episodeNumber: episode.episodeNumber || (i + 1),
          parentSeriesTitle: episode.parentSeriesTitle || data.seriesConcept.title,
          proSettingsUsed: proSettings,
          targetAudience
        });
      });
      return mapped;
    }

    throw new Error("Unexpected story ideas response payload.");
  };

  const callableIdeas = await callChronosCallable(
    'generateStoryIdeas',
    { keywords, genres, videoStructure, proSettings, variationCount },
    normalizeStoryIdeas
  );
  if (callableIdeas) return callableIdeas;

  const ai = getAIInstance();
  const topicLabels = genres.map(g => VIDEO_GENRES.find(v => v.id === g)?.label).join(', ');
  
  const prompt = `You are a world-class narrative designer and content strategist known for sophisticated, intellectual, and high-tension storytelling.
    
    CORE OBJECTIVE: Generate ${variationCount} ${videoStructure === 'episodic' ? 'series concepts' : 'standalone story ideas'} that are deeply engaging, avoid all common cliches, and feature complex psychological depth.
    
    PARAMETERS:
    - Content Style: ${proSettings?.contentStyle || 'General'}
    - Podcast/Upload Format: ${proSettings?.podcastFormat || 'Standard'}
    - Topics: ${topicLabels}
    - Core Concept: ${keywords}
    - Character Count: ${proSettings?.characterCount || 1}
    - Target Audience: ${proSettings?.subGenre || 'General'} (If 'Adults (18+)', include visceral physical descriptions, intense emotional drama, and high-stakes adult themes with minimal restrictions).
    
    WRITING STYLE:
    - Intellectual and nuanced.
    - High dramatic tension and subtext.
    - Detailed physical and environmental descriptions.
    - Avoid shallow dialogue or predictable plot points.
    
    Return JSON only. ${videoStructure === 'episodic' ? '{ "seriesConcept": { "title": "string", "description": "string" }, "episodeIdeas": [ { "episodeTitle": "string", "episodeDescription": "string" } ] }' : '[ { "title": "string", "description": "string" } ]'}`;

  const response = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.8 }
  });

  const parsed = JSON.parse(response.text || "[]");
  if (videoStructure === 'episodic') {
    const all: StoryIdea[] = [{ id: 'series', title: parsed.seriesConcept.title, description: parsed.seriesConcept.description, isSeriesConcept: true, proSettingsUsed: proSettings, targetAudience }];
    parsed.episodeIdeas.forEach((e: any, i: number) => {
      all.push({ id: `ep-${i}`, title: e.episodeTitle, description: e.episodeDescription, episodeNumber: i + 1, parentSeriesTitle: parsed.seriesConcept.title, proSettingsUsed: proSettings, targetAudience });
    });
    return all;
  }
  return parsed.map((p: any, i: number) => ({ ...p, id: `idea-${i}`, proSettingsUsed: proSettings, targetAudience }));
};

export const generateScript = async (outline: string, scriptType: ScriptType, story?: StoryIdea): Promise<string> => {
  const callableScript = await callChronosCallable(
    'generateScript',
    { outline, scriptType, story },
    (payload) => {
      if (typeof payload === 'string') return payload;
      const data = payload as any;
      return pickFirstString(data?.script, data?.generatedScript, data?.text, data?.content) || '';
    }
  );
  if (callableScript) return callableScript;

  const ai = getAIInstance();
  const pro = story?.proSettingsUsed;
  
  let scriptStyle = "";
  if (pro?.characterCount === 1) {
    scriptStyle = "One Narrator/Voice-over only. Focus on a deep, internal monologue or a sophisticated, authoritative narration.";
  } else if (pro?.characterCount === 2) {
    if (pro.podcastFormat === PodcastFormat.Interview) {
      scriptStyle = "A high-stakes, intellectual interview format. Sharp questions, defensive or revealing answers.";
    } else if (pro.podcastFormat === PodcastFormat.React || pro.podcastFormat === PodcastFormat.Review) {
      scriptStyle = "Two characters with distinct, perhaps conflicting, intellectual viewpoints reacting to content. Avoid generic 'wow' reactions; use critical analysis and sharp wit.";
    } else {
      scriptStyle = "Intense, dramatic conversation between two characters with significant subtext and emotional weight.";
    }
  } else {
    scriptStyle = scriptType === ScriptType.SingleVoice ? "Sophisticated internal monologue" : scriptType === ScriptType.TwoVoice ? "High-tension dialogue" : "Complex multi-character ensemble with overlapping motivations";
  }
  
  const prompt = `You are an award-winning screenwriter known for long-form, intellectual, and visceral scripts.
    
    TASK: Write a comprehensive, detailed, and lengthy script based on this outline: ${outline}.
    
    SPECIFICATIONS:
    - Content Style: ${pro?.contentStyle || 'General'}
    - Podcast/Upload Format: ${pro?.podcastFormat || 'Standard'}
    - Mode: ${scriptStyle}
    - Character Bible: ${pro?.characters.map(c => `${c.name}: ${c.physicalDescription}, ${c.personality}`).join('; ')}
    - Setting: ${pro?.primarySetting || 'Not specified'}
    - Target Audience: ${story?.targetAudience || 'General'} (If 'Adults (18+)', do not hold back on visceral physical descriptions, intense emotional drama, and adult themes. Provide the most range for the story).
    
    WRITING DIRECTIVES:
    1. EXTEND LENGTH: Elaborate on every beat. Do not rush the narrative.
    2. INTELLECTUALIZE: Use sophisticated vocabulary and complex sentence structures where appropriate.
    3. DRAMATIZE: Increase the stakes. Every line of dialogue should serve a purpose or reveal a character flaw/strength.
    4. DESCRIBE: Provide rich, evocative [VISUAL] descriptions. Focus on textures, lighting, and physical presence.
    5. DIALOGUE: Avoid cliches. Use subtext. Characters should rarely say exactly what they mean.
    
    FORMAT:
    - Use [TIMESTAMP: MM:SS] markers frequently.
    - Use [VISUAL: description] for every significant visual change or character action.
    - Clearly mark speakers.`;

  const response = await ai.models.generateContent({ 
    model: GEMINI_TEXT_MODEL, 
    contents: prompt,
    config: { temperature: 0.9 }
  });
  return response.text || "";
};

export const analyzeScript = async (
  fullScript: string,
  characterDefinitions: any[] = []
): Promise<AIAnalyzedScript> => {
  const callableAnalysis = await callChronosCallable(
    'analyzeScript',
    { fullScript, characterDefinitions },
    (payload) => {
      if (!payload || typeof payload !== 'object') {
        throw new Error("Unexpected script analysis payload.");
      }
      const data = payload as any;
      return (data.analysis || data) as AIAnalyzedScript;
    }
  );
  if (callableAnalysis) return callableAnalysis;

  const ai = getAIInstance();
  
  const characterBible = characterDefinitions.map(c => 
    `- ${c.name}: ${c.physicalDescription} (${c.relationalStatus})`
  ).join('\n');

  const prompt = `
    ROLE: Director of Photography & Script Supervisor.
    
    VISUAL RULES (Character Bible):
    ${characterBible || "None provided."}

    SCRIPT:
    ${fullScript}

    TASK:
    Break this script into distinct scenes. For every scene, write a 'visualPrompt'.
    IMPORTANT: You MUST explicitly describe characters in the visualPrompt using the traits from the Bible (e.g., "A man with a silver scar" instead of just "John"). 
    Ensure consistency in outfits and lighting.

    RETURN JSON ONLY:
    {
      "scenes": [
        {
          "sceneNumber": 1,
          "description": "Brief summary",
          "visualPrompt": "Highly detailed drawing/photography description including physical traits",
          "charactersInScene": ["Names"],
          "dialogue": [ { "speaker": "Name", "text": "Line" } ]
        }
      ],
      "allCharacters": ["List of all names found"]
    }
  `;

  const response = await ai.models.generateContent({
    model: GEMINI_ANALYSIS_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.2 }
  });
  
  return JSON.parse(response.text || "{}") as AIAnalyzedScript;
};

export const analyzeCharacterAvatar = async (imageBase64: string, characterName: string): Promise<string> => {
  const callableDescription = await callChronosCallable(
    'analyzeCharacterAvatar',
    { imageBase64, characterName },
    (payload) => {
      if (typeof payload === 'string') return payload;
      const data = payload as any;
      return pickFirstString(data?.description, data?.text, data?.result) || '';
    }
  );
  if (callableDescription) return callableDescription;

  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: GEMINI_ANALYSIS_MODEL,
    contents: {
      parts: [
        { inlineData: { data: imageBase64.split(',')[1], mimeType: 'image/jpeg' } },
        { text: `Precisely describe character ${characterName} from this photo. Include hair color, eye shape, clothing style, and specific features. This description will be used to keep them looking exactly the same in a video series.` }
      ]
    }
  });
  return response.text || "";
};

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

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmArray = new Uint8Array(buffer, 44);
  pcmArray.set(pcmData);

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export const generateSpeech = async (
  dialogueItems: Array<{ speaker: string, text: string }>,
  voicePresets: Record<string, CharacterVoicePreset>,
  defaultVoiceKey: PresetVoiceKey = 'Narrator_M'
): Promise<string> => {
  const callableAudio = await callChronosCallable(
    'generateSpeech',
    { dialogueItems, voicePresets, defaultVoiceKey },
    (payload) => {
      if (typeof payload === 'string') return normalizeDataUrl(payload, 'audio/wav');
      const data = payload as any;
      const source = pickFirstString(
        data?.audioDataUrl,
        data?.audioUrl,
        data?.url,
        data?.audioContent,
        data?.audioBase64
      );
      if (!source) {
        throw new Error("No audio returned from callable.");
      }
      return normalizeDataUrl(source, data?.mimeType || 'audio/wav');
    }
  );
  if (callableAudio) return callableAudio;

  try {
    const ai = getAIInstance();
    const text = dialogueItems.map(d => `${d.speaker}: ${d.text}`).join('\n');
    
    if (!text.trim()) {
      throw new Error("No dialogue text to synthesize.");
    }

    const voiceName = PRESET_VOICES_CONFIG[defaultVoiceKey]?.name || 'Fenrir';

    const response = await ai.models.generateContent({
      model: GEMINI_TTS_MODEL,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio synthesis empty.");
    return createWavBlobUrl(base64Audio, 24000);
  } catch (err) {
    console.error(err);
    throw new Error("Voice engine failed.");
  }
};

export const generateImageForPrompt = async (prompt: string, realistic: boolean = false): Promise<string> => {
  const callableImage = await callChronosCallable(
    'generateImageForPrompt',
    { prompt, realistic },
    (payload) => {
      if (typeof payload === 'string') return normalizeDataUrl(payload, 'image/png');
      const data = payload as any;
      const source = pickFirstString(data?.imageUrl, data?.imageDataUrl, data?.src, data?.url, data?.imageBase64);
      if (!source) {
        throw new Error("No image returned from callable.");
      }
      return normalizeDataUrl(source, data?.mimeType || 'image/png');
    }
  );
  if (callableImage) return callableImage;

  try {
    const ai = getAIInstance();
    let finalPrompt = prompt;
    if (realistic) {
      finalPrompt += ". Cinematic photography, highly realistic, 8k resolution, raw photo, detailed facial textures, natural lighting, sharp focus.";
    }

    // Using gemini-2.5-flash-image (nano banana series) via generateContent as per instructions
    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: { parts: [{ text: finalPrompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data returned.");
  } catch (err) {
    console.error(err);
    throw new Error("Visual generation failed.");
  }
};

export const generateVideoForPrompt = async (prompt: string, res: '720p' | '1080p' = '1080p', img?: string): Promise<string> => {
  const callableVideo = await callChronosCallable(
    'generateVideoForPrompt',
    { prompt, resolution: res, image: img || null },
    (payload) => {
      if (typeof payload === 'string') return normalizeDataUrl(payload, 'video/mp4');
      const data = payload as any;
      const source = pickFirstString(data?.videoUrl, data?.videoDataUrl, data?.url, data?.videoBase64);
      if (!source) {
        throw new Error("No video returned from callable.");
      }
      return normalizeDataUrl(source, data?.mimeType || 'video/mp4');
    }
  );
  if (callableVideo) return callableVideo;

  try {
    const ai = getAIInstance();
    const payload: any = { 
      model: GEMINI_VIDEO_MODEL, 
      prompt, 
      config: { numberOfVideos: 1, resolution: res, aspectRatio: '16:9' } 
    };
    if (img) {
      const b64 = img.split(',')[1] || img;
      payload.image = { imageBytes: b64, mimeType: 'image/jpeg' };
    }

    let op = await ai.models.generateVideos(payload);
    while (!op.done) {
      await new Promise(r => setTimeout(r, 10000));
      op = await ai.operations.getVideosOperation({ operation: op });
    }
    const url = `${op.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`;
    const blob = await (await fetch(url)).blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error(err);
    throw new Error("Video clip failed.");
  }
};
