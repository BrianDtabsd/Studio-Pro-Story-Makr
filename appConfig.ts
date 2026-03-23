export type RuntimeMode = 'off' | 'fallback' | 'strict';

export type StoryMakrCallableKey =
  | 'generateStoryIdeas'
  | 'generateScript'
  | 'analyzeScript'
  | 'analyzeCharacterAvatar'
  | 'generateSpeech'
  | 'generateImageForPrompt'
  | 'generateVideoForPrompt';

export type StoryMakrCallableNames = Record<StoryMakrCallableKey, string>;

// Backward-compatible aliases for existing imports.
export type ChronosCallableKey = StoryMakrCallableKey;
export type ChronosCallableNames = StoryMakrCallableNames;

export interface RuntimeAppConfig {
  STORYMAKR_AI_MODE?: string;
  STORYMAKR_AI_CALLABLE_NAMES?: Partial<StoryMakrCallableNames>;
  STORYMAKR_AI_GENERATE_STORY_IDEAS_CALLABLE?: string;
  STORYMAKR_AI_GENERATE_SCRIPT_CALLABLE?: string;
  STORYMAKR_AI_ANALYZE_SCRIPT_CALLABLE?: string;
  STORYMAKR_AI_ANALYZE_CHARACTER_AVATAR_CALLABLE?: string;
  STORYMAKR_AI_GENERATE_SPEECH_CALLABLE?: string;
  STORYMAKR_AI_GENERATE_IMAGE_CALLABLE?: string;
  STORYMAKR_AI_GENERATE_VIDEO_CALLABLE?: string;
  STORYMAKR_STRIPE_MODE?: string;
  STORYMAKR_STRIPE_CHECKOUT_CALLABLE?: string;
  STORYMAKR_STRIPE_PRICE_ID?: string;
  STORYMAKR_STRIPE_SUCCESS_URL?: string;
  STORYMAKR_STRIPE_CANCEL_URL?: string;

  // Legacy keys retained for compatibility with existing deployments.
  CHRONOS_FUNCTIONS_MODE?: string;
  CHRONOS_CALLABLE_NAMES?: Partial<StoryMakrCallableNames>;
  CHRONOS_STRIPE_MODE?: string;
  CHRONOS_STRIPE_CHECKOUT_CALLABLE?: string;
  CHRONOS_STRIPE_PRICE_ID?: string;
  CHRONOS_STRIPE_SUCCESS_URL?: string;
  CHRONOS_STRIPE_CANCEL_URL?: string;
}

const DEFAULT_STORYMAKR_CALLABLE_NAMES: StoryMakrCallableNames = {
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

const normalizeConfigString = (value: string | undefined): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  const normalized = trimmed.toLowerCase();
  if (normalized === 'undefined' || normalized === 'null') return undefined;
  return trimmed;
};

