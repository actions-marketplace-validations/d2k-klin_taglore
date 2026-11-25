import { fillPlaceholders, type ReleaseVars } from "./facts.js";
import type { Support } from "./schema.js";

/** Normalizes the maintainer's support settings, or null when none is set. Throws on invalid values. */
export function buildSupport(
  o: { supportUntil?: string; securityContact?: string; sbomUrl?: string },
  vars: ReleaseVars,
  autoSbomUrl: string | null,
): Support | null {
  const until = o.supportUntil?.trim() || null;
  if (until) {
    const d = new Date(`${until}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(until) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== until) {
      throw new Error(`Invalid support-until "${o.supportUntil}". Use a date like 2027-12-31.`);
    }
  }
  const contact = normalizeContact(o.securityContact);
  let sbom: string | null = null;
  if (o.sbomUrl?.trim()) {
    sbom = fillPlaceholders(o.sbomUrl.trim(), vars);
    if (!isHttps(sbom)) throw new Error(`Invalid sbom-url "${o.sbomUrl}". Use an https:// link ({version} is filled in).`);
  } else if (autoSbomUrl) {
    sbom = autoSbomUrl;
  }
  if (!until && !contact && !sbom) return null;
  return { until, contact, sbom };
}

function isHttps(u: string): boolean {
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
}

/** An https:// link, a mailto: link, or a plain e-mail address (turned into mailto:). */
export function normalizeContact(raw: string | undefined): string | null {
  const c = raw?.trim();
  if (!c) return null;
  if (/^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/.test(c)) return `mailto:${c}`;
  if (/^mailto:[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/i.test(c)) return c;
  if (isHttps(c)) return c;
  throw new Error(`Invalid security-contact "${raw}". Use an https:// link (e.g. your security policy) or an e-mail address.`);
}

/** The "Security support" block of the release notes. */
export function renderSupportSection(s: Support | undefined): string {
  if (!s) return "";
  const lines: string[] = [];
  if (s.until) lines.push(`- Security updates for this version until **${s.until}**.`);
  if (s.contact) lines.push(`- Report a vulnerability: ${s.contact.startsWith("mailto:") ? s.contact.slice(7) : s.contact}`);
  if (s.sbom) lines.push(`- Software bill of materials (SBOM): ${s.sbom}`);
  return lines.length ? `### 🛡️ Security support\n\n${lines.join("\n")}\n\n` : "";
}
