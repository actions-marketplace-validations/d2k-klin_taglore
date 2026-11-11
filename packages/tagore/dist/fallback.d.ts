import type { Commit } from "./collect.js";
import type { AiNotes } from "./schema.js";
/** Notes without AI, grouped by Conventional Commit type. Used when AI is disabled or fails. */
export declare function fallbackNotes(commits: Commit[], version: string): AiNotes;