const readEnvConfig = (): RuntimeAppConfig => {
  const envConfig: RuntimeAppConfig = {};

  type StringConfigKey =
    | 'STORYMAKR_AI_MODE'
    | 'STORYMAKR_AI_GENERATE_STORY_IDEAS_CALLABLE'
    | 'STORYMAKR_AI_GENERATE_SCRIPT_CALLABLE'
    | 'STORYMAKR_AI_ANALYZE_SCRIPT_CALLABLE'
    | 'STORYMAKR_AI_ANALYZE_CHARACTER_AVATAR_CALLABLE'
    | 'STORYMAKR_AI_GENERATE_SPEECH_CALLABLE'
    | 'STORYMAKR_AI_GENERATE_IMAGE_CALLABLE'
    | 'STORYMAKR_AI_GENERATE_VIDEO_CALLABLE'
    | 'STORYMAKR_STRIPE_MODE'
    | 'STORYMAKR_STRIPE_CHECKOUT_CALLABLE'
    | 'STORYMAKR_STRIPE_PRICE_ID'
    | 'STORYMAKR_STRIPE_SUCCESS_URL'
    | 'STORYMAKR_STRIPE_CANCEL_URL'
    | 'CHRONOS_FUNCTIONS_MODE'
    | 'CHRONOS_STRIPE_MODE'
    | 'CHRONOS_STRIPE_CHECKOUT_CALLABLE'
    | 'CHRONOS_STRIPE_PRICE_ID'
    | 'CHRONOS_STRIPE_SUCCESS_URL'
    | 'CHRONOS_STRIPE_CANCEL_URL';

  const putString = (key: StringConfigKey, value: string | undefined) => {
    const normalized = normalizeConfigString(value);
    if (normalized) {
      envConfig[key] = normalized;
    }
  };

  putString('STORYMAKR_AI_MODE', process.env.STORYMAKR_AI_MODE);
  putString('STORYMAKR_AI_GENERATE_STORY_IDEAS_CALLABLE', process.env.STORYMAKR_AI_GENERATE_STORY_IDEAS_CALLABLE);
  putString('STORYMAKR_AI_GENERATE_SCRIPT_CALLABLE', process.env.STORYMAKR_AI_GENERATE_SCRIPT_CALLABLE);
  putString('STORYMAKR_AI_ANALYZE_SCRIPT_CALLABLE', process.env.STORYMAKR_AI_ANALYZE_SCRIPT_CALLABLE);
  putString('STORYMAKR_AI_ANALYZE_CHARACTER_AVATAR_CALLABLE', process.env.STORYMAKR_AI_ANALYZE_CHARACTER_AVATAR_CALLABLE);
  putString('STORYMAKR_AI_GENERATE_SPEECH_CALLABLE', process.env.STORYMAKR_AI_GENERATE_SPEECH_CALLABLE);
  putString('STORYMAKR_AI_GENERATE_IMAGE_CALLABLE', process.env.STORYMAKR_AI_GENERATE_IMAGE_CALLABLE);
  putString('STORYMAKR_AI_GENERATE_VIDEO_CALLABLE', process.env.STORYMAKR_AI_GENERATE_VIDEO_CALLABLE);
  putString('STORYMAKR_STRIPE_MODE', process.env.STORYMAKR_STRIPE_MODE);
  putString('STORYMAKR_STRIPE_CHECKOUT_CALLABLE', process.env.STORYMAKR_STRIPE_CHECKOUT_CALLABLE);
  putString('STORYMAKR_STRIPE_PRICE_ID', process.env.STORYMAKR_STRIPE_PRICE_ID);
  putString('STORYMAKR_STRIPE_SUCCESS_URL', process.env.STORYMAKR_STRIPE_SUCCESS_URL);
  putString('STORYMAKR_STRIPE_CANCEL_URL', process.env.STORYMAKR_STRIPE_CANCEL_URL);

  // Legacy fallbacks.
  putString('CHRONOS_FUNCTIONS_MODE', process.env.CHRONOS_FUNCTIONS_MODE);
  putString('CHRONOS_STRIPE_MODE', process.env.CHRONOS_STRIPE_MODE);
  putString('CHRONOS_STRIPE_CHECKOUT_CALLABLE', process.env.CHRONOS_STRIPE_CHECKOUT_CALLABLE);
  putString('CHRONOS_STRIPE_PRICE_ID', process.env.CHRONOS_STRIPE_PRICE_ID);
  putString('CHRONOS_STRIPE_SUCCESS_URL', process.env.CHRONOS_STRIPE_SUCCESS_URL);
  putString('CHRONOS_STRIPE_CANCEL_URL', process.env.CHRONOS_STRIPE_CANCEL_URL);

  return envConfig;
};

export const getAppConfig = (): RuntimeAppConfig => {
  const envConfig = readEnvConfig();
  if (typeof window === 'undefined') return envConfig;
  return { ...(window.APP_CONFIG || {}), ...envConfig };
};

