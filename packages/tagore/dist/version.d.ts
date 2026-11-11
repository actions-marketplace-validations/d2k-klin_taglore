import type { ReleaseType } from "./schema.js";
export interface SemVer {
    raw: string;
    major: number;
    minor: number;
    patch: number;
    prerelease: string | null;
}
export type CompareMode = "auto" | "previous-tag" | "previous-minor" | "previous-major" | "explicit";
/** Parses "v1.9.0", "1.9.0", "app-v1.9.0-rc.1". Returns null for non-semver tags. */
export declare function parseSemver(tag: string, prefix?: string): SemVer | null;
export declare function compareSemver(a: SemVer, b: SemVer): number;
export declare function releaseTypeOf(v: SemVer): ReleaseType;
/** Stable (non-prerelease) semver tags, sorted ascending. */
export declare function stableTags(tags: string[], prefix?: string): SemVer[];
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
export declare function resolveBase(current: SemVer, tags: string[], mode: Exclude<CompareMode, "explicit">, prefix?: string): SemVer | null;
/**
 * The major/minor release whose announcement a given version should show.
 * v1.9.3 -> v1.9.0 (if that tag exists), v1.9.0 -> itself.
 */
export declare function announcementBase(current: SemVer, tags: string[], prefix?: string): SemVer | null;
export declare function shouldAnnounce(type: ReleaseType, announceOn: ReleaseType[]): boolean;
