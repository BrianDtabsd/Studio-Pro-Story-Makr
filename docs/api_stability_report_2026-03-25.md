# API Stability Report - 2026-03-25

## Scope
- Branch: `cursor/api-errors-project-issues-d064`
- Target system: Story Makr YouTube content creation workflow (settings -> script -> voice -> visuals -> cover -> export)

## Root causes identified

### 1) Quota errors and write lock behavior
- Firestore write quota errors (`resource-exhausted`) were treated as session-blocking in `FirebaseContext`.
- Manual save retry logic in `App.tsx` did not include `resource-exhausted` / quota text, so retries stopped too early and users remained in an error state.

### 2) Configuration mismatches for callable endpoints
- Callable name mapping only accepted canonical keys (`generateImageForPrompt`, `generateVideoForPrompt`).
- Some runtime configs and operator habits use alias keys (`generateImage`, `generateVideo`), causing initialization mismatch in production-like environments.
- Invalid callable resolution errors were not sufficiently explicit during initialization failure.

### 3) Missing project data / project-loss symptoms
- Storage upload pipeline used `projectId || storyForScripting.id`.
- Early generation paths can run before `projectId` is set; fallback to `storyForScripting.id` can misalign Storage paths and make later retrieval appear missing.

### 4) Complex path connection / workflow routing issue
- Visuals step "next" action routed directly to Export and skipped Cover (thumbnail) stage.
- This created workflow discontinuity and contributed to missing expected cover assets.

### 5) Logic spin/initialization resiliency
- Resume routing could honor unsupported views in persisted state and send users to non-primary paths.

## Code changes made

### `appConfig.ts`
- Added callable alias support for config keys:
  - `generateImage` -> `generateImageForPrompt`
  - `generateVideo` -> `generateVideoForPrompt`
- Added one-time warning for unknown callable override keys to surface config drift without breaking runtime.

### `services/geminiService.ts`
- Wrapped callable factory in explicit initialization guard.
- Errors now include actionable prefix:
  - `Callable initialization failed for "<key>" ...`

### `App.tsx`
- Added stable project id derivation (`getStableProjectId`) to avoid Storage path drift before first manual save.
- Updated all upload flows (scene/audio/thumbnail) to use stable derived id.
- Expanded save retry classifier to include `resource-exhausted` and quota-message matches.
- Updated Scene Images next-step route to `ThumbnailMaker` (Cover), restoring intended path.
- Hardened resume view derivation to avoid unsupported utility views (`TitleCardGenerator`, `FreeformImageGenerator`) as primary resume destinations.

### `FirebaseContext.tsx`
- Reset quota block state on sign-out, so a new authenticated session starts cleanly after transient quota incidents.

### `components/features/SceneImageManager.tsx`
- Updated step CTA label from "Final Export" to "Cover Art" to match actual path routing.

## Validation performed
- `npm run lint` passed.
- `npm run build` passed.
- Runtime app loaded successfully via Vite dev server.
- Reviewed flow wiring and confirmed path now proceeds Visuals -> Cover -> Export.

## Ongoing monitoring and maintenance plan

1. **Config drift detection**
   - Keep `STORYMAKR_*` as canonical env schema.
   - Continue supporting legacy aliases short-term; log unknown keys once per boot.
   - Add release checklist item: verify callable names in runtime config and deployed Cloud Functions list.

2. **Quota resilience**
   - Track `resource-exhausted` frequency in client logging pipeline.
   - Add operator runbook for quota incidents:
     - verify Firebase usage quotas
     - verify project billing status
     - re-auth session after quota recovery

3. **Project integrity**
   - Keep project-id-first Storage convention (`story-makr/users/{uid}/projects/{projectId}/...`).
   - During future schema migrations, include storage path compatibility checks.

4. **Workflow path health**
   - Keep explicit route contract:
     - Settings -> Script -> Voice -> Visuals -> Cover -> Export
   - Add a lightweight UI navigation smoke test in future test framework adoption.

5. **Initialization checks**
   - At app startup, verify AI mode and callable map resolution once and surface actionable warnings.

## Stability confirmation
- Current branch code now handles callable config mismatches more safely, stabilizes project-id pathing for uploads, improves quota-related save retries, and restores expected workflow routing.
- Build and type-check are green, and runtime navigation path correctness is validated.
