"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { NoteItem, ReleaseNotes } from "./types.js";
import { useWhatsNew, type UseWhatsNewOptions, type WhatsNewState } from "./use-whats-new.js";

export interface WhatsNewLabels {
  heading: string;
  highlights: string;
  improvements: string;
  fixes: string;
  breaking: string;
  close: string;
}

const DEFAULT_LABELS: WhatsNewLabels = {
  heading: "What's new",
  highlights: "Highlights",
  improvements: "Improvements",
  fixes: "Fixes",
  breaking: "Action needed",
  close: "Got it",
};

export interface WhatsNewProps extends UseWhatsNewOptions {
  labels?: Partial<WhatsNewLabels>;
  className?: string;
  /** Show only the summary and highlights (no improvements/fixes lists). */
  compact?: boolean;
  /** Headless mode: render your own UI (e.g. shadcn/ui Dialog) from the state. */
  children?: (state: WhatsNewState) => ReactNode;
  onDismiss?: (notes: ReleaseNotes) => void;
}

function Section({ title, items, kind }: { title: string; items: NoteItem[]; kind: string }) {
  if (!items.length) return null;
  return (
    <section className={`tagore-wn__section tagore-wn__section--${kind}`}>
      <h3 className="tagore-wn__section-title">{title}</h3>
      <ul className="tagore-wn__list">
        {items.map((i, idx) => (
          <li key={idx} className="tagore-wn__item">
            <strong className="tagore-wn__item-title">{i.title}</strong>
            {i.description ? <span className="tagore-wn__item-desc"> {i.description}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Shows the latest announcement once per version in a native <dialog>.
 * All text is rendered as plain text (no HTML), so release notes cannot inject markup.
 */
export function WhatsNew({ labels, className, compact, children, onDismiss, ...options }: WhatsNewProps) {
  const state = useWhatsNew(options);
  const ref = useRef<HTMLDialogElement>(null);
  const l = { ...DEFAULT_LABELS, ...labels };

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (state.open && !d.open) d.showModal?.();
    if (!state.open && d.open) d.close();
  }, [state.open]);

  if (children) return <>{children(state)}</>;
  if (!state.notes) return null;
  const n = state.notes;

  const close = () => {
    state.dismiss();
    onDismiss?.(n);
  };

  return (
    <dialog
      ref={ref}
      className={["tagore-wn", className].filter(Boolean).join(" ")}
      aria-labelledby="tagore-wn-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header className="tagore-wn__header">
        <p className="tagore-wn__eyebrow">
          {l.heading} · {n.version}
        </p>
        <h2 id="tagore-wn-title" className="tagore-wn__title">
          {n.title}
        </h2>
        <p className="tagore-wn__summary">{n.summary}</p>
      </header>
      <div className="tagore-wn__body">
        <Section title={l.breaking} items={n.breaking} kind="breaking" />
        <Section title={l.highlights} items={n.highlights} kind="highlights" />
        {!compact && <Section title={l.improvements} items={n.improvements} kind="improvements" />}
        {!compact && <Section title={l.fixes} items={n.fixes} kind="fixes" />}
      </div>
      <footer className="tagore-wn__footer">
        <button type="button" className="tagore-wn__close" onClick={close} autoFocus>
          {l.close}
        </button>
      </footer>
    </dialog>
  );
}
