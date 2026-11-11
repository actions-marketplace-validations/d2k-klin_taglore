# Next.js integration

1. In your tag workflow, run Tagore with `output-dir: public/releases` before `docker build` ([nextjs-docker.yml](../workflows/nextjs-docker.yml)).
2. `npm install @tagore/whats-new`
3. Add [`whats-new.tsx`](whats-new.tsx) to `app/` and render it in [`layout.tsx`](layout.tsx).
4. Make sure the Dockerfile copies `public/` into the runtime image ([Dockerfile](Dockerfile)) and `.dockerignore` doesn't exclude `public/releases`.

The container then serves `GET /releases/latest.json`, and the dialog shows each major/minor announcement once per browser.

Add `public/releases/` to `.gitignore` so local builds don't ship stale notes:

```gitignore
public/releases/
```

## Build-time import instead of fetch

If you'd rather not fetch at runtime, import the file in a Server Component and pass it down. Add a placeholder `public/releases/latest.json` for local dev.

```tsx
import notes from "@/public/releases/latest.json";
import { WhatsNew, type ReleaseNotes } from "@tagore/whats-new";

<WhatsNew data={notes as ReleaseNotes} />;
```
