import { type ReleaseNotes } from "./types.js";
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
export declare function useWhatsNew(options?: UseWhatsNewOptions): WhatsNewState;
