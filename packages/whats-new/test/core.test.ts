import { beforeEach, describe, expect, it } from "vitest";
import { shouldShow } from "../src/core.js";
import type { ReleaseNotes } from "../src/types.js";

const store = new Map<string, string>();
(globalThis as { window?: unknown }).window = {
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) },
};
const notes = (version: string, announce = true) => ({ version, announce }) as ReleaseNotes;

describe("shouldShow", () => {
  beforeEach(() => store.clear());
  it("marks first-time visitors as up to date", () => {
    expect(shouldShow(notes("v1.9.0"), "k", false)).toBe(false);
    expect(store.get("k")).toBe("v1.9.0");
  });
  it("shows to first-time visitors when asked", () => {
    expect(shouldShow(notes("v1.9.0"), "k", true)).toBe(true);
  });
  it("shows newer versions once", () => {
    store.set("k", "v1.8.0");
    expect(shouldShow(notes("v1.9.0"), "k", false)).toBe(true);
    store.set("k", "v1.9.0");
    expect(shouldShow(notes("v1.9.0"), "k", false)).toBe(false);
  });
  it("never shows non-announcements", () => {
    store.set("k", "v1.0.0");
    expect(shouldShow(notes("v1.9.1", false), "k", true)).toBe(false);
  });
});
