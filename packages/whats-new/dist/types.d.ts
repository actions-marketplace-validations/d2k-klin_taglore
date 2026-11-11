/** Matches schema/release.schema.json (schemaVersion 1). */
export interface NoteItem {
    title: string;
    description: string;
}
export interface ReleaseNotes {
    schemaVersion: 1;
    version: string;
    previousVersion: string | null;
    releaseType: "major" | "minor" | "patch" | "prerelease";
    announce: boolean;
    date: string;
    title: string;
    summary: string;
    highlights: NoteItem[];
    improvements: NoteItem[];
    fixes: NoteItem[];
    breaking: NoteItem[];
    generator: {
        name: "tagore";
        version: string;
        provider: string;
        model: string | null;
    };
}
export declare function isReleaseNotes(v: unknown): v is ReleaseNotes;
/** Compares "v1.10.0" and "1.9.2" numerically. Returns >0 when a is newer. */
export declare function compareVersions(a: string, b: string): number;
