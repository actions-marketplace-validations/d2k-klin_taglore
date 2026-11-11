import type { ChangeSet } from "./collect.js";
export interface PromptOptions {
    productName: string;
    version: string;
    previousVersion: string | null;
    language: string;
    tone: string;
    audience: string;
    instructions?: string;
}
export declare function buildPrompt(changes: ChangeSet, o: PromptOptions): string;
/** Pulls the first JSON object out of a model response (handles ```json fences and chatter). */
export declare function extractJson(text: string): unknown;
