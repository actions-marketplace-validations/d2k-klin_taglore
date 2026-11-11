# Tagore

**AI-written release notes from git tags.** Push `v1.9.0`, and Tagore compares it with the right earlier version, has GitHub Copilot write user-friendly notes, and publishes them to:

- **GitHub Releases** (Markdown, by default)
- **a folder** for your Docker build, e.g. `public/releases/latest.json` in a Next.js app
- **a workflow artifact** for a later job
- **S3** for apps or CDNs that fetch notes at runtime
- **your app's What's New dialog** via [`@tagore/whats-new`](packages/whats-new)

No database, no SaaS, no AI calls at runtime. Notes ship with the image they describe.

```yaml
# .github/workflows/release-notes.yml
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
          fetch-depth: 0 # Tagore needs tags and history
      - uses: d2k-klin/tagore@v1
        with:
          copilot-token: ${{ secrets.COPILOT_TOKEN }}
```

## How versions are compared

Tagore follows SemVer and treats user-facing releases differently from maintenance releases.

| Tag | Compared with (`compare: auto`) | Notes written by | GitHub Release | In-app announcement |
|---|---|---|---|---|
| `v2.0.0` major | last minor, `v1.9.0` | AI | yes | **new** |
| `v1.9.0` minor | previous minor, `v1.8.0` (covers all 1.8.x patches) | AI | yes | **new** |
| `v1.9.1` patch | previous tag, `v1.9.0` | commit messages | yes | keeps `v1.9.0`'s |
| `v2.0.0-rc.1` | previous tag | commit messages | prerelease | none |
| first release | root commit | AI | yes | new |

Other modes: `previous-tag`, `previous-minor`, `previous-major`, or `explicit` with your own `from`/`to` (any tags, SHAs or branches). `ai-for` and `announce-on` change which release types get AI notes and announcements.

**Patch releases keep the last announcement.** Every release gets a `tagore.json` asset. On a patch, Tagore downloads the announcement from the last minor's release and writes it as `latest.json`, so the image you build for `v1.9.1` still contains the `v1.9.0` What's New.

## GitHub Copilot setup

Tagore installs the Copilot CLI if it isn't on the runner and calls it **with no tools allowed**, in an empty temp folder. Tagore collects the commits and diff itself; Copilot only reads the prompt and returns JSON.

| Repository | What to do |
|---|---|
| **Personal account** | Create a fine-grained PAT with the **Copilot Requests** permission, save it as a secret (e.g. `COPILOT_TOKEN`) and pass `copilot-token: ${{ secrets.COPILOT_TOKEN }}`. |
| **Organization** | Add `copilot-requests: write` to `permissions:` and skip `copilot-token`. Works when the org policy "Allow use of Copilot CLI billed to the organization" is on. |

Prefer another model source? `ai-provider: github-models` uses the GitHub Models API with the workflow token (`permissions: models: read`). `ai-provider: none` writes notes from Conventional Commits only.

If the AI call fails, Tagore falls back to commit-based notes and keeps your release going (`on-ai-failure: fail` to stop instead).

## Recipes

### Next.js + Docker

```yaml
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - id: notes
        uses: d2k-klin/tagore@v1
        with:
          copilot-token: ${{ secrets.COPILOT_TOKEN }}
          output-dir: public/releases
      - run: docker build -t ghcr.io/${{ github.repository }}:${{ github.ref_name }} .
```

The image then serves `GET /releases/latest.json`. Show it with:

```tsx
// app/whats-new.tsx
"use client";
import { WhatsNew } from "@tagore/whats-new";
import "@tagore/whats-new/styles.css";

export default function AppWhatsNew() {
  return <WhatsNew storageKey="myapp:whats-new" />;
}
```

Render `<AppWhatsNew />` once in your root layout. Users see each major/minor announcement once; new users start up to date (`showOnFirstVisit` to change that). Use the `useWhatsNew()` hook or the `children` render prop to plug into your own dialog (shadcn/ui etc.). See [examples/nextjs](examples/nextjs).

### S3

```yaml
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/release-notes
          aws-region: eu-central-1
      - uses: d2k-klin/tagore@v1
        with:
          s3-uri: s3://my-bucket/myapp/releases/
```

Needs `id-token: write` for OIDC. The role only needs `s3:PutObject` on that prefix. `latest.json` is uploaded with a 60-second cache, `release.json` as immutable.

### Artifact for another job

```yaml
      - uses: d2k-klin/tagore@v1
        with:
          upload-artifact: release-notes
# later job:
      - uses: actions/download-artifact@v5
        with: { name: release-notes, path: public/releases }
```

### Compare any two versions

```yaml
on:
  workflow_dispatch:
    inputs:
      from: { required: true }
      to: { required: true }
# ...
      - uses: d2k-klin/tagore@v1
        with:
          from: ${{ inputs.from }}
          to: ${{ inputs.to }}
          publish-github-release: false
          upload-artifact: true
```

