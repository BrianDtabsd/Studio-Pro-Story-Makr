import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const envOrEmpty = (key: string) => env[key] || '';
    const firstEnv = (...keys: string[]) => keys.map(envOrEmpty).find((v) => v.trim().length > 0) || '';
    const geminiApiKey = firstEnv('GEMINI_API_KEY', 'VITE_GEMINI_API_KEY');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.STORYMAKR_AI_MODE': JSON.stringify(envOrEmpty('STORYMAKR_AI_MODE')),
        'process.env.STORYMAKR_AI_GENERATE_STORY_IDEAS_CALLABLE': JSON.stringify(envOrEmpty('STORYMAKR_AI_GENERATE_STORY_IDEAS_CALLABLE')),
        'process.env.STORYMAKR_AI_GENERATE_SCRIPT_CALLABLE': JSON.stringify(envOrEmpty('STORYMAKR_AI_GENERATE_SCRIPT_CALLABLE')),
        'process.env.STORYMAKR_AI_ANALYZE_SCRIPT_CALLABLE': JSON.stringify(envOrEmpty('STORYMAKR_AI_ANALYZE_SCRIPT_CALLABLE')),
        'process.env.STORYMAKR_AI_ANALYZE_CHARACTER_AVATAR_CALLABLE': JSON.stringify(envOrEmpty('STORYMAKR_AI_ANALYZE_CHARACTER_AVATAR_CALLABLE')),
        'process.env.STORYMAKR_AI_GENERATE_SPEECH_CALLABLE': JSON.stringify(envOrEmpty('STORYMAKR_AI_GENERATE_SPEECH_CALLABLE')),
        'process.env.STORYMAKR_AI_GENERATE_IMAGE_CALLABLE': JSON.stringify(envOrEmpty('STORYMAKR_AI_GENERATE_IMAGE_CALLABLE')),
        'process.env.STORYMAKR_AI_GENERATE_VIDEO_CALLABLE': JSON.stringify(envOrEmpty('STORYMAKR_AI_GENERATE_VIDEO_CALLABLE')),
        'process.env.STORYMAKR_STRIPE_MODE': JSON.stringify(envOrEmpty('STORYMAKR_STRIPE_MODE')),
        'process.env.STORYMAKR_STRIPE_CHECKOUT_CALLABLE': JSON.stringify(envOrEmpty('STORYMAKR_STRIPE_CHECKOUT_CALLABLE')),
        'process.env.STORYMAKR_STRIPE_PRICE_ID': JSON.stringify(envOrEmpty('STORYMAKR_STRIPE_PRICE_ID')),
        'process.env.STORYMAKR_STRIPE_SUCCESS_URL': JSON.stringify(envOrEmpty('STORYMAKR_STRIPE_SUCCESS_URL')),
        'process.env.STORYMAKR_STRIPE_CANCEL_URL': JSON.stringify(envOrEmpty('STORYMAKR_STRIPE_CANCEL_URL')),
        'process.env.CHRONOS_FUNCTIONS_MODE': JSON.stringify(envOrEmpty('CHRONOS_FUNCTIONS_MODE')),
        'process.env.CHRONOS_STRIPE_MODE': JSON.stringify(envOrEmpty('CHRONOS_STRIPE_MODE')),
        'process.env.CHRONOS_STRIPE_CHECKOUT_CALLABLE': JSON.stringify(envOrEmpty('CHRONOS_STRIPE_CHECKOUT_CALLABLE')),
        'process.env.CHRONOS_STRIPE_PRICE_ID': JSON.stringify(envOrEmpty('CHRONOS_STRIPE_PRICE_ID')),
        'process.env.CHRONOS_STRIPE_SUCCESS_URL': JSON.stringify(envOrEmpty('CHRONOS_STRIPE_SUCCESS_URL')),
        'process.env.CHRONOS_STRIPE_CANCEL_URL': JSON.stringify(envOrEmpty('CHRONOS_STRIPE_CANCEL_URL')),
        'process.env.GOOGLE_CLOUD_TTS_API_KEY': JSON.stringify(envOrEmpty('GOOGLE_CLOUD_TTS_API_KEY'))
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
