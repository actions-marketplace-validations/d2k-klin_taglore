import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EvidenceIndexSchema, sha256 } from "../src/evidence-index.js";
import { renderMarkdown } from "../src/markdown.js";
import { runTaglore } from "../src/run.js";
import { ReleaseNotesSchema } from "../src/schema.js";
import { renderSecuritySection } from "../src/security/markdown.js";
import { buildVdr } from "../src/security/vdr.js";
import type { SecurityReport } from "../src/security/types.js";
import { buildSupport, normalizeContact } from "../src/support.js";
import { grypeBase, grypeHead, sbomBase, sbomHead } from "./fixtures/security.js";

const silent = { info: () => {}, warn: () => {} };
const vars = { version: "v1.2.0", from: "v1.1.0", to: "v1.2.0", releaseType: "minor" };
let repo: string;
let bin: string;

const vuln = (id: string, pkg: string, version: string, severity = "high" as const, fixedIn = ["4.17.21"]) => ({
  id,
  aliases: id.startsWith("GHSA") ? ["CVE-2021-23337"] : [],
  severity,
  package: pkg,
  type: "npm",
  version,
  fixedIn,
  url: `https://github.com/advisories/${id}`,
});

beforeAll(() => {
  const work = mkdtempSync(join(tmpdir(), "taglore-cra-"));
  repo = join(work, "repo");
  bin = join(work, "bin");
  mkdirSync(repo);
  mkdirSync(bin);
  const sh = (args: string[]) => execFileSync("git", args, { cwd: repo, stdio: "ignore" });
  sh(["init", "-q", "-b", "main"]);
  sh(["config", "user.email", "t@example.com"]);
  sh(["config", "user.name", "t"]);
  writeFileSync(join(repo, ".fixture-sbom.json"), JSON.stringify({ ...sbomBase, "x-grype": grypeBase }));
  sh(["add", "."]);
  sh(["commit", "-qm", "feat: first"]);
  sh(["tag", "v1.0.0"]);
  writeFileSync(join(repo, ".fixture-sbom.json"), JSON.stringify({ ...sbomHead, "x-grype": grypeHead }));
  sh(["add", "."]);
  sh(["commit", "-qm", "fix(deps): upgrade lodash, add http client"]);
  sh(["tag", "v1.1.0"]);
  // Same fake scanners as security-run.test.ts: the SBOM and the findings come from the fixture file.
  writeFileSync(
    join(bin, "syft"),
    `#!/usr/bin/env node
const fs = require("fs"), path = require("path");
const a = process.argv.slice(2);
if (a[0] === "version") { console.log(JSON.stringify({ version: "1.0.0-test" })); process.exit(0); }
const out = a[a.indexOf("-o") + 1].split("=")[1];
fs.copyFileSync(path.join(a[0].slice(4), ".fixture-sbom.json"), out);
`,
  );
  writeFileSync(
    join(bin, "grype"),
    `#!/usr/bin/env node
const fs = require("fs");
const a = process.argv.slice(2);
if (a[0] === "version") { console.log(JSON.stringify({ version: "0.0.0-test" })); process.exit(0); }
if (a[0] === "db") process.exit(0);
const file = a.find((x) => x.startsWith("sbom:")).slice(5);
console.log(JSON.stringify(JSON.parse(fs.readFileSync(file, "utf8"))["x-grype"]));
`,
  );
  chmodSync(join(bin, "syft"), 0o755);
  chmodSync(join(bin, "grype"), 0o755);
});

afterAll(() => rmSync(join(repo, ".."), { recursive: true, force: true }));

describe("support information", () => {
  it("normalizes and validates the maintainer's settings", () => {
    expect(buildSupport({}, vars, null)).toBeNull();
    expect(buildSupport({ supportUntil: "2027-12-31", securityContact: "security@acme.example", sbomUrl: "https://acme.example/sbom/{version}.json" }, vars, null)).toEqual({
      until: "2027-12-31",
      contact: "mailto:security@acme.example",
      sbom: "https://acme.example/sbom/v1.2.0.json",
    });
    expect(buildSupport({}, vars, "https://github.com/o/r/releases/download/v1.2.0/sbom.cdx.json")?.sbom).toBe(
      "https://github.com/o/r/releases/download/v1.2.0/sbom.cdx.json",
    );
    expect(() => buildSupport({ supportUntil: "2027-02-30" }, vars, null)).toThrow(/support-until/);
    expect(() => buildSupport({ sbomUrl: "http://acme.example/sbom.json" }, vars, null)).toThrow(/sbom-url/);
    expect(() => normalizeContact("javascript:alert(1)")).toThrow(/security-contact/);
    expect(normalizeContact("https://github.com/o/r/security/policy")).toBe("https://github.com/o/r/security/policy");
  });

  it("appears in release.json and the Markdown, and is validated by the schema", async () => {
    const r = await runTaglore({
      cwd: repo,
      to: "v1.1.0",
      provider: "none",
      publishGithubRelease: false,
      dryRun: true,
      supportUntil: "2027-12-31",
      securityContact: "https://github.com/o/r/security/policy",
      log: silent,
    });
    expect(r.notes.support).toEqual({ until: "2027-12-31", contact: "https://github.com/o/r/security/policy", sbom: null });
    expect(r.markdown).toContain("### 🛡️ Security support");
    expect(r.markdown).toContain("Security updates for this version until **2027-12-31**.");
    expect(() => ReleaseNotesSchema.parse({ ...r.notes, support: { until: null, contact: "javascript:x", sbom: null } })).toThrow();
    expect(renderMarkdown({ ...r.notes, support: undefined }, { commits: [] })).not.toContain("Security support");
  });
});

