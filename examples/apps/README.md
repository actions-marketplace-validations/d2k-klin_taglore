# Using the release notes in your app (any language)

Taglore only produces files. Any stack can ship and read them.

```text
1. Tag push       ->  Taglore writes release-notes/latest.json, release.json, RELEASE_NOTES.md
2. docker build   ->  your Dockerfile copies release-notes/ into the image
3. Container runs ->  your app serves or reads the JSON. No network, no database, no AI at runtime.
```

In your workflow, run Taglore before the image build ([docker.yml](../workflows/docker.yml)):

```yaml
- uses: d2k-klin/taglore@v1
  with:
    output-dir: release-notes    # anywhere inside the Docker build context
- run: docker build -t myapp:${{ github.ref_name }} .
```

## Backends and servers

| Stack | How it's served | Example |
|---|---|---|
| Static site / SPA on nginx | `COPY release-notes/ /usr/share/nginx/html/release-notes/` | [static-nginx](static-nginx) |
| Node.js (Express, Fastify, Nest) | static middleware or `readFileSync` | [node-express](node-express) |
| Python (FastAPI, Flask, Django) | `StaticFiles` mount or `json.loads` | [python-fastapi](python-fastapi) |
| Go | `//go:embed` into the binary | [go](go) |
| Java (Spring Boot) | `output-dir: src/main/resources/static/release-notes` | [java-spring](java-spring) |
| .NET (ASP.NET Core) | copy to `wwwroot/release-notes/` | [dotnet](dotnet) |
| Next.js | `output-dir: public/release-notes` | [nextjs](nextjs) |

Anything else works the same way: copy the folder into the image and serve `latest.json` at a URL, or read it from disk. The format is described by [schema/release.schema.json](../../schema/release.schema.json); generate types from it with any JSON Schema tool (quicktype, datamodel-code-generator, etc.).

## Frontends

| Frontend | Use |
|---|---|
| Anything with HTML (plain, server templates, Vue, Angular, Svelte) | `<taglore-whats-new>` web component, see [any-frontend](any-frontend) |
| React / Next.js | `<WhatsNew />` or `useWhatsNew()` from `@taglore/whats-new` |
| Mobile, desktop, CLI | fetch `latest.json` and compare `version` with the last one the user saw |

The rule every client follows: show the announcement when `announce` is `true` and `version` is newer than the version the user last acknowledged. Patch releases keep the previous announcement in `latest.json`, so they never re-announce.

## Not using Docker?

Use `upload-artifact` and download the files in your deploy job, or `s3-uri` to publish them to a bucket/CDN and point your app at that URL.
