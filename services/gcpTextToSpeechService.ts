
// Note: TextToSpeechClient from "@google-cloud/text-to-speech" is not used due to browser environment.
// We are using the REST API directly.
import { GCP_TTS_API_KEY_MISSING_MESSAGE, DEFAULT_ERROR_MESSAGE } from "../constants.ts";

// Interfaces for TextToSpeechClient request (simplified for our use)
interface SynthesisInput {
  text?: string; // For plain text input
  ssml?: string; // For SSML input
}

export interface VoiceSelectionParams { 
  languageCode: string;
  name?: string; // e.g., 'en-US-Wavenet-D'
  ssmlGender?: 'SSML_VOICE_GENDER_UNSPECIFIED' | 'MALE' | 'FEMALE' | 'NEUTRAL';
}

interface AudioConfig {
  audioEncoding: 'AUDIO_ENCODING_UNSPECIFIED' | 'LINEAR16' | 'MP3' | 'OGG_OPUS';
  speakingRate?: number; // 0.25 to 4.0 - Will be controlled by SSML <prosody>
  pitch?: number; // -20.0 to 20.0 - Will be controlled by SSML <prosody>
  volumeGainDb?: number;
  sampleRateHertz?: number;
  effectsProfileId?: string[];
}

interface SynthesizeSpeechRequest {
  input: SynthesisInput;
  voice: VoiceSelectionParams; // This is for the overall request, SSML can override per <voice> tag
  audioConfig: AudioConfig;
}

let gcpApiKeyVal: string | null = null; 

const getGcpApiKey = (): string => {
  if (gcpApiKeyVal) return gcpApiKeyVal;
  const key = process.env.GOOGLE_CLOUD_TTS_API_KEY;
  if (!key || key === "YOUR_GCP_TTS_API_KEY_HERE" || key === "YOUR_ACTUAL_GOOGLE_CLOUD_TTS_API_KEY_HERE" || key === "") {
    console.error(GCP_TTS_API_KEY_MISSING_MESSAGE + " Please ensure GOOGLE_CLOUD_TTS_API_KEY is set in .env.local.");
    throw new Error(GCP_TTS_API_KEY_MISSING_MESSAGE + " Please set GOOGLE_CLOUD_TTS_API_KEY in .env.local.");
  }
  gcpApiKeyVal = key;
  return gcpApiKeyVal;
};

