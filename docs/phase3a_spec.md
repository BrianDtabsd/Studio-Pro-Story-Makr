# Phase 3A Spec (Core Workflow Reliability + Story Quality)

## Scope guardrails

This phase only implements core workflow upgrades that improve reliability and output quality without destabilizing existing callable flows (`ideas`, `script`, `analyze`, `speech`, `image`, `video`).

### Included in this run

1. In-app animated, contextual step guidance tied to active navigation state.
2. Completion criteria per active step before advancing.
3. Script output quality contract + duration targeting.
4. Pro-only duration controls with validation bounds.
5. Episodic script workspace layout improvements:
   - Left: selected story context.
   - Center: outline/script workspace.
   - Right: ordered episodes with explicit selection/return behavior.
6. Static guide-page removal in favor of contextual in-view guidance.
7. Script editor flow in workspace (`Send to Editor` + `Accept Edit`).

### Deferred / handoff

- Milestone 3 (audio all-at-once completion path) is not fully implemented in this pass.
- Existing per-scene synthesis/play/download/save behavior remains active and unchanged as baseline behavior.

## Script quality contract

Script generation requests now prepend a strict contract to the outline input:

- include narrator lines, dialogue, and explicit SFX cues.
- include stage/scene direction blocks.
- include visual beat prompts tied to story milestones.
- preserve milestone continuity (setup, escalation, climax, resolution).
- support style blending through guidance anchors (content style, sub-genre, production tone, topic blend) without brittle hardcoded combinations.
- target runtime defaults to 8-12 minutes unless Pro range overrides it.

## Duration control policy

- Default runtime target: **8-12 minutes**.
- Pro controls: editable min/max range.
- Validation bounds: **4-30 minutes**.
- Range is normalized so `min <= max`.
- Non-Pro users keep the default range and can still generate scripts safely.

## Contextual guidance model

Guidance is rendered inside the app shell for non-Hub steps and includes:

1. Animated active-step highlighting.
2. Ordered step rail with completion status.
3. Step-specific instructions.
4. Step-specific completion criteria.

No separate static instruction page is required for workflow navigation.

## Non-negotiable anti-assumption rules

1. Do not claim model/provider capability limits without current docs or runtime probe evidence from this environment.
2. If capability is uncertain, mark it **UNKNOWN** and continue with compatible fallback behavior.
3. Do not block user flow on unverified assumptions.
4. Keep branch/PR traceability explicit for each scoped change.

## Capability certainty notes

- Gemini capability limits for advanced audio compilation behaviors in this repository context are **UNKNOWN** in this run (no runtime probe added yet).
- Current implementation intentionally preserves proven baseline paths while Milestone 3 is pending.
