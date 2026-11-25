import { compareVersions, isReleaseNotes, type NoteItem, type ReleaseNotes, type SupportInfo } from "./types.js";

/** Framework-free logic shared by the React hook and the <taglore-whats-new> element. */

export const DEFAULT_URL = "/release-notes/latest.json";
export const DEFAULT_HISTORY_URL = "/release-notes/history.json";
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

/** Fetches history.json. Resolves an empty list on 404. Entries that don't match the schema are skipped. */
export async function loadHistory(url: string, signal?: AbortSignal): Promise<ReleaseNotes[]> {
  const r = await fetch(url, { cache: "no-cache", signal });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`);
  const json = (await r.json()) as { releases?: unknown };
  if (!json || !Array.isArray(json.releases)) throw new Error("history.json does not match the Taglore schema");
  return json.releases.filter(isReleaseNotes);
}

const SECTIONS = ["breaking", "highlights", "improvements", "fixes"] as const;

/**
 * Search for a changelog page: every word of the query must appear somewhere in a release.
 * Inside a matching release, only the matching items are kept (all of them when the
 * version, title or summary matched).
 */
export function filterReleases(releases: ReleaseNotes[], query: string): ReleaseNotes[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return releases;
  const has = (text: string) => words.every((w) => text.toLowerCase().includes(w));
  const out: ReleaseNotes[] = [];
  for (const r of releases) {
    if (has(`${r.version} ${r.title} ${r.summary}`)) {
      out.push(r);
      continue;
    }
    const pick = (items: NoteItem[] = []) => items.filter((i) => has(`${i.title} ${i.description}`));
    const hit = { ...r };
    let n = 0;
    for (const s of SECTIONS) n += (hit[s] = pick(r[s])).length;
    if (n) out.push(hit);
  }
  return out;
}

/** "2026-03-15T10:00:00+01:00" -> a short local date. Falls back to the raw text. */
export function formatDate(iso: string, locale?: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

/** Only https: and mailto: links are rendered; anything else (javascript:, data:, http:) is dropped. */
export function safeHref(u: unknown): string | null {
  if (typeof u !== "string") return null;
  try {
    const url = new URL(u);
    return url.protocol === "https:" || url.protocol === "mailto:" ? url.href : null;
  } catch {
    return null;
  }
}

export interface SupportLabels {
  /** "{date}" is replaced with the formatted end date. */
  supportUntil: string;
  report: string;
  sbom: string;
}

export const DEFAULT_SUPPORT_LABELS: SupportLabels = {
  supportUntil: "Security updates until {date}",
  report: "Report a vulnerability",
  sbom: "SBOM",
};

export interface SupportPart {
  kind: "until" | "contact" | "sbom";
  text: string;
  href: string | null;
}

/** The parts of the support line, in display order. Empty when there is nothing to show. */
export function supportParts(s: SupportInfo | undefined, labels: SupportLabels, locale?: string): SupportPart[] {
  if (!s) return [];
  const parts: SupportPart[] = [];
  if (s.until && /^\d{4}-\d{2}-\d{2}$/.test(s.until)) {
    parts.push({ kind: "until", text: labels.supportUntil.replace("{date}", formatDate(s.until, locale)), href: null });
  }
  const contact = safeHref(s.contact);
  if (contact) parts.push({ kind: "contact", text: labels.report, href: contact });
  const sbom = safeHref(s.sbom);
  if (sbom) parts.push({ kind: "sbom", text: labels.sbom, href: sbom });
  return parts;
}

/** The support information of the newest release that has any (history.json is newest first). */
export function latestSupport(releases: ReleaseNotes[]): SupportInfo | undefined {
  return releases.find((r) => r.support)?.support;
}
