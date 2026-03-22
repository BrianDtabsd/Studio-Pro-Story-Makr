import { makeCallable } from "./firebaseFunctions.ts";

export interface VoiceSelectionParams {
  languageCode: string;
  name?: string;
  ssmlGender?: "SSML_VOICE_GENDER_UNSPECIFIED" | "MALE" | "FEMALE" | "NEUTRAL";
}

interface SynthesizeSpeechGCPRequest {
  textOrSsml: string;
  voiceParams: VoiceSelectionParams;
  audioParams: Record<string, unknown>;
  isSsml: boolean;
}

interface SynthesizeSpeechGCPResponse {
  audioContent: string;
}

// Calls the synthesizeSpeechGCP Cloud Function which proxies GCP TTS server-side.
// Returns base64 MP3 audioContent string (same format as the old direct API call).
export const synthesizeSpeechGCP = async (
  textOrSsml: string,
  voiceParams: VoiceSelectionParams,
  audioParams: Record<string, unknown> = {},
  isSsml: boolean = false
): Promise<string> => {
  const fn = makeCallable<SynthesizeSpeechGCPRequest, SynthesizeSpeechGCPResponse>(
    "synthesizeSpeechGCP",
    { timeout: 60000 }
  );
  const result = await fn({ textOrSsml, voiceParams, audioParams, isSsml });
  if (typeof result.data?.audioContent !== "string" || result.data.audioContent.length === 0) {
    throw new Error("synthesizeSpeechGCP callable returned invalid audio content.");
  }
  return result.data.audioContent;
};
