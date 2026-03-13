export type RuntimeMode = 'off' | 'fallback' | 'strict';

export type ChronosCallableKey =
  | 'generateStoryIdeas'
  | 'generateScript'
  | 'analyzeScript'
  | 'analyzeCharacterAvatar'
  | 'generateSpeech'
  | 'generateImageForPrompt'
  | 'generateVideoForPrompt';

export type ChronosCallableNames = Record<ChronosCallableKey, string>;

export interface RuntimeAppConfig {
  GOOGLE_CLOUD_TTS_API_KEY?: string;
  CHRONOS_FUNCTIONS_MODE?: string;
  CHRONOS_CALLABLE_NAMES?: Partial<ChronosCallableNames>;
  CHRONOS_STRIPE_MODE?: string;
  CHRONOS_STRIPE_CHECKOUT_CALLABLE?: string;
  CHRONOS_STRIPE_PRICE_ID?: string;
  CHRONOS_STRIPE_SUCCESS_URL?: string;
  CHRONOS_STRIPE_CANCEL_URL?: string;
  CHRONOS_STRIPE_ALLOW_LOCAL_PRO_UPGRADE?: boolean;
}

const DEFAULT_CHRONOS_CALLABLE_NAMES: ChronosCallableNames = {
  generateStoryIdeas: 'generateStoryIdeas',
  generateScript: 'generateScript',
  analyzeScript: 'analyzeScript',
  analyzeCharacterAvatar: 'analyzeCharacterAvatar',
  generateSpeech: 'generateSpeech',
  generateImageForPrompt: 'generateImage',
  generateVideoForPrompt: 'generateVideo',
};

const parseMode = (raw: string | undefined, fallback: RuntimeMode): RuntimeMode => {
  if (!raw) return fallback;
  const normalized = raw.toLowerCase();
  if (normalized === 'off' || normalized === 'fallback' || normalized === 'strict') {
    return normalized;
  }
  return fallback;
};

const readEnvConfig = (): RuntimeAppConfig => {
  const envConfig: RuntimeAppConfig = {};

  type StringConfigKey =
    | 'CHRONOS_FUNCTIONS_MODE'
    | 'CHRONOS_STRIPE_MODE'
    | 'CHRONOS_STRIPE_CHECKOUT_CALLABLE'
    | 'CHRONOS_STRIPE_PRICE_ID'
    | 'CHRONOS_STRIPE_SUCCESS_URL'
    | 'CHRONOS_STRIPE_CANCEL_URL';

  const putString = (key: StringConfigKey, value: string | undefined) => {
    if (typeof value === 'string' && value.trim().length > 0) {
      envConfig[key] = value;
    }
  };

  putString('CHRONOS_FUNCTIONS_MODE', process.env.CHRONOS_FUNCTIONS_MODE);
  putString('CHRONOS_STRIPE_MODE', process.env.CHRONOS_STRIPE_MODE);
  putString('CHRONOS_STRIPE_CHECKOUT_CALLABLE', process.env.CHRONOS_STRIPE_CHECKOUT_CALLABLE);
  putString('CHRONOS_STRIPE_PRICE_ID', process.env.CHRONOS_STRIPE_PRICE_ID);
  putString('CHRONOS_STRIPE_SUCCESS_URL', process.env.CHRONOS_STRIPE_SUCCESS_URL);
  putString('CHRONOS_STRIPE_CANCEL_URL', process.env.CHRONOS_STRIPE_CANCEL_URL);

  const localUpgradeRaw = process.env.CHRONOS_STRIPE_ALLOW_LOCAL_PRO_UPGRADE;
  if (localUpgradeRaw === 'true') envConfig.CHRONOS_STRIPE_ALLOW_LOCAL_PRO_UPGRADE = true;
  if (localUpgradeRaw === 'false') envConfig.CHRONOS_STRIPE_ALLOW_LOCAL_PRO_UPGRADE = false;

  return envConfig;
};

export const getAppConfig = (): RuntimeAppConfig => {
  const envConfig = readEnvConfig();
  if (typeof window === 'undefined') return envConfig;
  return { ...(window.APP_CONFIG || {}), ...envConfig };
};

export const getChronosCallableNames = (): ChronosCallableNames => {
  const configured = getAppConfig().CHRONOS_CALLABLE_NAMES || {};
  return { ...DEFAULT_CHRONOS_CALLABLE_NAMES, ...configured };
};

export const getChronosFunctionsMode = (): RuntimeMode =>
  parseMode(getAppConfig().CHRONOS_FUNCTIONS_MODE, 'strict');

export const getChronosStripeMode = (): RuntimeMode =>
  parseMode(getAppConfig().CHRONOS_STRIPE_MODE, 'strict');

export const isLocalProUpgradeAllowed = (): boolean =>
  getAppConfig().CHRONOS_STRIPE_ALLOW_LOCAL_PRO_UPGRADE === true;

declare global {
  interface Window {
    APP_CONFIG?: RuntimeAppConfig;
  }
}
