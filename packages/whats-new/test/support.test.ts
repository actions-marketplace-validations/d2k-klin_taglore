import { describe, expect, it } from "vitest";
import { DEFAULT_SUPPORT_LABELS, latestSupport, safeHref, supportParts } from "../src/core.js";
import type { ReleaseNotes } from "../src/types.js";

describe("support line", () => {
  it("renders only https: and mailto: links", () => {
    expect(safeHref("https://acme.example/security")).toBe("https://acme.example/security");
    expect(safeHref("mailto:security@acme.example")).toBe("mailto:security@acme.example");
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "http://acme.example", "/relative", 42, null]) expect(safeHref(bad)).toBeNull();
  });

  it("builds the parts in order, with the date filled in, and drops unsafe links", () => {
    const parts = supportParts(
      { until: "2027-12-31", contact: "mailto:security@acme.example", sbom: "javascript:alert(1)" },
      DEFAULT_SUPPORT_LABELS,
      "en-GB",
    );
    expect(parts).toEqual([
      { kind: "until", text: "Security updates until 31 Dec 2027", href: null },
      { kind: "contact", text: "Report a vulnerability", href: "mailto:security@acme.example" },
    ]);
    expect(supportParts(undefined, DEFAULT_SUPPORT_LABELS)).toEqual([]);
    expect(supportParts({ until: "soon", contact: null, sbom: null }, DEFAULT_SUPPORT_LABELS)).toEqual([]);
  });

  it("the changelog uses the newest release that has support information", () => {
    const r = (version: string, support?: ReleaseNotes["support"]) => ({ version, support }) as ReleaseNotes;
    expect(latestSupport([r("v2.1.0"), r("v2.0.0", { until: "2027-06-30", contact: null, sbom: null }), r("v1.0.0", { until: "2026-01-01", contact: null, sbom: null })])?.until).toBe("2027-06-30");
    expect(latestSupport([r("v1.0.0")])).toBeUndefined();
  });
});
