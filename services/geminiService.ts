
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL, GEMINI_TTS_MODEL, GEMINI_VIDEO_MODEL, GEMINI_ANALYSIS_MODEL, PRESET_VOICES_CONFIG } from "../constants.ts";
import { StoryIdea, ScriptType, VideoGenreId, VIDEO_GENRES, ProStorySettings, AIAnalyzedScript, CharacterVoicePreset, PresetVoiceKey } from "../types.ts"; 

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
  const ai = getAIInstance();
  const genreLabels = genres.map(g => VIDEO_GENRES.find(v => v.id === g)?.label).join(', ');
  
  const prompt = `You are a professional story writer. 
    Format: ${videoStructure === 'episodic' ? `Series (generate exactly ${variationCount} episodes)` : `Standalone story (generate exactly ${variationCount} distinct variations)`}.
    Genres: ${genreLabels}.
    Topic: ${keywords}.
    Category: ${proSettings?.subGenre || 'General'}.
    Realistic style requested: ${proSettings?.realisticImages ? 'Yes (8k photo)' : 'No'}.
    Return JSON only. ${videoStructure === 'episodic' ? '{ "seriesConcept": { "title": "string", "description": "string" }, "episodeIdeas": [ { "episodeTitle": "string", "episodeDescription": "string" } ] }' : '[ { "title": "string", "description": "string" } ]'}`;

  const response = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  const parsed = JSON.parse(response.text || "[]");
  if (videoStructure === 'episodic') {
    const all: StoryIdea[] = [{ id: 'series', title: parsed.seriesConcept.title, description: parsed.seriesConcept.description, isSeriesConcept: true, proSettingsUsed: proSettings }];
    parsed.episodeIdeas.forEach((e: any, i: number) => {
      all.push({ id: `ep-${i}`, title: e.episodeTitle, description: e.episodeDescription, episodeNumber: i + 1, parentSeriesTitle: parsed.seriesConcept.title, proSettingsUsed: proSettings });
    });
    return all;
  }
  return parsed.map((p: any, i: number) => ({ ...p, id: `idea-${i}`, proSettingsUsed: proSettings }));
};

export const generateScript = async (outline: string, scriptType: ScriptType, story?: StoryIdea): Promise<string> => {
  const ai = getAIInstance();
  const pro = story?.proSettingsUsed;
  const scriptStyle = scriptType === ScriptType.SingleVoice ? "One Narrator only" : scriptType === ScriptType.TwoVoice ? "Conversation between two characters" : "Full ensemble dialogue";
  
  const prompt = `Write a professional script for: ${outline}.
    Mode: ${scriptStyle}.
    Character Designs: ${pro?.characters.map(c => `${c.name} (${c.physicalDescription})`).join(', ')}.
    World Setting: ${pro?.primarySetting || 'Not specified'}.
    Required format: Use [TIMESTAMP: MM:SS] markers. Mark visual cues as [VISUAL: description].
    Keep dialogue natural and tone appropriate for ${pro?.subGenre || 'general'} genre.`;

  const response = await ai.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: prompt });
  return response.text || "";
};

export const analyzeScript = async (
  fullScript: string,
  characterDefinitions: any[] = []
): Promise<AIAnalyzedScript> => {
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

export const generateSpeech = async (
  dialogueItems: Array<{ speaker: string, text: string }>,
  voicePresets: Record<string, CharacterVoicePreset>,
  defaultVoiceKey: PresetVoiceKey = 'Narrator_F'
): Promise<string> => {
  try {
    const ai = getAIInstance();
    const text = dialogueItems.map(d => `${d.speaker}: ${d.text}`).join('\n');
    const voiceName = PRESET_VOICES_CONFIG[defaultVoiceKey]?.name || 'Aoede';

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
    return `data:audio/mp3;base64,${base64Audio}`;
  } catch (err) {
    console.error(err);
    throw new Error("Voice engine failed.");
  }
};

export const generateImageForPrompt = async (prompt: string, realistic: boolean = false): Promise<string> => {
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