const firstNonEmpty = (...values: Array<string | undefined>): string | undefined => {
  for (const value of values) {
    const normalized = normalizeConfigString(value);
    if (normalized) return normalized;
  }
  return undefined;
};

export const getStoryMakrCallableNames = (): StoryMakrCallableNames => {
  const config = getAppConfig();
  const configuredRaw = config.STORYMAKR_AI_CALLABLE_NAMES || config.CHRONOS_CALLABLE_NAMES || {};
  const normalizeCallableOverrides = (
    overrides: Partial<StoryMakrCallableNames>
  ): Partial<StoryMakrCallableNames> => {
    const next: Partial<StoryMakrCallableNames> = {};
    (Object.keys(DEFAULT_STORYMAKR_CALLABLE_NAMES) as StoryMakrCallableKey[]).forEach((key) => {
      const normalized = normalizeConfigString(overrides[key]);
      if (normalized) next[key] = normalized;
    });
    return next;
  };

  const configured = normalizeCallableOverrides(configuredRaw);
  const individualOverrides = normalizeCallableOverrides({
    generateStoryIdeas: config.STORYMAKR_AI_GENERATE_STORY_IDEAS_CALLABLE,
    generateScript: config.STORYMAKR_AI_GENERATE_SCRIPT_CALLABLE,
    analyzeScript: config.STORYMAKR_AI_ANALYZE_SCRIPT_CALLABLE,
    analyzeCharacterAvatar: config.STORYMAKR_AI_ANALYZE_CHARACTER_AVATAR_CALLABLE,
    generateSpeech: config.STORYMAKR_AI_GENERATE_SPEECH_CALLABLE,
    generateImageForPrompt: config.STORYMAKR_AI_GENERATE_IMAGE_CALLABLE,
    generateVideoForPrompt: config.STORYMAKR_AI_GENERATE_VIDEO_CALLABLE,
  });
  return { ...DEFAULT_STORYMAKR_CALLABLE_NAMES, ...configured, ...individualOverrides };
};

export const getChronosCallableNames = (): ChronosCallableNames =>
  getStoryMakrCallableNames();

export const getStoryMakrFunctionsMode = (): RuntimeMode =>
  parseMode(firstNonEmpty(getAppConfig().STORYMAKR_AI_MODE, getAppConfig().CHRONOS_FUNCTIONS_MODE), 'strict');

export const getChronosFunctionsMode = (): RuntimeMode =>
  getStoryMakrFunctionsMode();

export const getStoryMakrStripeMode = (): RuntimeMode =>
  parseMode(firstNonEmpty(getAppConfig().STORYMAKR_STRIPE_MODE, getAppConfig().CHRONOS_STRIPE_MODE), 'strict');

export const getChronosStripeMode = (): RuntimeMode =>
  getStoryMakrStripeMode();

export const getStoryMakrStripeCheckoutCallable = (): string =>
  firstNonEmpty(
    getAppConfig().STORYMAKR_STRIPE_CHECKOUT_CALLABLE,
    getAppConfig().CHRONOS_STRIPE_CHECKOUT_CALLABLE
  ) || 'createCheckoutSession';

export const getStoryMakrStripePriceId = (): string | undefined =>
  firstNonEmpty(getAppConfig().STORYMAKR_STRIPE_PRICE_ID, getAppConfig().CHRONOS_STRIPE_PRICE_ID);

export const getStoryMakrStripeSuccessUrl = (): string | undefined =>
  firstNonEmpty(getAppConfig().STORYMAKR_STRIPE_SUCCESS_URL, getAppConfig().CHRONOS_STRIPE_SUCCESS_URL);

export const getStoryMakrStripeCancelUrl = (): string | undefined =>
  firstNonEmpty(getAppConfig().STORYMAKR_STRIPE_CANCEL_URL, getAppConfig().CHRONOS_STRIPE_CANCEL_URL);

declare global {
  interface Window {
    APP_CONFIG?: RuntimeAppConfig;
  }
}
