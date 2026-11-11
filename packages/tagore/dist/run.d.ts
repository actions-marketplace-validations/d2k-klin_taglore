import type { ProviderName } from "./providers/types.js";
import { type OutFile } from "./publish/files.js";
import { type ReleaseNotes, type ReleaseType } from "./schema.js";
import { type CompareMode } from "./version.js";
export interface Logger {
    info(msg: string): void;
    warn(msg: string): void;
}
export interface TagoreOptions {
    cwd?: string;
    /** Release ref (tag). Default: the tag that triggered the workflow, or the tag on HEAD. */
    to?: string;
    /** Base ref, only used with compare: "explicit". */
    from?: string;
    compare?: CompareMode;
    tagPrefix?: string;
    provider?: ProviderName;
    model?: string;
    copilotToken?: string;
    copilotCommand?: string;
    copilotArgs?: string[];
    /** Which release types get AI notes. Others use commit-based notes. Default: major, minor. */
    aiFor?: ReleaseType[];
    onAiFailure?: "fallback" | "fail";
    announceOn?: ReleaseType[];
    excludes?: string[];
    maxDiffKb?: number;
    language?: string;
    tone?: string;
    audience?: string;
    productName?: string;
    instructions?: string;
    /** GitHub token for releases (contents: write) and, with github-models, inference. */
    githubToken?: string;
    repository?: string;
    githubApiUrl?: string;
    githubServerUrl?: string;
    publishGithubRelease?: boolean;
    releaseDraft?: boolean;
    includeCommits?: boolean;
    /** Existing tagore.json to use as latest.json on patch releases (instead of downloading it). */
    baselineFile?: string;
    outputDir?: string;
    s3Uri?: string;
    s3Region?: string;
    dryRun?: boolean;
    log?: Logger;
}
export interface TagoreResult {
    version: string;
    previousVersion: string | null;
    releaseType: ReleaseType;
    announce: boolean;
    provider: string;
    notes: ReleaseNotes;
    /** The announcement apps should show (this release, or the last major/minor). */
    latest: ReleaseNotes | null;
    markdown: string;
    files: OutFile[];
    writtenFiles: string[];
    s3Keys: string[];
    releaseUrl: string | null;
    compareUrl: string | null;
}
export declare function runTagore(opts?: TagoreOptions): Promise<TagoreResult>;
