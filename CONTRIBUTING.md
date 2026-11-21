# Contributing

Thanks for helping improve Taglore.

## Workflow

- Open a pull request from a branch or fork. `main` is protected: a maintainer review and green checks are required to merge.
- For a bigger change, open an issue first, so we can agree on the shape before you write the code.
- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, ...). Taglore uses them for its own fallback notes.
- Keep PRs focused. Add or update tests for behaviour changes.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build        # builds packages, bundles dist/index.js, regenerates schema/
```

`dist/` and `schema/` are committed because GitHub runs the action straight from the repository. CI fails if they are out of date, so run `npm run build` and commit the result with your change.

Try the CLI against any local repo:

```bash
node packages/taglore/dist/cli.js generate --to v1.2.0 --provider none --dry-run
```

## Project structure

- `packages/taglore`: the generator (core, CLI and the GitHub Action entry point)
- `packages/whats-new`: the What's New dialog and changelog page (React and web components)
- `dist/`: the bundled action and browser file, `schema/`: JSON Schemas for the files Taglore writes
- `examples/`: workflows and app setups, `skills/taglore`: the agent skill

Tests run against real git repositories in temp folders, and the GitHub API is mocked in-process, so `npm test` needs no network and no token.

## Releasing (maintainers)

1. Bump the version in `packages/taglore/package.json`, `packages/taglore/src/meta.ts` and `packages/whats-new/package.json`, run `npm run build`, and get it onto `main`.
2. The release workflow sees a version without a tag and does the rest: creates the `vX.Y.Z` tag, writes the notes with Taglore itself into a draft release, attaches the self-contained CLI (`taglore.mjs`), the tarballs and `SHA256SUMS`, attests their build provenance, publishes the release and moves the `vX` major tag.
3. Optional secrets: `COPILOT_TOKEN` (AI notes; without it the notes come from commit messages) and `RELEASE_TOKEN` (to move the major tag when workflow files changed).
4. npm is off until it's turned on. Recommended: add `.github/workflows/release.yml` as a trusted publisher for `taglore` and `@taglore/whats-new` on npmjs.com and set the repository variable `NPM_TRUSTED_PUBLISHING=true` (no token, provenance included). A classic `NPM_TOKEN` secret works too. A package's very first version usually has to be published by hand before a trusted publisher can be added.
5. Tick "Publish this Action to the GitHub Marketplace" on the new release to update the listing.
