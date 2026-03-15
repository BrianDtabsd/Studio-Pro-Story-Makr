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
