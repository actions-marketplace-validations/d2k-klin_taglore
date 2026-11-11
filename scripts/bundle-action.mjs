// Bundles the GitHub Action into a single committed file: dist/index.js
import { build } from "esbuild";

await build({
  entryPoints: ["packages/taglore/src/action.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  minify: true,
  legalComments: "external",
  logLevel: "info",
  // Some CommonJS dependencies call require(); give the ESM bundle one.
  banner: {
    js: "import { createRequire as __tagloreCreateRequire } from 'node:module'; const require = __tagloreCreateRequire(import.meta.url);",
  },
});
