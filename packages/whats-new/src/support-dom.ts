import { type SupportLabels, supportParts } from "./core.js";
import type { SupportInfo } from "./types.js";

/** The support line as DOM: text and links set with textContent and checked hrefs only. */
export function supportLine(className: string, s: SupportInfo | undefined, labels: SupportLabels, locale?: string): HTMLElement | null {
  const parts = supportParts(s, labels, locale);
  if (!parts.length) return null;
  const p = document.createElement("p");
  p.className = className;
  parts.forEach((part, i) => {
    if (i) p.append(document.createTextNode(" · "));
    if (part.href) {
      const a = document.createElement("a");
      a.href = part.href;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      a.textContent = part.text;
      p.append(a);
    } else {
      p.append(document.createTextNode(part.text));
    }
  });
  return p;
}
