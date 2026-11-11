import { type ReactNode } from "react";
import type { ReleaseNotes } from "./types.js";
import { type UseWhatsNewOptions, type WhatsNewState } from "./use-whats-new.js";
export interface WhatsNewLabels {
    heading: string;
    highlights: string;
    improvements: string;
    fixes: string;
    breaking: string;
    close: string;
}
export interface WhatsNewProps extends UseWhatsNewOptions {
    labels?: Partial<WhatsNewLabels>;
    className?: string;
    /** Show only the summary and highlights (no improvements/fixes lists). */
    compact?: boolean;
    /** Headless mode: render your own UI (e.g. shadcn/ui Dialog) from the state. */
    children?: (state: WhatsNewState) => ReactNode;
    onDismiss?: (notes: ReleaseNotes) => void;
}
/**
 * Shows the latest announcement once per version in a native <dialog>.
 * All text is rendered as plain text (no HTML), so release notes cannot inject markup.
 */
export declare function WhatsNew({ labels, className, compact, children, onDismiss, ...options }: WhatsNewProps): import("react").JSX.Element | null;
