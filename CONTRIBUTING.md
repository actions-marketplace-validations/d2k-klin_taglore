# Contributing

Thanks for helping improve Taglore.

## Workflow

- `main` is protected. Open a pull request from a branch or fork; a code owner review and a green `build` check are required to merge.
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

## Releasing (maintainers)

1. Bump the version in `packages/taglore/package.json`, `packages/taglore/src/meta.ts` and `packages/whats-new/package.json`, run `npm run build`, merge.
2. Tag `main` with `vX.Y.Z` and push. The release workflow writes the notes with Taglore itself and moves the `vX` major tag.
