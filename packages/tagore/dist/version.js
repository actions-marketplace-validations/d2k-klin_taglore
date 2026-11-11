const SEMVER_RE = /^(?<prefix>[^\d]*)(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<pre>[0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
/** Parses "v1.9.0", "1.9.0", "app-v1.9.0-rc.1". Returns null for non-semver tags. */
export function parseSemver(tag, prefix = "v") {
    const m = SEMVER_RE.exec(tag);
    if (!m?.groups)
        return null;
    const p = m.groups.prefix ?? "";
    if (p !== prefix && !(prefix === "v" && p === ""))
        return null;
    return {
        raw: tag,
        major: Number(m.groups.major),
        minor: Number(m.groups.minor),
        patch: Number(m.groups.patch),
        prerelease: m.groups.pre ?? null,
    };
}
export function compareSemver(a, b) {
    if (a.major !== b.major)
        return a.major - b.major;
    if (a.minor !== b.minor)
        return a.minor - b.minor;
    if (a.patch !== b.patch)
        return a.patch - b.patch;
    if (a.prerelease === b.prerelease)
        return 0;
    if (a.prerelease === null)
        return 1;
    if (b.prerelease === null)
        return -1;
    return a.prerelease.localeCompare(b.prerelease, undefined, { numeric: true });
}
export function releaseTypeOf(v) {
    if (v.prerelease)
        return "prerelease";
    if (v.patch !== 0)
        return "patch";
    if (v.minor !== 0)
        return "minor";
    return "major";
}
/** Stable (non-prerelease) semver tags, sorted ascending. */
export function stableTags(tags, prefix = "v") {
    return tags
        .map((t) => parseSemver(t, prefix))
        .filter((v) => v !== null && v.prerelease === null)
        .sort(compareSemver);
}
/**
 * Picks the tag to compare against.
 *
 * - previous-tag:   highest stable tag below current (v1.9.1 -> v1.9.0)
 * - previous-minor: highest X.Y.0 below current       (v1.9.0 -> v1.8.0, v2.0.0 -> v1.9.0)
 * - previous-major: highest X.0.0 below current       (v2.0.0 -> v1.0.0)
 * - auto:           patch -> previous-tag, minor/major -> previous-minor
 *
 * Returns null when there is no earlier release (first release: compare from the root commit).
 */
export function resolveBase(current, tags, mode, prefix = "v") {
    const below = stableTags(tags, prefix).filter((t) => compareSemver(t, current) < 0);
    const effective = mode === "auto" ? (releaseTypeOf(current) === "patch" || current.prerelease ? "previous-tag" : "previous-minor") : mode;
    let candidates;
    switch (effective) {
        case "previous-tag":
            candidates = below;
            break;
        case "previous-minor":
            candidates = below.filter((t) => t.patch === 0);
            break;
        case "previous-major":
            candidates = below.filter((t) => t.minor === 0 && t.patch === 0);
            break;
    }
    return candidates.at(-1) ?? null;
}
/**
 * The major/minor release whose announcement a given version should show.
 * v1.9.3 -> v1.9.0 (if that tag exists), v1.9.0 -> itself.
 */
export function announcementBase(current, tags, prefix = "v") {
    if (current.patch === 0 && !current.prerelease)
        return current;
    const sameLine = stableTags(tags, prefix).filter((t) => t.patch === 0 && compareSemver(t, current) <= 0);
    return sameLine.at(-1) ?? null;
}
export function shouldAnnounce(type, announceOn) {
    return announceOn.includes(type);
}
