import { describe, expect, it } from "vitest";
import { compareVersions, isReleaseNotes } from "../src/types.js";

describe("compareVersions", () => {
  it("compares numerically", () => {
    expect(compareVersions("v1.10.0", "v1.9.0")).toBeGreaterThan(0);
    expect(compareVersions("v1.9.0", "1.9.0")).toBe(0);
    expect(compareVersions("v1.9.0", "v2.0.0")).toBeLessThan(0);
  });
});

describe("isReleaseNotes", () => {
  it("validates the shape", () => {
    expect(isReleaseNotes({ schemaVersion: 1, version: "v1", title: "t", summary: "s", announce: true, highlights: [] })).toBe(true);
    expect(isReleaseNotes({ version: "v1" })).toBe(false);
    expect(isReleaseNotes(null)).toBe(false);
  });
});
