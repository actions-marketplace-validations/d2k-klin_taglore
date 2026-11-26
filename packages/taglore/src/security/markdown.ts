import { describeCounts } from "./diff.js";
import type { SecurityReport, Vulnerability } from "./types.js";

/* The Security section is built from scanner data only. No AI is involved. */

const SEV_LABEL: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  negligible: "Negligible",
  unknown: "Unknown",
};

/** Table cells must not break the Markdown table or inject markup. */
function cell(s: string): string {
  return s.replace(/[|<>`\r\n]/g, " ").replace(/\s+/g, " ").trim();
}

function idCell(v: Vulnerability): string {
  const label = cell(v.id);
  const cve = v.aliases.find((a) => a.startsWith("CVE-"));
  const shown = cve && !label.startsWith("CVE-") ? `${label} (${cell(cve)})` : label;
  return v.url ? `[${shown}](${v.url.replace(/[()\s<>]/g, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase())})` : shown;
}

function table(rows: { mark: string; v: Vulnerability }[]): string {
  const head = "| | Vulnerability | Severity | Package | Fixed in |\n|---|---|---|---|---|\n";
  return (
    head +
    rows
      .map(({ mark, v }) =>
        `| ${mark} | ${idCell(v)} | ${SEV_LABEL[v.severity]} | ${cell(v.package)} ${cell(v.version)} | ${v.fixedIn.length ? cell(v.fixedIn.join(", ")) : "no fix yet"} |`,
      )
      .join("\n") +
    "\n"
  );
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * The Security section. Fixed and new vulnerabilities get their own tables; the fixed table
 * names the product and the version, so users can tell which update to install.
 */
export function renderSecuritySection(r: SecurityReport, maxItems = 15, opts: { product?: string } = {}): string {
  const s = r.summary;
  const total = (c: typeof s.open) => Object.values(c).reduce((a, b) => a + b, 0);
  const nIntro = total(s.introduced);
  const nFixed = total(s.fixed);
  const nOpen = total(s.open);
  let md = "### 🔒 Security\n\n";

  if (r.previousVersion) {
    if (!nIntro && !nFixed) md += `No change in known vulnerabilities since ${cell(r.previousVersion)}. `;
    else {
      const bits = [];
      if (nFixed) bits.push(`fixes **${plural(nFixed, "known vulnerability", "known vulnerabilities")}**`);
      if (nIntro) bits.push(`introduces **${nIntro}** (${describeCounts(s.introduced)})`);
      md += `Compared with ${cell(r.previousVersion)}, this release ${bits.join(" and ")}. `;
    }
  }
  md += nOpen ? `Known vulnerabilities in this version: ${describeCounts(s.open)}.\n\n` : "No known vulnerabilities in this version's dependencies.\n\n";

  const version = `${opts.product ? `${cell(opts.product)} ` : ""}${cell(r.version)}`;
  let budget = maxItems;
  const block = (heading: string, list: { mark: string; v: Vulnerability }[]) => {
    if (!list.length) return;
    const shown = list.slice(0, Math.max(0, budget));
    budget -= shown.length;
    md += `**${heading}**\n\n`;
    if (shown.length) md += table(shown);
    if (list.length > shown.length) md += `\n…and ${list.length - shown.length} more in \`security.json\`.\n`;
    md += "\n";
  };
  if (r.previousVersion) {
    block(`Fixed in ${version}`, r.fixed.map((v) => ({ mark: "✅", v })));
    block(`New in ${version}`, r.introduced.map((v) => ({ mark: "🆕", v })));
  } else {
    // First release: list what is open, since there is nothing to compare against.
    block(`Known in ${version}`, r.open.map((v) => ({ mark: "⚠️", v })));
  }

  const c = s.components;
  if (r.previousVersion && (c.added || c.removed || c.changed || r.newLicenses.length)) {
    const parts: string[] = [];
    if (c.added || c.removed || c.changed) parts.push(`Dependencies: ${c.added} added, ${c.removed} removed, ${c.changed} changed (${c.total} total).`);
    if (r.newLicenses.length) parts.push(`New licenses: ${r.newLicenses.map(cell).join(", ")}.`);
    md += parts.join(" ") + "\n\n";
  }

  for (const w of r.warnings) md += `> ⚠️ ${cell(w)}\n\n`;
  const repoPart = r.sources.paths.length ? `the lockfiles and manifests in ${r.sources.paths.map(cell).join(", ")}` : "the repository's lockfiles and manifests";
  const what = r.sources.image ? `${repoPart} and the image ${cell(r.sources.image)}` : repoPart;
  const files = r.sources.image ? "security.json, vdr.cdx.json, sbom.cdx.json and sbom-image.cdx.json" : "security.json, vdr.cdx.json and sbom.cdx.json";
  md += `<sub>Scanned ${what} with Syft ${cell(r.tools.syft ?? "?")} and Grype ${cell(r.tools.grype ?? "?")}; both versions were checked against the same vulnerability database. The full report, the CycloneDX VDR and the SBOMs are attached as ${files}.</sub>\n\n`;
  return md;
}
