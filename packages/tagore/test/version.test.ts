import { describe, expect, it } from "vitest";
import { announcementBase, parseSemver, releaseTypeOf, resolveBase } from "../src/version.js";

const tags = ["v1.0.0", "v1.0.1", "v1.1.0", "v1.8.0", "v1.8.1", "v1.8.2", "v1.9.0", "v1.9.1", "v2.0.0-rc.1", "nightly", "v2.0.0"];
const v = (t: string) => parseSemver(t)!;

describe("parseSemver", () => {
  it("parses tags with and without prefix", () => {
    expect(v("v1.9.0")).toMatchObject({ major: 1, minor: 9, patch: 0, prerelease: null });
    expect(parseSemver("1.2.3")).toMatchObject({ major: 1, minor: 2, patch: 3 });
    expect(parseSemver("v2.0.0-rc.1")?.prerelease).toBe("rc.1");
    expect(parseSemver("nightly")).toBeNull();
    expect(parseSemver("app-v1.2.3", "app-v")?.minor).toBe(2);
  });
});

describe("releaseTypeOf", () => {
  it("classifies versions", () => {
    expect(releaseTypeOf(v("v2.0.0"))).toBe("major");
    expect(releaseTypeOf(v("v1.9.0"))).toBe("minor");
    expect(releaseTypeOf(v("v1.9.1"))).toBe("patch");
    expect(releaseTypeOf(v("v2.0.0-rc.1"))).toBe("prerelease");
  });
});

describe("resolveBase", () => {
  it("auto: minor compares with previous minor, covering its patches", () => {
    expect(resolveBase(v("v1.9.0"), tags, "auto")?.raw).toBe("v1.8.0");
  });
  it("auto: major compares with the last minor", () => {
    expect(resolveBase(v("v2.0.0"), tags, "auto")?.raw).toBe("v1.9.0");
  });
  it("auto: patch compares with previous tag", () => {
    expect(resolveBase(v("v1.9.1"), tags, "auto")?.raw).toBe("v1.9.0");
    expect(resolveBase(v("v1.8.2"), tags, "auto")?.raw).toBe("v1.8.1");
  });
  it("previous-major", () => {
    expect(resolveBase(v("v2.0.0"), tags, "previous-major")?.raw).toBe("v1.0.0");
  });
  it("ignores prereleases as bases", () => {
    expect(resolveBase(v("v2.0.0"), tags, "previous-tag")?.raw).toBe("v1.9.1");
  });
  it("returns null for the first release", () => {
    expect(resolveBase(v("v1.0.0"), tags, "auto")).toBeNull();
  });
});

describe("announcementBase", () => {
  it("maps a patch to its minor", () => {
    expect(announcementBase(v("v1.9.1"), tags)?.raw).toBe("v1.9.0");
    expect(announcementBase(v("v1.8.2"), tags)?.raw).toBe("v1.8.0");
    expect(announcementBase(v("v1.9.0"), tags)?.raw).toBe("v1.9.0");
  });
});
