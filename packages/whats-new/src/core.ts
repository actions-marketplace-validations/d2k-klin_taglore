import { compareVersions, isReleaseNotes, type ReleaseNotes } from "./types.js";

/** Framework-free logic shared by the React hook and the <taglore-whats-new> element. */

export const DEFAULT_URL = "/release-notes/latest.json";
export const DEFAULT_STORAGE_KEY = "taglore:whats-new:last-seen";

export function readSeen(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSeen(key: string, version: string): void {
  try {
    window.localStorage.setItem(key, version);
  } catch {
    // Storage can be blocked (private mode, iframes). The announcement simply shows again next time.
  }
}

/**
 * Decides whether to show the announcement. First-time visitors are marked
 * up to date silently unless showOnFirstVisit is set.
 */
export function shouldShow(notes: ReleaseNotes, storageKey: string, showOnFirstVisit: boolean): boolean {
  if (!notes.announce) return false;
  const lastSeen = readSeen(storageKey);
  if (!lastSeen) {
    if (showOnFirstVisit) return true;
    writeSeen(storageKey, notes.version);
    return false;
  }
  return compareVersions(notes.version, lastSeen) > 0;
}

/** Fetches latest.json. Resolves null on 404 (no notes deployed yet). */
export async function loadNotes(url: string, signal?: AbortSignal): Promise<ReleaseNotes | null> {
  const r = await fetch(url, { cache: "no-cache", signal });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`);
  const json: unknown = await r.json();
  if (!isReleaseNotes(json)) throw new Error("latest.json does not match the Taglore schema");
  return json;
}
