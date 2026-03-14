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

4. **Cloud Function auth expectations**
   - Callable generation endpoints require Firebase auth.
   - App now falls back to direct Gemini generation when callable auth/permission/unavailable errors occur, but production should still keep callable auth healthy.
