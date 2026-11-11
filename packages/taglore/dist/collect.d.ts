export interface Commit {
    sha: string;
    author: string;
    subject: string;
    body: string;
}
export interface ChangedFile {
    status: string;
    path: string;
}
export interface ChangeSet {
    from: string | null;
    to: string;
    commits: Commit[];
    files: ChangedFile[];
    stat: string;
    diff: string;
    diffTruncated: boolean;
}
export declare const DEFAULT_EXCLUDES: string[];
export declare function collectCommits(from: string | null, to: string, cwd: string): Promise<Commit[]>;
/**
 * Collects commits, changed files and a size-capped diff.
 * Each file's diff is capped so one huge file cannot crowd out the rest.
 */
export declare function collectChanges(opts: {
    from: string | null;
    to: string;
    cwd: string;
    excludes: string[];
    maxDiffBytes: number;
}): Promise<ChangeSet>;
