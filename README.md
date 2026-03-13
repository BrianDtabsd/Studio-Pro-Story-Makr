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

Optional `.env.local` billing/function overrides (recommended for Story Makr runtime wiring):
- `CHRONOS_FUNCTIONS_MODE`
- `CHRONOS_STRIPE_MODE`
- `CHRONOS_STRIPE_CHECKOUT_CALLABLE`
- `CHRONOS_STRIPE_PRICE_ID`
- `CHRONOS_STRIPE_SUCCESS_URL`
- `CHRONOS_STRIPE_CANCEL_URL`
- `GOOGLE_CLOUD_TTS_API_KEY`

## Chronos function wiring

Story Makr calls Firebase callable functions first (from the Firebase project configured in `firebase-applet-config.json`), then falls back to direct Gemini calls when configured for fallback mode.

`window.APP_CONFIG` controls this behavior in `index.html`:
(`.env.local` values with the same keys override `window.APP_CONFIG` at runtime.)

- `CHRONOS_FUNCTIONS_MODE`: `off` | `fallback` | `strict`
  - `off`: skip callable functions and always use direct Gemini.
  - `fallback`: try callable functions first, then direct Gemini if callable fails.
  - `strict`: callable functions only (throws on callable failure).
- `CHRONOS_CALLABLE_NAMES`: override callable function names without code changes.
  - Default mapping targets Chronos names `generateImage` and `generateVideo` for image/video calls.
  - The default mode in `index.html` is `strict` for foundation-first behavior.

### Stripe checkout wiring

The `Upgrade to Pro` action can open Stripe checkout through Chronos callable function `createCheckoutSession`.

`window.APP_CONFIG` billing keys in `index.html`:

- `CHRONOS_STRIPE_MODE`: `off` | `fallback` | `strict`
  - `off`: disables upgrade checkout flow.
  - `fallback` / `strict`: opens checkout and requires a valid redirect URL.
- `CHRONOS_STRIPE_CHECKOUT_CALLABLE`: defaults to `createCheckoutSession`.
- `CHRONOS_STRIPE_PRICE_ID`: Stripe price ID sent to checkout callable.
- `CHRONOS_STRIPE_SUCCESS_URL` / `CHRONOS_STRIPE_CANCEL_URL`: optional redirect URLs.
