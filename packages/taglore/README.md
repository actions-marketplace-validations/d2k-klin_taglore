# taglore

Core and CLI of [Taglore](https://github.com/d2k-klin/taglore): AI-written release notes from git tags.

```bash
npx taglore generate --to v1.9.0 --dry-run
npx taglore generate --from v1.7.0 --to v1.9.0 --out ./public/releases
npx taglore --help
```

Programmatic use:

```ts
import { runTaglore } from "taglore";

const result = await runTaglore({ to: "v1.9.0", publishGithubRelease: false, outputDir: "public/releases" });
console.log(result.markdown);
```

Full documentation: https://github.com/d2k-klin/taglore
