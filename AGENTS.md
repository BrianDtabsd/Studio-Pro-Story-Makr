# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Story Makr** is a single-page AI-powered React/TypeScript app for YouTube content creation (story generation, script writing, TTS, image/video generation, thumbnails). It is a pure frontend app — no backend, no Cloud Functions, no Docker.

### Dev commands

See `package.json` scripts:
- `npm run dev` — Vite dev server on port 3000 (host `0.0.0.0`)
- `npm run build` — production build
- `npm run lint` — TypeScript type-check (`tsc --noEmit`)
- `npm run preview` — preview production build

### Environment variables

- `GEMINI_API_KEY` must be set in `.env.local` for AI features to work. Vite injects it as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` at build time.
- The Google Cloud TTS API key is hardcoded in `index.html` via `window.APP_CONFIG.GOOGLE_CLOUD_TTS_API_KEY`.

### Authentication

The app requires Google Sign-In via Firebase Auth (project: `chronos-video-forensics`). All features are gated behind authentication — the login screen is the first thing you see. To test features beyond login, a real Google account must authenticate through the popup flow.

**Cloud VM limitation:** `signInWithPopup` (Firebase) cannot complete in headless/cloud environments. The Google OAuth popup opens but the sign-in flow cannot be finalized. All post-login features (story generation, script writing, TTS, image/video gen) require authenticated access. To test these features, either add a dev auth bypass or use a local machine with browser access.

### Key caveats

- This Firebase project (`chronos-video-forensics`) is shared with another app. The Firebase config (in `firebase-applet-config.json`) and Firestore database ID (`ai-studio-37083281-...`) are hardcoded.
- Tailwind CSS is loaded from CDN (`cdn.tailwindcss.com`) at runtime, not bundled.
- The `index.html` import map (esm.sh CDN) is only used for the AI Studio hosted version; the Vite dev server bundles dependencies from `node_modules`.
- No test framework is configured; `npm run lint` (tsc type-check) is the only automated check.
