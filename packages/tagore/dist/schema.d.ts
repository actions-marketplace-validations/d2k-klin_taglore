import { z } from "zod";
/** Bump when the JSON shape changes in a breaking way. */
export declare const SCHEMA_VERSION: 1;
export declare const ReleaseTypeSchema: z.ZodEnum<{
    major: "major";
    minor: "minor";
    patch: "patch";
    prerelease: "prerelease";
}>;
export type ReleaseType = z.infer<typeof ReleaseTypeSchema>;
export declare const NoteItemSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type NoteItem = z.infer<typeof NoteItemSchema>;
/**
 * What the AI must return. Kept small on purpose: everything else
 * (version, dates, links, commit list) is filled in by Tagore itself.
 */
export declare const AiNotesSchema: z.ZodObject<{
    title: z.ZodString;
    summary: z.ZodString;
    highlights: z.ZodDefault<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    improvements: z.ZodDefault<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    fixes: z.ZodDefault<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    breaking: z.ZodDefault<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type AiNotes = z.infer<typeof AiNotesSchema>;
/** The file consumed by apps (latest.json / release.json). */
export declare const ReleaseNotesSchema: z.ZodObject<{
    title: z.ZodString;
    summary: z.ZodString;
    highlights: z.ZodDefault<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    improvements: z.ZodDefault<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    fixes: z.ZodDefault<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    breaking: z.ZodDefault<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    schemaVersion: z.ZodLiteral<1>;
    version: z.ZodString;
    previousVersion: z.ZodNullable<z.ZodString>;
    releaseType: z.ZodEnum<{
        major: "major";
        minor: "minor";
        patch: "patch";
        prerelease: "prerelease";
    }>;
    announce: z.ZodBoolean;
    date: z.ZodString;
    generator: z.ZodObject<{
        name: z.ZodLiteral<"tagore">;
        version: z.ZodString;
        provider: z.ZodString;
        model: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ReleaseNotes = z.infer<typeof ReleaseNotesSchema>;
