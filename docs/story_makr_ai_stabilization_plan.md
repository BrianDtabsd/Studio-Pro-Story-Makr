# Story Makr AI Stabilization Plan

## Goal
Make Story Makr's Gemini multimodal integration clear, predictable, and Story-Makr-native while still safely interoperating with shared Cloud Functions hosted in `chronos-video-forensics`.

## Current risks observed

1. **Cross-app naming confusion**
   - Runtime config uses `CHRONOS_*` keys in Story Makr code paths.
2. **Callable mismatch risk**
   - Callable names can drift between environment config and deployed functions without a clear per-endpoint contract.
3. **Mixed setup knowledge**
   - Setup guidance does not clearly separate Story Makr defaults from Chronos compatibility behavior.

## Multimodal surface in Story Makr

- Text generation: `generateStoryIdeas`, `generateScript`
- Script understanding: `analyzeScript`, `analyzeCharacterAvatar`
- Audio generation: `generateSpeech`
- Image generation: `generateImageForPrompt`
- Video generation: `generateVideoForPrompt`

## Stabilization sequence

### Phase A (implemented in this branch)
- Introduce Story-Makr-native runtime keys (`STORYMAKR_*`) with legacy `CHRONOS_*` fallback.
- Keep callable integrations centralized through shared typed callable helper.
- Add per-endpoint override env keys for all multimodal callables.
- Document setup in `README.md` and `.env.example`.

### Phase B (next)
- Add startup diagnostics panel (dev only):
  - resolved AI mode
  - resolved callable names
  - missing key warnings
- Add a lightweight "AI health check" action that pings configured callable endpoints and reports pass/fail.

### Phase C (next)
- Add strict response guards for all callable payloads and a shared normalized UI error mapper.
- Standardize retry strategy and timeout envelopes per modality (text/audio/image/video).

### Phase D (next)
- Decouple Story Makr from Chronos-specific semantics in docs and naming entirely (while keeping compatibility shims).
- Move to Story-Makr-specific Cloud Function namespace aliases if desired.

## Deployment notes

- This plan preserves existing deployed callable names by default.
- Existing environments using `CHRONOS_*` continue to function.
- New environments should only set `STORYMAKR_*` keys.
