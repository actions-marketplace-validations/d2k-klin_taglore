import { z } from "zod";
/** Bump when the JSON shape changes in a breaking way. */
export const SCHEMA_VERSION = 1;
export const ReleaseTypeSchema = z.enum(["major", "minor", "patch", "prerelease"]);
export const NoteItemSchema = z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(600).default(""),
});
/**
 * What the AI must return. Kept small on purpose: everything else
 * (version, dates, links, commit list) is filled in by Tagore itself.
 */
export const AiNotesSchema = z.object({
    title: z.string().min(1).max(100),
    summary: z.string().min(1).max(600),
    highlights: z.array(NoteItemSchema).max(8).default([]),
    improvements: z.array(NoteItemSchema).max(15).default([]),
    fixes: z.array(NoteItemSchema).max(20).default([]),
    breaking: z.array(NoteItemSchema).max(10).default([]),
});
/** The file consumed by apps (latest.json / release.json). */
export const ReleaseNotesSchema = AiNotesSchema.extend({
    schemaVersion: z.literal(SCHEMA_VERSION),
    version: z.string().min(1),
    previousVersion: z.string().nullable(),
    releaseType: ReleaseTypeSchema,
    /** True when this release should trigger a new in-app announcement. */
    announce: z.boolean(),
    date: z.string(),
    generator: z.object({
        name: z.literal("tagore"),
        version: z.string(),
        /** "copilot", "github-models" or "fallback" (no AI). */
        provider: z.string(),
        model: z.string().nullable(),
    }),
});
