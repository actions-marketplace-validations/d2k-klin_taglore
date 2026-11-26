"use client";

export { SupportLine, WhatsNew, type WhatsNewProps, type WhatsNewLabels } from "./whats-new.js";
export { useWhatsNew, type UseWhatsNewOptions, type WhatsNewState } from "./use-whats-new.js";
export { compareVersions, isReleaseNotes, type ReleaseNotes, type NoteItem, type SupportInfo } from "./types.js";
export { Changelog, type ChangelogProps, type ChangelogLabels } from "./changelog.js";
export type { History } from "./types.js";
export { DEFAULT_URL, DEFAULT_HISTORY_URL, DEFAULT_STORAGE_KEY, filterReleases, latestSupport, loadHistory, loadNotes, safeHref, supportParts, DEFAULT_SUPPORT_LABELS, type SupportLabels, type SupportPart } from "./core.js";
