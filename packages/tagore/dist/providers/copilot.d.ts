import type { AiProvider } from "./types.js";
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
 * Tagore collects all context itself and passes it in the prompt, so Copilot
 * never touches the repository, the shell or the network on its own.
 * It runs in an empty temp directory to make that explicit.
 */
export declare function copilotProvider(o?: CopilotOptions): AiProvider;
