import { collectChanges, DEFAULT_EXCLUDES } from "./collect.js";
import { fallbackNotes } from "./fallback.js";
import { git, isShallow, listTags, refDate, resolveRef } from "./git.js";
import { renderMarkdown } from "./markdown.js";
import { TAGORE_VERSION } from "./meta.js";
import { buildPrompt, extractJson } from "./prompt.js";
import { copilotProvider } from "./providers/copilot.js";
import { githubModelsProvider } from "./providers/github-models.js";
import { writeOutputDir } from "./publish/files.js";
import { GitHubReleases, parseRepo, RELEASE_ASSET_NAME } from "./publish/github-release.js";
import { uploadToS3 } from "./publish/s3.js";
import { sanitizeNotes } from "./sanitize.js";
import { AiNotesSchema, ReleaseNotesSchema, SCHEMA_VERSION } from "./schema.js";
import { announcementBase, compareSemver, parseSemver, releaseTypeOf, resolveBase, shouldAnnounce } from "./version.js";
const consoleLog = { info: (m) => console.log(m), warn: (m) => console.warn(`warning: ${m}`) };
async function currentTag(cwd) {
    const ref = process.env.GITHUB_REF ?? "";
    if (ref.startsWith("refs/tags/"))
        return ref.slice("refs/tags/".length);
    try {
        return (await git(["describe", "--tags", "--exact-match", "HEAD"], cwd)).trim();
    }
    catch {
        throw new Error('No release tag found. Run on a tag push, or pass "to" (e.g. --to v1.9.0).');
    }
}
function makeProvider(o) {
    switch (o.provider ?? "copilot") {
        case "none":
            return null;
        case "github-models": {
            const token = o.githubToken ?? process.env.GITHUB_TOKEN;
            if (!token)
                throw new Error("github-models needs a GitHub token (GITHUB_TOKEN with models: read).");
            return githubModelsProvider({ token, model: o.model });
        }
        case "copilot":
            return copilotProvider({
                token: o.copilotToken ?? process.env.COPILOT_GITHUB_TOKEN,
                model: o.model,
                command: o.copilotCommand,
                extraArgs: o.copilotArgs,
            });
        default:
            throw new Error(`Unknown provider "${o.provider}". Use copilot, github-models or none.`);
    }
}
async function aiNotes(provider, changes, o, version, prev, log) {
    const prompt = buildPrompt(changes, {
        productName: o.productName ?? (o.repository?.split("/")[1] ?? "this application"),
        version,
        previousVersion: prev,
        language: o.language ?? "English",
        tone: o.tone ?? "friendly and concise",
        audience: o.audience ?? "end users of the application",
        instructions: o.instructions,
    });
    log.info(`Asking ${provider.name} (${Math.round(Buffer.byteLength(prompt) / 1024)} KB prompt)...`);
    const res = await provider.generate(prompt);
    const parsed = AiNotesSchema.parse(extractJson(res.text));
    return { notes: parsed, model: res.model };
}
export async function runTagore(opts = {}) {
    const o = { ...opts };
    const log = o.log ?? consoleLog;
    const cwd = o.cwd ?? process.cwd();
    const prefix = o.tagPrefix ?? "v";
    const compare = o.compare ?? "auto";
    const announceOn = o.announceOn ?? ["major", "minor"];
    const aiFor = o.aiFor ?? ["major", "minor"];
    const repository = o.repository ?? process.env.GITHUB_REPOSITORY;
    const serverUrl = o.githubServerUrl ?? process.env.GITHUB_SERVER_URL ?? "https://github.com";
    if (await isShallow(cwd)) {
        throw new Error("Shallow clone detected. Tagore needs tags and history: use actions/checkout with fetch-depth: 0.");
    }
    // 1. Versions
    const to = o.to ?? (await currentTag(cwd));
    await resolveRef(to, cwd);
    const tags = await listTags(cwd);
    const current = parseSemver(to, prefix);
    let from;
    let releaseType;
    if (compare === "explicit") {
        if (!o.from)
            throw new Error('compare: "explicit" needs "from".');
        await resolveRef(o.from, cwd);
        from = o.from;
        releaseType = current ? releaseTypeOf(current) : "minor";
    }
    else {
        if (!current)
            throw new Error(`"${to}" is not a semver tag with prefix "${prefix}". Use compare: explicit for other refs.`);
        from = resolveBase(current, tags, compare, prefix)?.raw ?? null;
        releaseType = releaseTypeOf(current);
    }
    const announce = shouldAnnounce(releaseType, announceOn);
    log.info(`Tagore ${TAGORE_VERSION}: ${from ?? "(first commit)"} -> ${to} [${releaseType}, announce=${announce}]`);
    // 2. Changes
    const provider = makeProvider(o);
    const maxDiffKb = o.maxDiffKb ?? (o.provider === "github-models" ? 20 : 100);
    const changes = await collectChanges({
        from,
        to,
        cwd,
        excludes: [...DEFAULT_EXCLUDES, ...(o.excludes ?? [])],
        maxDiffBytes: maxDiffKb * 1024,
    });
    log.info(`${changes.commits.length} commits, ${changes.files.length} files changed${changes.diffTruncated ? " (diff truncated)" : ""}`);
    // 3. Notes (AI or fallback)
    let body;
    let providerName = "fallback";
    let model = null;
    if (provider && aiFor.includes(releaseType) && changes.commits.length > 0) {
        try {
            const r = await aiNotes(provider, changes, o, to, from, log);
            body = r.notes;
            providerName = provider.name;
            model = r.model;
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if ((o.onAiFailure ?? "fallback") === "fail")
                throw new Error(`AI generation failed: ${msg}`);
            log.warn(`AI generation failed, using commit-based notes instead. ${msg}`);
            body = fallbackNotes(changes.commits, to);
        }
    }
    else {
        body = fallbackNotes(changes.commits, to);
    }
    const notes = ReleaseNotesSchema.parse({
        ...sanitizeNotes(body),
        schemaVersion: SCHEMA_VERSION,
        version: to,
        previousVersion: from,
        releaseType,
        announce,
        date: await refDate(to, cwd),
        generator: { name: "tagore", version: TAGORE_VERSION, provider: providerName, model },
    });
    // 4. Announcement for apps (latest.json)
    const releases = repository && (o.githubToken ?? process.env.GITHUB_TOKEN)
        ? new GitHubReleases((o.githubToken ?? process.env.GITHUB_TOKEN), parseRepo(repository), o.githubApiUrl)
        : null;
    let latest = announce ? notes : null;
    if (!announce) {
        latest = await loadBaseline(o, current, tags, prefix, releases, log);
    }
    // 5. Render
    const compareUrl = repository && from ? `${serverUrl}/${repository}/compare/${from}...${to}` : null;
    const markdown = renderMarkdown(notes, { commits: changes.commits, compareUrl, includeCommits: o.includeCommits });
    const files = [
        { name: "release.json", content: JSON.stringify(notes, null, 2) + "\n", contentType: "application/json", cacheControl: "public, max-age=31536000, immutable" },
        { name: "RELEASE_NOTES.md", content: markdown, contentType: "text/markdown; charset=utf-8", cacheControl: "public, max-age=300" },
    ];
    if (latest) {
        files.push({ name: "latest.json", content: JSON.stringify(latest, null, 2) + "\n", contentType: "application/json", cacheControl: "public, max-age=60" });
    }
    // 6. Publish
    let writtenFiles = [];
    let s3Keys = [];
    let releaseUrl = null;
    if (o.dryRun) {
        log.info("Dry run: nothing published.");
    }
    else {
        if (o.outputDir) {
            writtenFiles = await writeOutputDir(o.outputDir, files, cwd);
            log.info(`Wrote ${writtenFiles.length} files to ${o.outputDir}`);
        }
        if (o.publishGithubRelease ?? true) {
            if (!releases)
                throw new Error("Publishing a GitHub Release needs a token and repository (or set publish-github-release: false).");
            const rel = await releases.upsert({
                tag: to,
                name: `${to}: ${notes.title}`,
                body: markdown,
                prerelease: releaseType === "prerelease",
                draft: o.releaseDraft ?? false,
                makeLatest: releaseType !== "prerelease",
            });
            await releases.uploadAsset(rel.id, RELEASE_ASSET_NAME, JSON.stringify(notes, null, 2) + "\n");
            releaseUrl = rel.html_url;
            log.info(`GitHub Release: ${releaseUrl}`);
        }
        if (o.s3Uri) {
            s3Keys = await uploadToS3(o.s3Uri, files, o.s3Region);
            log.info(`Uploaded ${s3Keys.length} files to ${o.s3Uri}`);
        }
    }
    return {
        version: to,
        previousVersion: from,
        releaseType,
        announce,
        provider: providerName,
        notes,
        latest,
        markdown,
        files,
        writtenFiles,
        s3Keys,
        releaseUrl,
        compareUrl,
    };
}
async function loadBaseline(o, current, tags, prefix, releases, log) {
    if (o.baselineFile) {
        const { readFile } = await import("node:fs/promises");
        return ReleaseNotesSchema.parse(JSON.parse(await readFile(o.baselineFile, "utf8")));
    }
    // Candidates: earlier X.Y.0 releases, newest first. The first one that was announced wins.
    const candidates = current ? announcementCandidates(current, tags, prefix) : [];
    if (!candidates.length) {
        log.warn("No earlier major/minor release found; latest.json will not be written.");
        return null;
    }
    if (!releases) {
        log.warn(`Cannot fetch the ${candidates[0].raw} announcement without a GitHub token; latest.json will not be written. Use baseline-file to provide it.`);
        return null;
    }
    for (const c of candidates.slice(0, 10)) {
        const raw = await releases.readAsset(c.raw);
        if (!raw)
            continue;
        const parsed = ReleaseNotesSchema.safeParse(JSON.parse(raw));
        if (parsed.success && parsed.data.announce) {
            log.info(`Reusing the ${c.raw} announcement for latest.json`);
            return parsed.data;
        }
    }
    log.warn(`No earlier release has an announced ${RELEASE_ASSET_NAME} asset; latest.json will not be written.`);
    return null;
}
function announcementCandidates(current, tags, prefix) {
    const base = announcementBase(current, tags, prefix);
    const all = tags
        .map((t) => parseSemver(t, prefix))
        .filter((v) => v !== null && !v.prerelease && v.patch === 0 && v.raw !== current.raw)
        .filter((v) => compareSemver(v, current) < 0)
        .sort(compareSemver)
        .reverse();
    // Prefer the release this patch belongs to (v1.9.0 for v1.9.3), then older ones.
    return base && base.raw !== current.raw ? [base, ...all.filter((v) => v.raw !== base.raw)] : all;
}