### Review majors before they go out

Use `release-draft: true` for major tags, or run the publishing job in a GitHub Environment with required reviewers. See [examples/workflows/major-review.yml](examples/workflows/major-review.yml).

More in [examples/workflows](examples/workflows).

## Inputs

| Input | Default | Description |
|---|---|---|
| `to` | triggering tag | Release tag |
| `from` | | Base ref; switches `compare` to `explicit` |
| `compare` | `auto` | `auto`, `previous-tag`, `previous-minor`, `previous-major`, `explicit` |
| `tag-prefix` | `v` | Tag prefix, e.g. `app-v` for monorepos |
| `ai-provider` | `copilot` | `copilot`, `github-models`, `none` |
| `model` | provider default | Model id |
| `copilot-token` | | Fine-grained PAT with Copilot Requests (personal repos) |
| `copilot-version` | `latest` | `@github/copilot` version to install |
| `ai-for` | `major,minor` | Release types that get AI notes |
| `on-ai-failure` | `fallback` | `fallback` or `fail` |
| `language` | `English` | Language of the notes |
| `tone` | `friendly and concise` | Writing tone |
| `audience` | `end users of the application` | Who reads the notes |
| `product-name` | repo name | Name used in the prompt |
| `instructions` | | Extra guidance for the AI |
| `exclude` | | Extra globs kept out of the AI context |
| `max-diff-kb` | `100` (`20` for github-models) | Diff size sent to the AI |
| `publish-github-release` | `true` | Create/update the GitHub Release and attach `tagore.json` |
| `release-draft` | `false` | Create new releases as drafts |
| `include-commits` | `true` | Collapsible commit list in the Markdown |
| `output-dir` | | Write `latest.json`, `release.json`, `RELEASE_NOTES.md` here |
| `upload-artifact` | `false` | `true` or an artifact name |
| `s3-uri` | | `s3://bucket/prefix/` |
| `s3-region` | AWS env | Region for S3 |
| `announce-on` | `major,minor` | Release types that create a new announcement |
| `baseline-file` | | Local `tagore.json` to reuse instead of downloading it |
| `dry-run` | `false` | Generate and print only |
| `github-token` | `github.token` | Token for Releases / GitHub Models |
| `working-directory` | workspace | Repository folder |

**Outputs:** `version`, `previous-version`, `release-type`, `announce`, `provider`, `release-url`, `markdown`, `json`, `latest-json-path`, `release-json-path`, `markdown-path`, `artifact-name`.

## CLI

Same engine, for local previews or other CI systems:

```bash
npx tagore generate --to v1.9.0 --dry-run                 # preview
npx tagore generate --from v1.7.0 --to v1.9.0 --out ./public/releases
npx tagore generate --github --repo owner/app              # publish (needs GITHUB_TOKEN)
npx tagore --help
```

## Files and format

| File | Content |
|---|---|
| `latest.json` | The announcement apps should show: this release if it announces, otherwise the last one that did |
| `release.json` | Structured notes for this exact release (also attached to the GitHub Release as `tagore.json`) |
| `RELEASE_NOTES.md` | Markdown, same as the GitHub Release body |

JSON follows [`schema/release.schema.json`](schema/release.schema.json): `version`, `previousVersion`, `releaseType`, `announce`, `date`, `title`, `summary`, `highlights[]`, `improvements[]`, `fixes[]`, `breaking[]`, `generator`.

## Security

- AI output is untrusted: Tagore validates it against the schema, enforces length limits and strips HTML, links, URLs and control characters before anything is published. `@tagore/whats-new` renders plain text only.
- The prompt tells the model to treat commits and code as data; Copilot runs without tools in an empty folder, so injected instructions can't run commands or read files.
- Lockfiles, build output, binaries, images, `.env*`, `*.pem` and `*.key` never reach the AI. Add more with `exclude`.
- Don't run Tagore on `pull_request_target` or fork-triggered workflows with secrets.
- S3 uses the job's AWS credentials (OIDC). Tagore never takes AWS keys as inputs.

## Use it with an AI coding agent

[`skills/tagore/SKILL.md`](skills/tagore/SKILL.md) teaches Claude Code, GitHub Copilot and other agents how to add Tagore to a project. Copy the folder into `.claude/skills/tagore/` or `.github/skills/tagore/` of your app repo, then ask: *"Set up Tagore release notes for this app."*

## Repository layout

```text
action.yml               GitHub Action (runs dist/index.js)
dist/                    Bundled action, committed
packages/tagore/         Core + CLI (npm: tagore)
packages/whats-new/      React component (npm: @tagore/whats-new)
schema/                  JSON schema
examples/                Workflows and Next.js integration
skills/tagore/           Agent skill
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). `main` is protected; changes go through pull requests.

## License

[MIT](LICENSE)