describe("security section", () => {
  it("names the product and version for fixed vulnerabilities, separate from new ones", () => {
    const report = {
      schemaVersion: 1,
      version: "v1.1.0",
      previousVersion: "v1.0.0",
      scannedAt: "2026-11-25T00:00:00Z",
      tools: { syft: "1", grype: "1" },
      summary: {
        open: { critical: 1, high: 0, medium: 0, low: 0, negligible: 0, unknown: 0 },
        introduced: { critical: 1, high: 0, medium: 0, low: 0, negligible: 0, unknown: 0 },
        fixed: { critical: 0, high: 1, medium: 0, low: 0, negligible: 0, unknown: 0 },
        components: { total: 2, added: 1, removed: 0, changed: 1 },
      },
      introduced: [vuln("GHSA-xvch-5gv4-984h", "minimist", "1.2.5", "critical" as never, ["1.2.6"])],
      fixed: [vuln("GHSA-35jh-r3h4-6jhm", "lodash", "4.17.15")],
      open: [vuln("GHSA-xvch-5gv4-984h", "minimist", "1.2.5", "critical" as never, ["1.2.6"])],
      components: { added: [], removed: [], changed: [] },
      newLicenses: [],
      sources: { repository: true, image: null, previousImage: null, paths: [] },
      warnings: [],
    } as unknown as SecurityReport;
    const md = renderSecuritySection(report, 15, { product: "Acme Web" });
    expect(md).toContain("**Fixed in Acme Web v1.1.0**");
    expect(md).toContain("**New in Acme Web v1.1.0**");
    expect(md.indexOf("Fixed in")).toBeLessThan(md.indexOf("GHSA-35jh"));
    expect(md.indexOf("GHSA-35jh")).toBeLessThan(md.indexOf("New in"));

    const vdr = JSON.parse(buildVdr({ report, sboms: [JSON.stringify({ specVersion: "1.6", components: [] })], product: "Acme Web" }));
    // A package missing from the SBOM still gets a component, so every reference resolves.
    const refs = new Set(vdr.components.map((c: { "bom-ref": string }) => c["bom-ref"]));
    expect(vdr.vulnerabilities[0].affects.every((a: { ref: string }) => refs.has(a.ref))).toBe(true);
  });
});

describe("VDR and evidence index", () => {
  it("writes vdr.cdx.json and evidence.json whose hashes match every file", async () => {
    const out = join(repo, "..", "out-cra");
    const r = await runTaglore({
      cwd: repo,
      to: "v1.1.0",
      provider: "none",
      publishGithubRelease: false,
      security: true,
      syftCommand: join(bin, "syft"),
      grypeCommand: join(bin, "grype"),
      productName: "Acme Web",
      supportUntil: "2027-12-31",
      outputDir: out,
      log: silent,
    });
    expect(r.markdown).toContain("**Fixed in Acme Web v1.1.0**");

    const vdr = JSON.parse(readFileSync(join(out, "vdr.cdx.json"), "utf8"));
    expect(vdr.bomFormat).toBe("CycloneDX");
    expect(vdr.metadata.component).toMatchObject({ name: "Acme Web", version: "v1.1.0" });
    // Every open finding of this version, with severity, the affected component and the fix.
    expect(vdr.vulnerabilities.map((v: { id: string }) => v.id).sort()).toEqual(["GHSA-4w2v-q235-vp99", "GHSA-vh95-rmgr-6w4m"]);
    const minimist = vdr.vulnerabilities.find((v: { id: string }) => v.id === "GHSA-vh95-rmgr-6w4m");
    expect(minimist.ratings[0].severity).toBe("medium");
    expect(minimist.affects[0].ref).toBe("pkg:npm/minimist@1.2.0");
    expect(minimist.recommendation).toBe("Upgrade minimist to 1.2.3.");
    expect(minimist.references).toEqual([{ id: "CVE-2020-7598", source: { name: "NVD" } }]);
    const http = vdr.vulnerabilities.find((v: { id: string }) => v.id === "GHSA-4w2v-q235-vp99");
    expect(http.ratings[0].severity).toBe("critical");
    expect(http.recommendation).toBeUndefined();
    const refs = new Set(vdr.components.map((c: { "bom-ref": string }) => c["bom-ref"]));
    expect(vdr.vulnerabilities.every((v: { affects: { ref: string }[] }) => v.affects.every((a) => refs.has(a.ref)))).toBe(true);

    const index = EvidenceIndexSchema.parse(JSON.parse(readFileSync(join(out, "evidence.json"), "utf8")));
    expect(index.version).toBe("v1.1.0");
    expect(index.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(index.support?.until).toBe("2027-12-31");
    expect(index.security?.introduced.critical).toBe(1);
    expect(index.notes.provider).toBe("fallback");
    const names = index.files.map((f) => f.name);
    for (const n of ["release.json", "RELEASE_NOTES.md", "security.json", "sbom.cdx.json", "vdr.cdx.json", "history.json"]) expect(names).toContain(n);
    for (const f of index.files) {
      expect(existsSync(join(out, f.name))).toBe(true);
      expect(sha256(readFileSync(join(out, f.name), "utf8"))).toBe(f.sha256);
    }
  });
});