export const synthesizeSpeechGCP = async (
  textOrSsml: string,
  voiceParams: VoiceSelectionParams, // Base voice for the request, can be overridden by SSML <voice> tags
  audioParams: Partial<Omit<AudioConfig, 'audioEncoding' | 'speakingRate' | 'pitch'>>, // Rate/pitch now fixed via SSML
  isSsml: boolean = false 
): Promise<string> => {
  const apiKey = getGcpApiKey(); 

  let mainRequestVoiceParams: VoiceSelectionParams = voiceParams;
  let mainVoiceOverriddenForSsml = false;

  // If SSML contains <voice> tags, the main request's voice parameter must be a standard voice
  // that matches the language of the SSML. This is a GCP requirement.
  if (isSsml && textOrSsml.includes("<voice")) {
    mainVoiceOverriddenForSsml = true;
    // Determine language from the first <voice> tag or default to 'en-US'
    const langMatch = textOrSsml.match(/<voice[^>]*xml:lang="([^"]+)"/i) || textOrSsml.match(/<voice[^>]*lang="([^"]+)"/i);
    const ssmlLanguage = langMatch ? langMatch[1] : 'en-US'; // Default to en-US if not found

    // Select a basic standard voice for that language.
    // This is a simplified approach. A more robust solution might involve a lookup.
    let standardVoiceName = 'en-US-Standard-A'; // Default standard voice
    let standardGender: 'MALE' | 'FEMALE' | 'NEUTRAL' = 'MALE';

    if (ssmlLanguage.startsWith('en-GB')) {
        standardVoiceName = 'en-GB-Standard-A'; standardGender = 'MALE';
    } else if (ssmlLanguage.startsWith('en-AU')) {
        standardVoiceName = 'en-AU-Standard-A'; standardGender = 'MALE';
    } // Add other languages if necessary and available as standard voices
    
    mainRequestVoiceParams = {
        languageCode: ssmlLanguage, 
        name: standardVoiceName,     
        ssmlGender: standardGender, 
    };
    console.debug(`[TTS Service] SSML with <voice> tags detected. Main request voice EXPLICITLY SET to Standard '${standardVoiceName}' (Gender: ${standardGender}, Lang: '${ssmlLanguage}'). Original voiceParam hint was: lang='${voiceParams.languageCode}', name='${voiceParams.name}'. Individual <voice> tags in SSML will specify the actual voices used for synthesis.`);
  }


  const requestBody: SynthesizeSpeechRequest = {
    input: isSsml ? { ssml: textOrSsml } : { text: textOrSsml },
    voice: mainRequestVoiceParams, 
    audioConfig: {
      ...audioParams, // User can still pass volumeGainDb, sampleRateHertz, effectsProfileId
      audioEncoding: 'MP3', 
      // speakingRate and pitch are now controlled by SSML <prosody> tags, so not set here.
    },
  };
  
  if (mainVoiceOverriddenForSsml) {
    console.debug(`[TTS Service] Clarification: The 'voice' parameter in the following GCP TTS Request Body refers to the *main request's default voice* (${mainRequestVoiceParams.name}, ${mainRequestVoiceParams.ssmlGender}). The actual voices for speech segments are determined by the &lt;voice name="..."&gt; tags within the SSML payload itself.`);
  }
  console.debug('[TTS Service] GCP TTS Request Body:', JSON.stringify(requestBody, (key, value) => {
    if (key === 'ssml' && typeof value === 'string' && value.length > 500) {
      return value.substring(0, 500) + '... [TRUNCATED]'; 
    }
    return value;
  }, 2));


  const TSPEECH_API_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";

  try {
    const response = await fetch(`${TSPEECH_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorData: any = { message: `Request failed with status ${response.status}` }; 
      try {
        const parsedJson = await response.json();
        errorData = parsedJson;
        console.error('Google Cloud TTS API error response (parsed JSON):', JSON.stringify(errorData, null, 2));
      } catch (jsonParseError) {
        const errorText = await response.text().catch(() => response.statusText); 
        errorData.message = errorText || errorData.message; 
        console.error('Google Cloud TTS API error response (raw text or status):', errorData.message);
      }
      
      const specificMessage = errorData?.error?.message || errorData?.message || response.statusText;
      let errorMessage = `Google Cloud TTS API request failed (${response.status} ${response.statusText || ''}): ${specificMessage}`;
      
      if (errorData?.error?.details && Array.isArray(errorData.error.details) && errorData.error.details.length > 0) {
        errorMessage += ` | Details: ${JSON.stringify(errorData.error.details)}`;
      } else if (errorData?.error?.details) { 
        errorMessage += ` | Details: ${JSON.stringify(errorData.error.details)}`;
      }
      if (isSsml && specificMessage.toLowerCase().includes("ssml")) {
        errorMessage += ` | Note: This was an SSML request. Check SSML validity. Input (first 500 chars): ${textOrSsml.substring(0,500)}`;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.audioContent) {
      return data.audioContent; 
    } else {
      console.error('No audioContent in Google Cloud TTS API response:', data);
      throw new Error('No audio content received from Google Cloud TTS API. Response data: ' + JSON.stringify(data));
    }
  } catch (error) {
    console.error("Error synthesizing speech with GCP:", error);
    if (error instanceof Error) { 
        throw error; 
    }
    throw new Error(String(error) || DEFAULT_ERROR_MESSAGE); 
  }
};

// GCP_VOICES list has been moved to constants.ts as PRESET_VOICES_CONFIG
// The GCPVoice interface is now in types.ts