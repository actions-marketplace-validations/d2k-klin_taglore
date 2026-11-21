import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function git(args: string[], cwd: string): Promise<string> {
  const { stdout } = await exec("git", args, { cwd, maxBuffer: 256 * 1024 * 1024 });
  return stdout;
}

export async function listTags(cwd: string): Promise<string[]> {
  const out = await git(["tag", "--list"], cwd);
  return out.split("\n").map((t) => t.trim()).filter(Boolean);
}

export async function isShallow(cwd: string): Promise<boolean> {
  const out = await git(["rev-parse", "--is-shallow-repository"], cwd);
  return out.trim() === "true";
}

export async function resolveRef(ref: string, cwd: string): Promise<string> {
  try {
    return (await git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], cwd)).trim();
  } catch {
    const shallow = (await git(["rev-parse", "--is-shallow-repository"], cwd).catch(() => "")).trim() === "true";
    throw new Error(
      `"${ref}" is not a tag, branch or commit in this repository.` +
        (shallow
          ? " The checkout is shallow: use actions/checkout with fetch-depth: 0 so tags and history are there."
          : " Check the name, or fetch tags first (git fetch --tags)."),
    );
  }
}

export async function refDate(ref: string, cwd: string): Promise<string> {
  return (await git(["log", "-1", "--format=%cI", ref], cwd)).trim();
}
