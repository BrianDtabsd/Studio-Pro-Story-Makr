# AGENTS.md

## Purpose
This file defines a strict workflow so Story Makr changes do not "disappear" due to branch/PR confusion.

## Non-negotiable workflow
1. Work on exactly one feature branch at a time.
2. Keep exactly one active PR for that branch into `main`.
3. Do not start new changes until the active PR is either merged or explicitly parked.
4. For each issue: one scoped fix, one commit, one push, one verification.

## User-facing GitHub checklist (explicit)
When an agent says "done", do these in order:
1. Open GitHub PR list.
2. Confirm which PR is the active one (head branch and base branch).
3. Merge the active PR into `main` (prefer Squash and merge).
4. Delete the merged branch (optional but recommended).
5. In local terminal:
   - `git fetch origin`
   - `git switch main`
   - `git pull origin main`
6. Restart app/dev server and verify.

If step 5 is skipped, browser behavior may still show old code.

## Visibility-failure protocol (first-class incident)
If "changes are not showing in app", STOP all new feature work and run only:
1. `git branch --show-current`
2. `git fetch origin`
3. `git rev-list --left-right --count origin/main...origin/<working-branch>`
4. `gh pr list --state open --base main`

Interpretation:
- If divergence is non-zero, `main` and working branch are not aligned yet.
- If multiple PRs are open for the same area, close/merge down to one active PR.

## Branch/PR safety rules for agents
- Always state the exact branch being modified.
- Always push after each scoped fix.
- Always update the existing PR instead of opening overlapping PRs for the same scope.
- Never claim "fixed" without proving where the fix lives:
  - branch name
  - PR number
  - whether `main` contains the commit yet

## Recovery anchor policy
- Keep one documented fallback anchor branch for emergency rollback.
- Current historical fallback reference branch: `brian/wip-storymakr-local-backup` (do not force-push it).

## Scope discipline
- One issue at a time.
- No opportunistic refactors during incident fixes.
- If a fix requires broader refactor, pause and ask for explicit approval.

## Cursor Cloud specific instructions

### Project overview
Story Makr is a React 19 + TypeScript SPA built with Vite. It is a frontend-only repository; all backend services (Firebase Auth, Firestore, Cloud Functions, Storage) are hosted remotely on the `chronos-video-forensics` Firebase project. No Docker, no local backend, no Firebase emulators.

### Running the app
- `npm run dev` — starts Vite dev server on port 3000 (binds `0.0.0.0`).
- The app requires Google Sign-In via Firebase Auth. Without a valid OAuth domain, sign-in will not work in sandboxed/cloud environments.

### Lint / Build / Test
- `npm run lint` — runs `tsc --noEmit` (TypeScript type-check only; no ESLint configured).
- `npm run build` — runs `vite build` (production bundle).
- There are no automated tests or test framework configured in this project.

### First-time environment setup
- Run `cp .env.example .env.local` and populate `GEMINI_API_KEY` (available as a Cursor Cloud secret / environment variable).
- The `.env.local` file is gitignored and must be recreated per environment.

### CLI tools available
- **Firebase CLI** (`firebase`) — installed globally via npm. Use for `firebase deploy`, `firebase emulators`, etc.
- **Google Cloud CLI** (`gcloud`) — installed at `/opt/google-cloud-sdk/`. PATH is configured via `/etc/profile.d/gcloud.sh` and `~/.bashrc`. If `gcloud` is not found in a non-interactive shell, run `export PATH="/opt/google-cloud-sdk/bin:$PATH"`.

### Environment variables
- `GEMINI_API_KEY` must be set in `.env.local` (required for AI features).
- See `README.md` § "Production reliability checklist" for optional keys (`VITE_STRIPE_PUBLISHABLE_KEY`, etc.).
