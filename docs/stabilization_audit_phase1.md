# Stabilization Audit (Phase 1)

## Scope
This phase focuses on **type safety and Firebase service consolidation**. Other cleanup items (component decomposition, Tailwind audits, dead code sweeps, and full lint hardening) are intentionally deferred to later phases to reduce regression risk.

## Main entry points and critical flow

1. **App bootstrap**
   - `index.tsx` initializes Firebase and renders `App`.
2. **Session + project shell**
   - `App.tsx` controls active view, project state, and auto-save.
3. **Document/upload intake**
   - `components/features/StoryIdeaGenerator.tsx` collects keywords and optional reference link/file metadata.
4. **Intelligent processor**
   - `services/geminiService.ts` calls Cloud Functions for idea generation, script generation, script analysis, TTS, and media generation.
5. **Case file (project) creation/persistence**
   - `FirebaseContext.tsx` reads/writes:
     - `users/{uid}` profile
     - `users/{uid}/projects/{projectId}`
6. **Letter generation analogue**
   - `components/features/ScriptWriter.tsx` + `generateScript` callable.

## Major components and responsibilities

- `App.tsx`: view orchestration, state hydration, persistence triggers, upload side-effects.
- `FirebaseContext.tsx`: auth state, Firestore sync, profile/project CRUD.
- `services/geminiService.ts`: all AI callables and payload normalization.
- `services/storageService.ts`: Storage uploads/deletes for project assets.
- `services/stripeService.ts`: Stripe checkout callable bridge.
- `services/gcpTextToSpeechService.ts`: optional GCP TTS callable bridge.

## Duplicate/conflicting logic found

1. **Cloud Functions region/client initialization split**
   - Different files previously created callable clients independently.
2. **Firestore profile mapping duplicated inline**
   - Profile `plan -> isPro` conversion repeated in multiple read paths.
3. **Top-level app duplication still present (next phase)**
   - `App.tsx` contains duplicated helper declarations and an overlapping progress algorithm versus `projectProgress.ts`.

## Instability patterns observed (queue for next phases)

- Potential stale-closure updates in some async state update paths.
- Repeated per-component error formatting helpers.
- Very large feature components with mixed UI + orchestration + async control logic.

## Phase 1 changes applied

1. Added shared callable helper:
   - `services/firebaseFunctions.ts`
   - Single region (`us-central1`) and typed `makeCallable<Req, Res>()`.
2. Added typed Firestore collection access:
   - `services/firebaseCollections.ts`
   - Strongly typed profile/project refs and conversion helpers.
3. Migrated context/service usage:
   - `FirebaseContext.tsx` now uses typed refs/converters for user profile and projects.
   - `services/stripeService.ts` and `services/gcpTextToSpeechService.ts` now use shared callable helper.
4. Removed `any` usage in Firebase/AI boundary and idea generator:
   - `services/geminiService.ts`
   - `components/features/StoryIdeaGenerator.tsx`

## Next stabilization phases (recommended order)

1. **Compile blockers** (must-fix)
   - Resolve `components/features/ProfileManager.tsx` syntax error.
2. **App-level duplication cleanup**
   - Remove duplicated helpers and consolidate progress logic to `projectProgress.ts`.
3. **Async safety pass**
   - Replace closure-based state writes with functional updates where needed.
4. **Error handling standardization**
   - Shared error utility for UI/service layers.
5. **Code hygiene**
   - Dead code removal, unused dependency audit, and lint rule hardening.
