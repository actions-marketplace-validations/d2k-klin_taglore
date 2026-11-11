import type { Commit } from "./collect.js";
import type { ReleaseNotes } from "./schema.js";
export declare function renderMarkdown(n: ReleaseNotes, opts: {
    commits: Commit[];
    compareUrl?: string | null;
    includeCommits?: boolean;
}): string;
