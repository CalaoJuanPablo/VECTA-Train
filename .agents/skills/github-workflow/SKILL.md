---
name: github-workflow
description: "Trigger: PR, push, branch, commit, squash, github flow. Apply VECTA Train's GitHub Flow with squash-merge rules."
license: Apache-2.0
metadata:
  author: "calaojuanpablo"
  version: "1.0"
---

## Activation Contract

Load when the user is about to branch, commit, push, open a PR, or otherwise move code in the VECTA Train repo. Also load when designing commit strategies or chained PRs.

## Hard Rules

| Rule | Reason |
|------|--------|
| One long-lived branch: `main`. No `dev`. | Solo dev, Vercel preview per PR handles QA. |
| Squash-merge only. Merge commits and rebase merging are OFF. | Repo enforces linear history. |
| PR title becomes the single commit message on main. | `pull_request_title` is the merge commit subject. |
| Required status check: `Validate PR title` (amannn/action-semantic-pull-request@v6). | Conventional Commits enforcement. |
| Branch protection: no direct pushes to main; required approvals: 0 (solo dev). | Branch protection ruleset on main. |
| Local commits are scratch. Squash-merge flattens history on main. | Do NOT waste effort on perfect local history — only the PR title survives. |
| Do NOT use `git rebase` on local commits just to clean them up. | Pointless: squash-merge discards the local history anyway. |
| PR titles must match Conventional Commits types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`. | pr-title.yml rejects non-conforming titles. |

## Decision Gates

| Question | Decision |
|----------|----------|
| PR over 400 lines? | Split into chained PRs. Each PR stays under the line budget. |
| Two PRs both touch overlapping files? | PR #2 branches off main AFTER PR #1 squash-merges. Do not stack on the same feature branch. |
| Local commit history messy? | Leave it. Squash-merge handles it. |
| User says "I will push manually"? | Stop before any `git push` or `gh pr create`. Hand off cleanly. |
| User asks to rebase local commits? | Push back: "Squash-merge makes local rebase pointless. What problem are you actually solving?" |

## Execution Steps

1. Branch from `main`: `git switch -c feat/<scope> main`.
2. Commit freely. Local commits can be WIP, fixup, or any shape.
3. Stop before push. The user pushes manually unless they explicitly delegate it.
4. When opening a PR, write the title in Conventional Commits format. The PR description auto-fills from `.github/pull_request_template.md`.
5. Vercel native integration deploys PR previews automatically (no CLI workflow).
6. After QA passes, the user merges via "Squash and merge" — only the PR title commit lands on main.

## Output Contract

When asked about workflow, return:

- Branch name (off `main`)
- PR title (Conventional Commits, single line)
- Whether to push (yes only if user delegates)
- Any chained-PR strategy if the change is oversized

Do not propose local-history cleanups (rebase, fixup, autosquash). They are wasted work in this workflow.

## References

- `.github/workflows/pr-title.yml` — PR title validation
- `.github/pull_request_template.md` — PR description template
- `.github/workflows/release.yml` — semantic-release on push to main
- `AGENTS.md` — repo-level conventions including PR title allowed types