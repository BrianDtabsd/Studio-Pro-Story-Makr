# Studio Pro — Story-Makr Roadmap

**Firebase project:** `chronos-video-forensics`
**Rule:** Move slow. Ship one phase fully before starting the next.

---

## Current State Audit

### What exists and works
- Google Sign-In via Firebase Auth
- Firestore: user profiles + projects saved/loaded per user
- `saveProject` / `deleteProject` wired in FirebaseContext
- Real-time project listener (`onSnapshot`)
- `upgradeToPro` stub exists but is a localStorage hack — not tied to Stripe
- 9 feature modules: Story Ideas → Script → TTS → Scene Images → Title Cards → Freeform Images → Thumbnail → Export → Profile Hub
- Episode/series architecture in types (standalone vs episodic)
- JSZip export scaffolded in ProjectExport

### What is missing or half-done
- `ProjectState` is large and deeply nested — not fully persisted to Firestore (project saves metadata + progress only, not full state)
- No Stripe integration — `isPro` is toggled locally
- No landing page
- No deploy pipeline (no `firebase.json`, no hosting config, no predeploy hook)
- Downloads: audio chunks export is partial, images download individually, no bulk ZIP fully wired
- Profile page: `avatarSeed` is a random string — no real avatar, no editable display name UI beyond initial creation
- No Firestore security rules scoped to this app

---

## Phase 1 — Foundation Before Features

**Goal:** Get the plumbing solid before adding anything new. Nothing ships without these.

### 1.1 Deploy Pipeline
- Add `firebase.json` pointing hosting public to `dist`
- Add `"predeploy": ["npm run build"]` hook (same pattern as Chronos)
- First deploy to `chronos-video-forensics` hosting — needs its own hosting site or subdomain (currently Chronos owns the default)
- Options: separate Firebase Hosting site (`story-makr.web.app`) or subdirectory routing

### 1.2 Full ProjectState Persistence
- Current `saveProject` only saves metadata shell (`Project` type) — `ProjectState` is NOT saved
- Need to save the full `ProjectState` blob to Firestore under `users/{uid}/projects/{id}/state`
- On project open/load, hydrate all the feature components from saved state
- This is the most critical missing piece — users lose all their work on refresh

### 1.3 Firestore Rules
- Scope rules to `users/{userId}/**` — only the owner can read/write
- Currently rules file exists but may not be deployed for this app's context
- Review against Chronos rules for pattern consistency

---

## Phase 2 — Stripe & Pro Tier

**Goal:** Real money, real gating. Replace the localStorage `isPro` hack.

### 2.1 Stripe Products & Prices
Suggested product structure (to decide):
| Product | Price | What it unlocks |
|---|---|---|
| Story-Makr Free | $0 | 1 active project, single-voice TTS, standard image gen |
| Story-Makr Pro | $X/mo | Unlimited projects, multi-voice TTS, scene video gen, bulk export |
| Story-Makr Pro Annual | $X/yr | Same as Pro, discounted |

- Create products in Stripe dashboard
- Reuse existing `createCheckoutSession` Cloud Function from Chronos (already in the shared project)
- Add `stripeWebhook` handler to write `plan: 'pro'` to user Firestore doc on successful payment
- `FirebaseContext` already reads `data.plan === 'pro'` — so webhook write is the only missing link

### 2.2 Pro Gating in UI
- Replace `localStorage.getItem('story_makr_force_pro')` checks with real `profile.isPro` from Firestore
- Gate: multi-voice scripts, video scene generation, bulk ZIP export, unlimited projects
- Paywall prompt component (tasteful — show what's behind the gate, not just a block)

### 2.3 Manage Subscription
- Link to Stripe customer portal from Profile Hub
- Show current plan, renewal date, cancel option

---

## Phase 3 — Download & Export Overhaul

**Goal:** Users can take everything they made out of the app cleanly.

### 3.1 Audio Export
- Currently: individual `SynthesizedChunk` downloads per scene
- Goal: single "Download All Audio" — ZIP all chunks as numbered WAV files
- Bonus: merged single audio file (concatenate chunks in order)
- JSZip is already a dependency — just needs wiring

### 3.2 Image Export
- Currently: individual downloads per generated image
- Goal: "Export All Visuals" — ZIP scene images + title cards + thumbnail in one package
- Folder structure inside ZIP: `/scenes/`, `/title-cards/`, `/thumbnail/`

### 3.3 Full Project Export
- `ProjectExport` component exists but is partial
- Goal: one ZIP that includes:
  - `/script/` — all script variants (TXT or MD)
  - `/audio/` — all WAV chunks
  - `/images/` — all generated visuals
  - `/metadata.json` — project settings, story idea, characters, timestamps
- This is the hero feature for Pro users — make it feel premium

---

## Phase 4 — Profile & Identity

**Goal:** Users feel like the app knows them.

### 4.1 Avatar
- Currently `avatarSeed` is a random string with no rendered avatar
- Options: generated avatar (DiceBear API — free, no key needed), or user photo upload to Firebase Storage
- Recommendation: DiceBear for now (no storage cost), photo upload as Pro feature

### 4.2 Profile Hub Improvements
- Editable display name
- Show joined date, project count, total audio generated
- Plan badge (Free / Pro) with upgrade CTA if free

### 4.3 Usage Stats (Pro)
- Scripts generated, images created, audio minutes synthesized
- Store lightweight counters in Firestore user doc, increment on each generation

---

## Phase 5 — Landing Page

**Goal:** Convert visitors to signups. Showcase what the app does.

### Structure
1. **Hero** — headline + animated demo or screenshot, primary CTA "Start for Free"
2. **How it works** — 5-step visual flow: Idea → Script → Voice → Visuals → Export
3. **Feature grid** — highlight AI script gen, multi-voice TTS, scene image gen, bulk export
4. **Pro vs Free** — pricing comparison table
5. **Social proof** — testimonials or "built for YouTube creators" positioning
6. **Footer** — links to Privacy Policy, Terms, contact

### Technical
- Standalone `LandingPage` component (similar to Chronos pattern)
- Show landing page to unauthenticated users, app to authenticated users
- Route: root `/` = landing, sign-in redirects to `/app` or hub

---

## Phase 6 — Polish & Production Readiness

- Node.js runtime upgrade: functions → Node 22 (deadline: Apr 30 2026)
- `firebase-functions` package upgrade (breaking changes — test carefully)
- OAuth consent screen verification (Google)
- Firebase App Check (reCAPTCHA v3)
- Privacy Policy + Terms of Service pages
- Error boundaries in React — app is complex enough that one bad AI response shouldn't crash everything
- Budget alerts on Google Cloud Console
- Lighthouse audit — bundle is 1.5MB+ unminified, needs code splitting

---

## Orange LED Glow — Cross-App Note
Both apps use `.led-glow` as an accent. Chronos has it hardcoded to `#f97316`. Story-Makr should match once UI polish pass happens in Phase 5/6.

---

## Deploy Sequence (when ready)
```
# Story-Makr has no firebase.json yet — Phase 1 sets this up
npm run build
firebase deploy --only hosting --project chronos-video-forensics
```
