import type { AiNotes } from "./schema.js";
/**
 * AI output ends up in front of end users, so treat it as untrusted:
 * strip HTML, markdown links, bare URLs, control characters and code fences.
 */
export declare function cleanText(input: string, max: number): string;
export declare function sanitizeNotes(n: AiNotes): AiNotes;
