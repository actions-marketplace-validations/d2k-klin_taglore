---
name: taglore
description: Set up, configure or troubleshoot Taglore (d2k-klin/taglore), the GitHub Action and CLI that writes AI release notes from git tags and publishes them to GitHub Releases, a Docker build folder, artifacts, S3 and an in-app What's New dialog. Use when asked to add release notes automation, a What's New dialog, or Taglore to a repository.
---

# Taglore: AI release notes from git tags

Taglore runs on a tag push (`v1.9.0`), picks the right base version, asks GitHub Copilot (or GitHub Models) for user-facing notes, validates and sanitizes them, and publishes them. Patch releases reuse the last major/minor announcement, so the app only announces meaningful releases.

Source and full docs: https://github.com/d2k-klin/taglore

## 1. Inspect the target repository first

Before writing anything, find out:

1. **Tag style.** Run `git tag --list | tail -20`. Taglore expects SemVer tags with a prefix (default `v`). For prefixes like `web-v1.2.3`, set `tag-prefix: web-v`. If there are no tags, tell the user Taglore needs releases tagged `vX.Y.Z`.
2. **Existing release workflow.** Look in `.github/workflows/` for a workflow triggered by `push: tags`. If one exists (Docker build, deploy), add Taglore as a step **before** the Docker build in that workflow. Do not create a second tag-triggered workflow that races it.
3. **Account type.** Personal repo or organization repo. This decides Copilot auth (step 3).
4. **App type.** Next.js (look for `next.config.*`), other React app, or no frontend. Only add the What's New component when there is a React frontend and the user wants in-app announcements.
5. **Where the notes should go.** Ask only if unclear: GitHub Release only (default), into the Docker image, as an artifact, and/or S3.

## 2. Add the workflow step

Always use `fetch-depth: 0`; Taglore fails on shallow clones because it needs tags and history.

Minimal (GitHub Release only):

```yaml
on:
  push:
    tags: ["v*"]
permissions:
  contents: write
jobs:
  release-notes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: d2k-klin/taglore@v1
        with:
          copilot-token: ${{ secrets.COPILOT_TOKEN }}
```

Pick the extra inputs from what the user needs:

| Need | Inputs |
|---|---|
| Notes inside a Next.js Docker image | `output-dir: public/releases` (step runs before `docker build`) |
| Hand files to another job | `upload-artifact: release-notes`, then `actions/download-artifact` in that job |
| Upload to S3 | `aws-actions/configure-aws-credentials` with an OIDC role first, `permissions: id-token: write`, then `s3-uri: s3://bucket/prefix/` |
| Compare specific versions | `from: v1.7.0` and `to: v1.9.0` (any refs; switches to explicit compare) |
| Notes only, no GitHub Release | `publish-github-release: false` |
| Review before publishing | `release-draft: true`, or run the job in an Environment with required reviewers |
| Different language or voice | `language`, `tone`, `audience`, `product-name`, `instructions` |
| Keep paths away from the AI | `exclude: "infra/**, **/*.sql"` (lockfiles, build output, images, `.env*`, keys are always excluded) |

Ready-made workflows to copy and adapt live in `examples/workflows/` of the Taglore repo: `basic.yml`, `nextjs-docker.yml`, `artifact.yml`, `s3.yml`, `compare-explicit.yml`, `major-review.yml`.

## 3. Copilot authentication

- **Personal repository:** the workflow token cannot pay for Copilot. Tell the user to create a fine-grained personal access token with the **Copilot Requests** permission, store it as the repo secret `COPILOT_TOKEN`, and keep `copilot-token: ${{ secrets.COPILOT_TOKEN }}`. You cannot create the token for them.
- **Organization repository:** add `copilot-requests: write` to the workflow `permissions:` and drop `copilot-token`. This works when the org policy "Allow use of Copilot CLI billed to the organization" is enabled.
- **No Copilot:** use `ai-provider: github-models` with `permissions: models: read`, or `ai-provider: none` for notes from Conventional Commits.

Never put tokens in the workflow file. If generation fails, Taglore falls back to commit-based notes and the release continues (`on-ai-failure: fail` to stop instead).

## 4. In-app What's New (React / Next.js)

Only when the notes are in the image (`output-dir: public/releases`) or on S3/CDN.

1. `npm install @taglore/whats-new`
2. Create a client component:

```tsx
// app/whats-new.tsx
"use client";
import { WhatsNew } from "@taglore/whats-new";
import "@taglore/whats-new/styles.css";

export default function AppWhatsNew() {
  return <WhatsNew storageKey="<app-name>:whats-new" />;
}
```

3. Render `<AppWhatsNew />` once in the root layout (`app/layout.tsx`), inside `<body>`.
4. If notes come from S3/CDN, pass `url="https://cdn.example.com/app/releases/latest.json"`.
5. To match an existing design system (shadcn/ui, MUI), use the headless form instead of the default dialog:

```tsx
<WhatsNew>{({ notes, open, dismiss }) => /* render your own Dialog */ null}</WhatsNew>
```

Behaviour to explain to the user: each major/minor announcement shows once per browser; acknowledgment is stored in `localStorage` under `storageKey`; first-time visitors are marked up to date silently unless `showOnFirstVisit` is set; patch releases never re-announce.

**Docker check:** make sure `public/` is copied into the final image (standard Next.js standalone Dockerfiles do `COPY --from=builder /app/public ./public`) and that `.dockerignore` does not exclude `public/releases`.

## 5. Verify

- Preview locally without publishing: `npx taglore generate --to <existing-tag> --provider none --dry-run`
- With Copilot locally (needs `npm i -g @github/copilot` and a logged-in Copilot CLI or `COPILOT_GITHUB_TOKEN`): `npx taglore generate --to <tag> --dry-run`
- After the first tag push, check the run summary, the GitHub Release body, and that the release has a `taglore.json` asset (patch releases need it on the previous minor).

## Version rules (for answering questions)

- `compare: auto`: patch compares with the previous tag; minor and major compare with the previous `X.Y.0`, which covers all patches in between. First release compares from the root commit. Prereleases are never used as a base.
- `ai-for` (default `major,minor`): which release types get AI notes; others use commit messages.
- `announce-on` (default `major,minor`): which release types write a new `latest.json`. Other releases copy the last announced `taglore.json` from GitHub Releases (or from `baseline-file`).

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Shallow clone detected" | `actions/checkout` with `fetch-depth: 0` |
| "No release tag found" | Workflow not triggered by a tag; pass `to:` |
| "is not a semver tag" | Set `tag-prefix`, or use `from`/`to` (explicit compare) |
| Copilot 401/403, or fallback notes every time | Personal repo without `copilot-token`, PAT missing Copilot Requests, or org policy off. Check the run log warning |
| `latest.json` missing on a patch | The previous minor release has no `taglore.json` asset (released before Taglore). Re-run Taglore for that tag once, or pass `baseline-file` |
| GitHub Models 413 or token limit | Lower `max-diff-kb` (default 20 for github-models) |
| Notes mention internal work | Add guidance in `instructions`, or `exclude` the paths |
