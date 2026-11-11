import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AiProvider, AiResult } from "./types.js";

/** Linux caps a single argv entry at 128 KiB; larger prompts go through stdin. */
const MAX_ARG_PROMPT = 120 * 1024;

export interface CopilotOptions {
  /** Token with Copilot access. Fine-grained PAT ("Copilot Requests") or an org-billed GITHUB_TOKEN. */
  token?: string;
  model?: string;
  /** Path or command for the CLI. Default: "copilot" on PATH. */
  command?: string;
  extraArgs?: string[];
  timeoutMs?: number;
}

/**
 * Runs GitHub Copilot CLI non-interactively with NO tools allowed.
 * Taglore collects all context itself and passes it in the prompt, so Copilot
 * never touches the repository, the shell or the network on its own.
 * It runs in an empty temp directory to make that explicit.
 */
export function copilotProvider(o: CopilotOptions = {}): AiProvider {
  return {
    name: "copilot",
    async generate(prompt: string): Promise<AiResult> {
      const cwd = await mkdtemp(join(tmpdir(), "taglore-copilot-"));
      const useStdin = Buffer.byteLength(prompt) > MAX_ARG_PROMPT;
      const args = [
        ...(useStdin ? [] : ["-p", prompt]),
        "-s",
        "--no-ask-user",
        ...(o.model ? ["--model", o.model] : []),
        ...(o.extraArgs ?? []),
      ];
      const env: NodeJS.ProcessEnv = { ...process.env, NO_COLOR: "1" };
      if (o.token) env.COPILOT_GITHUB_TOKEN = o.token;

      try {
        const text = await run(o.command ?? "copilot", args, cwd, env, useStdin ? prompt : null, o.timeoutMs ?? 10 * 60_000);
        return { text, model: o.model ?? null };
      } finally {
        await rm(cwd, { recursive: true, force: true });
      }
    },
  };
}

function run(cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv, stdin: string | null, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Copilot CLI timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(new Error(`Could not start Copilot CLI (${cmd}): ${e.message}. Install it with: npm install -g @github/copilot`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && out.trim()) resolve(out);
      else reject(new Error(`Copilot CLI exited with code ${code}: ${(err || out).trim().slice(0, 2000)}`));
    });
    if (stdin !== null) child.stdin.end(stdin);
    else child.stdin.end();
  });
}
