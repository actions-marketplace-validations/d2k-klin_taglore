import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
export async function git(args, cwd) {
    const { stdout } = await exec("git", args, { cwd, maxBuffer: 256 * 1024 * 1024 });
    return stdout;
}
export async function listTags(cwd) {
    const out = await git(["tag", "--list"], cwd);
    return out.split("\n").map((t) => t.trim()).filter(Boolean);
}
export async function isShallow(cwd) {
    const out = await git(["rev-parse", "--is-shallow-repository"], cwd);
    return out.trim() === "true";
}
export async function resolveRef(ref, cwd) {
    return (await git(["rev-parse", "--verify", `${ref}^{commit}`], cwd)).trim();
}
export async function refDate(ref, cwd) {
    return (await git(["log", "-1", "--format=%cI", ref], cwd)).trim();
}
