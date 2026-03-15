import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";

export interface VoiceSelectionParams {
  languageCode: string;
  name?: string;
  ssmlGender?: "SSML_VOICE_GENDER_UNSPECIFIED" | "MALE" | "FEMALE" | "NEUTRAL";
}

const fns = getFunctions(getApp(), "us-central1");

// Calls the synthesizeSpeechGCP Cloud Function which proxies GCP TTS server-side.
// Returns base64 MP3 audioContent string (same format as the old direct API call).
export const synthesizeSpeechGCP = async (
  textOrSsml: string,
  voiceParams: VoiceSelectionParams,
  audioParams: Record<string, unknown> = {},
  isSsml: boolean = false
): Promise<string> => {
  const fn = httpsCallable(fns, "synthesizeSpeechGCP", { timeout: 60000 });
  const result = await fn({ textOrSsml, voiceParams, audioParams, isSsml });
  return (result.data as { audioContent: string }).audioContent;
};
