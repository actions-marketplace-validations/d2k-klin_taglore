import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runTagore } from "../src/run.js";

let repo: string;
let fakeCopilot: string;
const silent = { info: () => {}, warn: () => {} };

function sh(args: string[]) {
  execFileSync("git", args, { cwd: repo, stdio: "ignore", env: { ...process.env, GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z" } });
}
function commit(file: string, content: string, msg: string) {
  writeFileSync(join(repo, file), content);
  sh(["add", "."]);
  sh(["commit", "-m", msg]);
}

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), "tagore-test-"));
  sh(["init", "-q", "-b", "main"]);
  sh(["config", "user.email", "t@example.com"]);
  sh(["config", "user.name", "t"]);
  commit("a.txt", "1", "feat: first feature");
  sh(["tag", "v1.0.0"]);
  commit("b.txt", "2", "fix: login bug");
  sh(["tag", "v1.0.1"]);
  commit("c.txt", "3", "feat: dark mode");
  writeFileSync(join(repo, "package-lock.json"), "{}");
  commit("d.txt", "4", "perf: faster search");
  sh(["tag", "v1.1.0"]);
  commit("e.txt", "5", "fix: typo in settings");
  sh(["tag", "v1.1.1"]);

  // Stand-in for the Copilot CLI: prints a JSON answer, with a link that must be stripped.
  fakeCopilot = join(repo, "..", `fake-copilot-${Date.now()}.sh`);
  writeFileSync(
    fakeCopilot,
    `#!/bin/sh\ncat >/dev/null\necho 'Here are the notes:'\necho '{"title":"Dark mode is here","summary":"Switch themes. See https://evil.example","highlights":[{"title":"Dark mode","description":"Easier on the eyes."}],"improvements":[],"fixes":[],"breaking":[]}'\n`,
  );
  chmodSync(fakeCopilot, 0o755);
});

afterAll(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(fakeCopilot, { force: true });
});

describe("runTagore end to end", () => {
  it("minor release: AI notes, compared with previous minor, announces", async () => {
    const out = join(repo, "out-minor");
    const r = await runTagore({ cwd: repo, to: "v1.1.0", copilotCommand: fakeCopilot, publishGithubRelease: false, outputDir: out, log: silent });
    expect(r.previousVersion).toBe("v1.0.0");
    expect(r.releaseType).toBe("minor");
    expect(r.announce).toBe(true);
    expect(r.provider).toBe("copilot");
    expect(r.notes.summary).toBe("Switch themes. See");
    const latest = JSON.parse(readFileSync(join(out, "latest.json"), "utf8"));
    expect(latest.version).toBe("v1.1.0");
    expect(readFileSync(join(out, "RELEASE_NOTES.md"), "utf8")).toContain("Dark mode is here");
  });

  it("patch release: commit-based notes, no AI, reuses baseline announcement", async () => {
    const out = join(repo, "out-patch");
    const baseline = join(repo, "out-minor", "release.json");
    const r = await runTagore({ cwd: repo, to: "v1.1.1", copilotCommand: "/nonexistent", publishGithubRelease: false, outputDir: out, baselineFile: baseline, log: silent });
    expect(r.previousVersion).toBe("v1.1.0");
    expect(r.announce).toBe(false);
    expect(r.provider).toBe("fallback");
    expect(r.notes.fixes.map((f) => f.title)).toEqual(["Typo in settings"]);
    expect(JSON.parse(readFileSync(join(out, "latest.json"), "utf8")).version).toBe("v1.1.0");
  });

  it("falls back when the AI fails, or throws with on-ai-failure=fail", async () => {
    const r = await runTagore({ cwd: repo, to: "v1.1.0", copilotCommand: "/nonexistent", publishGithubRelease: false, dryRun: true, log: silent });
    expect(r.provider).toBe("fallback");
    expect(r.notes.highlights.map((h) => h.title)).toEqual(["Dark mode"]);
    await expect(
      runTagore({ cwd: repo, to: "v1.1.0", copilotCommand: "/nonexistent", onAiFailure: "fail", publishGithubRelease: false, dryRun: true, log: silent }),
    ).rejects.toThrow(/AI generation failed/);
  });

  it("explicit compare between any two refs", async () => {
    const r = await runTagore({ cwd: repo, compare: "explicit", from: "v1.0.0", to: "v1.1.1", provider: "none", publishGithubRelease: false, dryRun: true, log: silent });
    expect(r.previousVersion).toBe("v1.0.0");
    expect(r.notes.fixes.length).toBe(2);
  });

  it("first release compares from the root commit", async () => {
    const r = await runTagore({ cwd: repo, to: "v1.0.0", provider: "none", publishGithubRelease: false, dryRun: true, log: silent });
    expect(r.previousVersion).toBeNull();
    expect(r.notes.highlights.map((h) => h.title)).toEqual(["First feature"]);
  });
});
