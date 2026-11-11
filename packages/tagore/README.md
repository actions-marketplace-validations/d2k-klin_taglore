# tagore

Core and CLI of [Tagore](https://github.com/d2k-klin/tagore): AI-written release notes from git tags.

```bash
npx tagore generate --to v1.9.0 --dry-run
npx tagore generate --from v1.7.0 --to v1.9.0 --out ./public/releases
npx tagore --help
```

Programmatic use:

```ts
import { runTagore } from "tagore";

const result = await runTagore({ to: "v1.9.0", publishGithubRelease: false, outputDir: "public/releases" });
console.log(result.markdown);
```

Full documentation: https://github.com/d2k-klin/tagore
