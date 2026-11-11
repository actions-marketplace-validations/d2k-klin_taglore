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
  return (await git(["rev-parse", "--verify", `${ref}^{commit}`], cwd)).trim();
}

export async function refDate(ref: string, cwd: string): Promise<string> {
  return (await git(["log", "-1", "--format=%cI", ref], cwd)).trim();
}
