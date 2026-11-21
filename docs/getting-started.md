# Try Taglore in 10 minutes

This guide takes a repository that already has version tags from "nothing" to release notes on GitHub and a What's New dialog in the app. Each step works on its own, so you can stop after any of them.

You need a repository with at least two version tags like `v1.0.0` and `v1.1.0`. No tags yet? `git tag v0.1.0 && git push --tags` on an older commit and `v0.2.0` on a newer one is enough to try it.

## 1. See the notes locally (2 minutes, nothing to install)

Download the self-contained CLI (one file, Node 20 or later) and run it in your repository:

```bash
curl -LO https://github.com/d2k-klin/taglore/releases/latest/download/taglore.mjs
node taglore.mjs generate --to v1.1.0 --provider none --dry-run --preview review.html
```

`--provider none` writes notes from your commit messages, without AI, so this works without any token. Open `review.html`: it shows the notes as users would see them, next to the commits behind every line.

Add `--provider copilot` (needs [Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli) signed in) to see the AI-written version of the same release.

## 2. Notes on every GitHub Release (3 minutes)

Create `.github/workflows/release-notes.yml`:

```yaml
on:
  push:
    tags: ["v*"]

permissions:
  contents: write

jobs:
  notes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0 # tags and history
      - uses: d2k-klin/taglore@v1
        with:
          copilot-token: ${{ secrets.COPILOT_TOKEN }}
```

For AI notes, Taglore needs Copilot access:

- **Personal repository:** create a [fine-grained token](https://github.com/settings/personal-access-tokens/new) with the **Copilot Requests** permission and save it as the `COPILOT_TOKEN` secret.
- **Organization repository:** drop `copilot-token` and add `copilot-requests: write` to `permissions`, if your organization allows Copilot CLI. See [GitHub Copilot setup](../README.md#github-copilot-setup).

No Copilot? Leave the token out: Taglore falls back to notes from your commit messages and the release still goes through.

Push the next tag. The GitHub Release gets the notes, with a `taglore.json` attached for the next run.

## 3. What's New in your app (5 minutes)

Write the notes into the folder your app serves, before the image is built:

```yaml
      - uses: d2k-klin/taglore@v1
        with:
          copilot-token: ${{ secrets.COPILOT_TOKEN }}
          output-dir: public/release-notes   # wherever your app serves static files
          web-components: true               # writes taglore-whats-new.js next to the JSON
      - run: docker build -t my-app:${{ github.ref_name }} .
```

Then add two lines to your page:

```html
<script type="module" src="/release-notes/taglore-whats-new.js"></script>
<taglore-whats-new src="/release-notes/latest.json" storage-key="my-app:whats-new"></taglore-whats-new>
```

Each user sees each announcement once. New visitors start up to date. React apps use the [React component](../packages/whats-new) instead, and backends in any language can read `latest.json` directly: see [the examples](../examples/apps).

## 4. Optional next steps

| You want | Add |
|---|---|
| A changelog page | `<taglore-changelog src="/release-notes/history.json">` |
| No statement without a real commit behind it | `evidence: strict` |
| A human to approve the notes first | [Review before publishing](../README.md#review-before-publishing-evidence-and-preview) |
| Vulnerabilities fixed and introduced, plus an SBOM | `security-scan: true` |
| Notes for your earlier releases | `backfill: 20` (once) |
| Release Please or a monorepo | [With Release Please](../README.md#with-release-please), [Monorepos](../README.md#monorepos) |

## Tell us how it went

Taglore is young, and the next features are chosen from what gets in people's way. If you tried it, [open an adoption report](https://github.com/d2k-klin/taglore/issues/new?template=adoption_report.yml): two minutes, and it helps more than a star.
