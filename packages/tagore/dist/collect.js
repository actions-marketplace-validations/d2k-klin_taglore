import { git } from "./git.js";
export const DEFAULT_EXCLUDES = [
    "**/package-lock.json",
    "**/pnpm-lock.yaml",
    "**/yarn.lock",
    "**/bun.lockb",
    "**/bun.lock",
    "**/*.lock",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/coverage/**",
    "**/node_modules/**",
    "**/*.min.js",
    "**/*.map",
    "**/*.snap",
    "**/.env",
    "**/.env.*",
    "**/*.pem",
    "**/*.key",
    "**/*.svg",
    "**/*.png",
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.gif",
    "**/*.webp",
    "**/*.ico",
    "**/*.woff",
    "**/*.woff2",
    "**/*.pdf",
    "**/*.zip",
];
const RS = "\x1e";
const US = "\x1f";
function range(from, to) {
    return from ? `${from}..${to}` : to;
}
function excludePathspecs(excludes) {
    return excludes.map((e) => `:(exclude,glob)${e}`);
}
export async function collectCommits(from, to, cwd) {
    const out = await git(["log", "--no-merges", `--format=%H${US}%an${US}%s${US}%b${RS}`, range(from, to)], cwd);
    return out
        .split(RS)
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => {
        const [sha = "", author = "", subject = "", body = ""] = r.split(US);
        return { sha, author, subject: subject.trim(), body: body.trim() };
    });
}
/**
 * Collects commits, changed files and a size-capped diff.
 * Each file's diff is capped so one huge file cannot crowd out the rest.
 */
export async function collectChanges(opts) {
    const { from, to, cwd, excludes, maxDiffBytes } = opts;
    const commits = await collectCommits(from, to, cwd);
    // For a first release there is no base; diff against the empty tree.
    const base = from ?? (await git(["hash-object", "-t", "tree", "/dev/null"], cwd)).trim();
    const pathspec = ["--", ".", ...excludePathspecs(excludes)];
    const nameStatus = await git(["diff", "--name-status", "--no-renames", base, to, ...pathspec], cwd);
    const files = nameStatus
        .split("\n")
        .filter(Boolean)
        .map((l) => {
        const [status = "", ...rest] = l.split("\t");
        return { status, path: rest.join("\t") };
    });
    const stat = await git(["diff", "--stat=120", base, to, ...pathspec], cwd);
    const perFileCap = Math.max(4_000, Math.floor(maxDiffBytes / Math.max(1, Math.min(files.length, 20))));
    let diff = "";
    let truncated = false;
    for (const f of files) {
        if (Buffer.byteLength(diff) >= maxDiffBytes) {
            truncated = true;
            break;
        }
        let chunk = await git(["diff", "--unified=2", "--no-color", base, to, "--", f.path], cwd);
        if (Buffer.byteLength(chunk) > perFileCap) {
            chunk = chunk.slice(0, perFileCap) + `\n[... diff for ${f.path} truncated ...]\n`;
            truncated = true;
        }
        diff += chunk;
    }
    if (Buffer.byteLength(diff) > maxDiffBytes) {
        diff = diff.slice(0, maxDiffBytes) + "\n[... remaining diff truncated ...]\n";
        truncated = true;
    }
    return { from, to, commits, files, stat, diff, diffTruncated: truncated };
}
