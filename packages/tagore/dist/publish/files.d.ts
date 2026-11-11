export interface OutFile {
    name: string;
    content: string;
    contentType: string;
    /** Short cache for files that change on every release. */
    cacheControl: string;
}
export declare function writeOutputDir(dir: string, files: OutFile[], cwd: string): Promise<string[]>;
