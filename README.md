<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/37083281-4446-4ce5-823b-46bc1f882dbc

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## GitHub safety workflow (must-follow)

If code changes are not showing in browser, do this before making new edits:
1. `git branch --show-current`
2. `git fetch origin`
3. `git rev-list --left-right --count origin/main...origin/<working-branch>`
4. `gh pr list --state open --base main`

Then:
1. Merge the active PR into `main` (prefer Squash and merge).
2. Pull latest `main` locally:
   - `git fetch origin`
   - `git switch main`
   - `git pull origin main`
3. Restart the dev server and retest.

Detailed branch/PR incident protocol is maintained in `AGENTS.md`.

## Production reliability checklist

1. **Firebase Auth domains**
   - In Firebase Console → Authentication → Settings → Authorized domains, add every runtime domain you use (for example: `localhost`, `127.0.0.1`, preview/staging domains, production domain).

2. **Firestore rules deployment**
   - This repo includes `firestore.rules`, `firebase.json`, and `firestore.indexes.json` configured for both `(default)` and `ai-studio-37083281-4446-4ce5-823b-46bc1f882dbc` databases.
   - Deploy rules from project root:
     - `firebase deploy --only firestore:rules --project chronos-video-forensics`

3. **Required runtime keys**
   - `.env.local` must include:
     - `GEMINI_API_KEY`
     - `VITE_STRIPE_PUBLISHABLE_KEY` (for embedded Stripe checkout)

4. **Story Makr AI runtime config (recommended)**
   - Prefer Story Makr-native env vars in `.env.local`:
     - `STORYMAKR_AI_MODE=strict`
     - Optional callable overrides:
       - `STORYMAKR_AI_GENERATE_STORY_IDEAS_CALLABLE`
       - `STORYMAKR_AI_GENERATE_SCRIPT_CALLABLE`
       - `STORYMAKR_AI_ANALYZE_SCRIPT_CALLABLE`
       - `STORYMAKR_AI_ANALYZE_CHARACTER_AVATAR_CALLABLE`
       - `STORYMAKR_AI_GENERATE_SPEECH_CALLABLE`
       - `STORYMAKR_AI_GENERATE_IMAGE_CALLABLE`
       - `STORYMAKR_AI_GENERATE_VIDEO_CALLABLE`
   - Legacy `CHRONOS_*` keys are still supported for compatibility, but new setup should use `STORYMAKR_*` keys.

5. **Cloud Function auth expectations**
   - Callable generation endpoints require Firebase auth.
   - Story Makr is currently configured as Cloud-Functions-first for generation flows; keep callable auth and names aligned with deployed functions.
