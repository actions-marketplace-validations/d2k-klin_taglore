"use client";

import { useCallback, useEffect, useState } from "react";
import { compareVersions, isReleaseNotes, type ReleaseNotes } from "./types.js";

export interface UseWhatsNewOptions {
  /** Where latest.json is served. Default: /releases/latest.json */
  url?: string;
  /** Pass notes directly (e.g. imported at build time) instead of fetching. */
  data?: ReleaseNotes | null;
  /** localStorage key for the last acknowledged version. Use one per app if several share a domain. */
  storageKey?: string;
  /** Show the current announcement to users who have never acknowledged one. Default: false (new users start "up to date"). */
  showOnFirstVisit?: boolean;
  /** Turn the hook off, e.g. for logged-out users. */
  enabled?: boolean;
}

export interface WhatsNewState {
  notes: ReleaseNotes | null;
  /** True when there is an unseen announcement. */
  open: boolean;
  /** Marks the current announcement as seen and closes it. */
  dismiss: () => void;
  /** Opens the current announcement again (e.g. from a "What's new" menu item). */
  show: () => void;
  error: Error | null;
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode, iframes). The dialog will simply show again next time.
  }
}

export function useWhatsNew(options: UseWhatsNewOptions = {}): WhatsNewState {
  const { url = "/releases/latest.json", data, storageKey = "taglore:whats-new:last-seen", showOnFirstVisit = false, enabled = true } = options;
  const [notes, setNotes] = useState<ReleaseNotes | null>(data ?? null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const decide = (n: ReleaseNotes) => {
      if (!n.announce) return;
      const lastSeen = read(storageKey);
      if (!lastSeen) {
        if (showOnFirstVisit) setOpen(true);
        else write(storageKey, n.version);
        return;
      }
      if (compareVersions(n.version, lastSeen) > 0) setOpen(true);
    };

    if (data !== undefined) {
      setNotes(data);
      if (data) decide(data);
      return;
    }

    fetch(url, { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : r.status === 404 ? null : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: unknown) => {
        if (cancelled || json === null) return;
        if (!isReleaseNotes(json)) throw new Error("latest.json does not match the Taglore schema");
        setNotes(json);
        decide(json);
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e : new Error(String(e))));

    return () => {
      cancelled = true;
    };
  }, [url, data, storageKey, showOnFirstVisit, enabled]);

  const dismiss = useCallback(() => {
    if (notes) write(storageKey, notes.version);
    setOpen(false);
  }, [notes, storageKey]);

  const show = useCallback(() => notes && setOpen(true), [notes]);

  return { notes, open, dismiss, show, error };
}
