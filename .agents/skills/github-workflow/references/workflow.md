# VECTA Train — GitHub Workflow

## Model

GitHub Flow. Single long-lived branch: `main` (production). No `dev` branch. QA happens on per-PR Vercel preview deployments.

## Branching

1. Create feature branch off `main` (e.g. `feature/x`).
2. Commit freely on the feature branch (any number of WIP commits).
3. Open a PR to `main`. Title must follow Conventional Commits
   (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`, `build:`, `ci:`, `revert:`).
4. PR description auto-fills from `.github/pull_request_template.md`.
5. QA the change on the PR's Vercel preview URL.
6. Merge with "Squash and merge" — the PR title becomes the single commit message on main. Head branch is auto-deleted after merge.

## Branch protection (main ruleset)

- No direct pushes: PR required (required approvals: 0 — solo dev).
- Required status check: "Validate PR title".
- Require linear history (squash-only; merge commits and rebase disabled).
- Block force pushes. Restrict deletions.
- Bypass list: Repository admin (for automation).

## Repo merge settings

- Squash merging: ON, commit message = Pull request title.
- Merge commits: OFF. Rebase merging: OFF.
- Automatically delete head branches: ON.

## CI/CD workflows (`.github/workflows/`)

- `pr-title.yml` — validates PR titles against Conventional Commits
  (amannn/action-semantic-pull-request@v6). Required check on main.
- `release.yml` — semantic-release runs on every push to main:
  - Analyzes commit messages: `fix` → patch, `feat` → minor,
    `feat!`/BREAKING CHANGE → major.
  - Auto-generates version, git tag, and GitHub Release notes.
  - No commit-back to repo; uses GITHUB_TOKEN only.
- All actions on Node 24 runtime majors:
  `actions/checkout@v6`, `actions/setup-node@v6`, `pnpm/action-setup@v6`.
  Workflow Node version: 24.

## Vercel

- Native Git integration handles all deploys (2 projects, one per app;
  Root Directory set per app).
- Ignored Build Step (both projects):
  build only on main or when a PR is open:
  ```bash
  if [ "$VERCEL_GIT_COMMIT_REF" = "main" ] || [ -n "$VERCEL_GIT_PULL_REQUEST_ID" ]; then
    exit 1
  else
    exit 0
  fi
  ```
- `main` = production. Open PRs = preview deployments (used for QA).
- Draft PRs still build (native integration cannot detect draft state —
  accepted trade-off).

## Releases

- Fully automatic via semantic-release on merge to main.
- Version bumps are derived from commit types; no manual tagging,
  no release branches, no back-merges.

## Removed / not used

- `dev` branch and its ruleset (divergence problems).
- Release branches and back-merge workflows.
- `guard-main.yml` (no merge commits to guard against).
- `default-draft.yml` (didn't work with GITHUB_TOKEN; no value).
- Vercel CLI preview workflow and its secrets (reverted to native).