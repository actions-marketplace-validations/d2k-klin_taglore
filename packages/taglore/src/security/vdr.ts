import { randomUUID } from "node:crypto";
import { TAGLORE_VERSION } from "../meta.js";
import type { SecurityReport, Severity, Vulnerability } from "./types.js";

interface CdxComponent {
  "bom-ref"?: string;
  name?: string;
  version?: string;
  purl?: string;
  [k: string]: unknown;
}
interface CdxDoc {
  specVersion?: string;
  metadata?: { component?: CdxComponent; [k: string]: unknown };
  components?: CdxComponent[];
}

const SEVERITY: Record<Severity, string> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
  negligible: "info",
  unknown: "unknown",
};

function source(v: Vulnerability): { name: string; url?: string } {
  const url = v.url ?? undefined;
  if (v.id.startsWith("GHSA-")) return { name: "GitHub Advisory Database", ...(url ? { url } : {}) };
  if (v.id.startsWith("CVE-")) return { name: "NVD", url: url ?? `https://nvd.nist.gov/vuln/detail/${v.id}` };
  return { name: "Grype", ...(url ? { url } : {}) };
}

/**
 * A CycloneDX Vulnerability Disclosure Report for one release: the components of the release's
 * SBOM(s) plus every known vulnerability in this version, linked to the affected component,
 * with severity, advisory link and the fixed versions. Built from the scan Taglore already ran,
 * so the VDR and the Security section always agree.
 */
export function buildVdr(o: { report: SecurityReport; sboms: string[]; product: string; timestamp?: string }): string {
  const docs = o.sboms.map((s) => JSON.parse(s) as CdxDoc);
  const components: CdxComponent[] = [];
  const seen = new Set<string>();
  const byNameVersion = new Map<string, string[]>();
  for (const d of docs) {
    for (const c of d.components ?? []) {
      const ref = c["bom-ref"] ?? c.purl ?? `${c.name}@${c.version}`;
      if (seen.has(ref)) continue;
      seen.add(ref);
      components.push({ ...c, "bom-ref": ref });
      const key = `${c.name}@${c.version}`;
      byNameVersion.set(key, [...(byNameVersion.get(key) ?? []), ref]);
    }
  }
  const vulnerabilities = o.report.open.map((v) => {
    let refs = byNameVersion.get(`${v.package}@${v.version}`) ?? [];
    if (!refs.length) {
      // Every affects.ref must resolve inside the document: add a minimal component.
      const ref = `taglore:${v.type}/${v.package}@${v.version}`;
      if (!seen.has(ref)) {
        seen.add(ref);
        components.push({ type: "library", "bom-ref": ref, name: v.package, version: v.version });
      }
      refs = [ref];
      byNameVersion.set(`${v.package}@${v.version}`, refs);
    }
    const others = v.aliases.filter((a) => a !== v.id);
    return {
      id: v.id,
      source: source(v),
      ...(others.length ? { references: others.map((id) => ({ id, source: { name: id.startsWith("CVE-") ? "NVD" : "Grype" } })) } : {}),
      ratings: [{ severity: SEVERITY[v.severity] }],
      ...(v.url ? { advisories: [{ url: v.url }] } : {}),
      affects: refs.map((ref) => ({ ref, versions: [{ version: v.version, status: "affected" }] })),
      ...(v.fixedIn.length ? { recommendation: `Upgrade ${v.package} to ${v.fixedIn.join(" or ")}.` } : {}),
    };
  });
  const head = docs[0];
  return (
    JSON.stringify(
      {
        bomFormat: "CycloneDX",
        specVersion: head?.specVersion ?? "1.6",
        serialNumber: `urn:uuid:${randomUUID()}`,
        version: 1,
        metadata: {
          timestamp: o.timestamp ?? new Date().toISOString(),
          tools: { components: [{ type: "application", name: "taglore", version: TAGLORE_VERSION }] },
          component: { type: "application", "bom-ref": "product", name: o.product, version: o.report.version },
        },
        components,
        vulnerabilities,
      },
      null,
      2,
    ) + "\n"
  );
}
