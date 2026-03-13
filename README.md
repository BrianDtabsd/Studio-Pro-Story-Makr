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

## Chronos function wiring

Story Makr calls Firebase callable functions first (from the Firebase project configured in `firebase-applet-config.json`), then falls back to direct Gemini calls when configured for fallback mode.

`window.APP_CONFIG` controls this behavior in `index.html`:

- `CHRONOS_FUNCTIONS_MODE`: `off` | `fallback` | `strict`
  - `off`: skip callable functions and always use direct Gemini.
  - `fallback`: try callable functions first, then direct Gemini if callable fails.
  - `strict`: callable functions only (throws on callable failure).
- `CHRONOS_CALLABLE_NAMES`: override callable function names without code changes.
