# Phase 3A Checklist

## Milestone 1 — Script quality contract

- [x] Add explicit script output contract guidance to script generation input.
- [x] Include narrator/dialogue/SFX/stage-direction/visual-beat requirements.
- [x] Add default script duration target (8-12 minutes).
- [x] Add Pro-only duration controls with validation bounds (4-30 minutes).
- [x] Keep style combinations guidance-based (no brittle hardcoding).
- [x] Validate milestone with `npm run lint`.
- [x] Validate milestone with `npm run build`.

## Milestone 2 — Episodic workflow UX

- [x] Replace static guide-page UX with contextual in-app guidance.
- [x] Tie guidance to active navigation state.
- [x] Show completion criteria per step.
- [x] Script workspace layout: left context / center script area / right ordered episodes.
- [x] Add clear episode selection and return-to-pending behavior.
- [x] Implement real editor flow in script workspace (`Send to Editor`, `Accept Edit`).
- [x] Validate milestone with `npm run lint`.
- [x] Validate milestone with `npm run build`.

## Milestone 3 — Audio all-at-once completion

- [x] Start all-at-once audio path with compiled master retention + per-scene clips preserved.
- [x] Add progress + retry + failure messaging in voice workflow.
- [ ] Fully validate end-to-end compiled-master save/export behavior in manual walkthrough.
- [x] Default narrator/unassigned voice resolves to male.
- [ ] Runtime docs/probe evidence for any model capability claims.

## Evidence and handoff

- [x] Branch used: `cursor/story-makr-core-workflow-3ffe`.
- [x] Single active PR updated for this branch.
- [ ] Manual walkthrough video captured (script contract, episodic workflow, audio completion path).
- [x] Milestone 3 left with explicit pending checklist for next pass.
