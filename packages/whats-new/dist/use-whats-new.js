"use client";
import { useCallback, useEffect, useState } from "react";
import { compareVersions, isReleaseNotes } from "./types.js";
function read(key) {
    try {
        return window.localStorage.getItem(key);
    }
    catch {
        return null;
    }
}
function write(key, value) {
    try {
        window.localStorage.setItem(key, value);
    }
    catch {
        // Storage can be blocked (private mode, iframes). The dialog will simply show again next time.
    }
}
export function useWhatsNew(options = {}) {
    const { url = "/releases/latest.json", data, storageKey = "taglore:whats-new:last-seen", showOnFirstVisit = false, enabled = true } = options;
    const [notes, setNotes] = useState(data ?? null);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!enabled)
            return;
        let cancelled = false;
        const decide = (n) => {
            if (!n.announce)
                return;
            const lastSeen = read(storageKey);
            if (!lastSeen) {
                if (showOnFirstVisit)
                    setOpen(true);
                else
                    write(storageKey, n.version);
                return;
            }
            if (compareVersions(n.version, lastSeen) > 0)
                setOpen(true);
        };
        if (data !== undefined) {
            setNotes(data);
            if (data)
                decide(data);
            return;
        }
        fetch(url, { cache: "no-cache" })
            .then((r) => (r.ok ? r.json() : r.status === 404 ? null : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then((json) => {
            if (cancelled || json === null)
                return;
            if (!isReleaseNotes(json))
                throw new Error("latest.json does not match the Taglore schema");
            setNotes(json);
            decide(json);
        })
            .catch((e) => !cancelled && setError(e instanceof Error ? e : new Error(String(e))));
        return () => {
            cancelled = true;
        };
    }, [url, data, storageKey, showOnFirstVisit, enabled]);
    const dismiss = useCallback(() => {
        if (notes)
            write(storageKey, notes.version);
        setOpen(false);
    }, [notes, storageKey]);
    const show = useCallback(() => notes && setOpen(true), [notes]);
    return { notes, open, dismiss, show, error };
}
