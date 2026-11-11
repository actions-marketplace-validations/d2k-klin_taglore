"use client";
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { useWhatsNew } from "./use-whats-new.js";
const DEFAULT_LABELS = {
    heading: "What's new",
    highlights: "Highlights",
    improvements: "Improvements",
    fixes: "Fixes",
    breaking: "Action needed",
    close: "Got it",
};
function Section({ title, items, kind }) {
    if (!items.length)
        return null;
    return (_jsxs("section", { className: `taglore-wn__section taglore-wn__section--${kind}`, children: [_jsx("h3", { className: "taglore-wn__section-title", children: title }), _jsx("ul", { className: "taglore-wn__list", children: items.map((i, idx) => (_jsxs("li", { className: "taglore-wn__item", children: [_jsx("strong", { className: "taglore-wn__item-title", children: i.title }), i.description ? _jsxs("span", { className: "taglore-wn__item-desc", children: [" ", i.description] }) : null] }, idx))) })] }));
}
/**
 * Shows the latest announcement once per version in a native <dialog>.
 * All text is rendered as plain text (no HTML), so release notes cannot inject markup.
 */
export function WhatsNew({ labels, className, compact, children, onDismiss, ...options }) {
    const state = useWhatsNew(options);
    const ref = useRef(null);
    const l = { ...DEFAULT_LABELS, ...labels };
    useEffect(() => {
        const d = ref.current;
        if (!d)
            return;
        if (state.open && !d.open)
            d.showModal?.();
        if (!state.open && d.open)
            d.close();
    }, [state.open]);
    if (children)
        return _jsx(_Fragment, { children: children(state) });
    if (!state.notes)
        return null;
    const n = state.notes;
    const close = () => {
        state.dismiss();
        onDismiss?.(n);
    };
    return (_jsxs("dialog", { ref: ref, className: ["taglore-wn", className].filter(Boolean).join(" "), "aria-labelledby": "taglore-wn-title", onCancel: (e) => {
            e.preventDefault();
            close();
        }, children: [_jsxs("header", { className: "taglore-wn__header", children: [_jsxs("p", { className: "taglore-wn__eyebrow", children: [l.heading, " \u00B7 ", n.version] }), _jsx("h2", { id: "taglore-wn-title", className: "taglore-wn__title", children: n.title }), _jsx("p", { className: "taglore-wn__summary", children: n.summary })] }), _jsxs("div", { className: "taglore-wn__body", children: [_jsx(Section, { title: l.breaking, items: n.breaking, kind: "breaking" }), _jsx(Section, { title: l.highlights, items: n.highlights, kind: "highlights" }), !compact && _jsx(Section, { title: l.improvements, items: n.improvements, kind: "improvements" }), !compact && _jsx(Section, { title: l.fixes, items: n.fixes, kind: "fixes" })] }), _jsx("footer", { className: "taglore-wn__footer", children: _jsx("button", { type: "button", className: "taglore-wn__close", onClick: close, autoFocus: true, children: l.close }) })] }));
}
