export declare function git(args: string[], cwd: string): Promise<string>;
export declare function listTags(cwd: string): Promise<string[]>;
export declare function isShallow(cwd: string): Promise<boolean>;
export declare function resolveRef(ref: string, cwd: string): Promise<string>;
export declare function refDate(ref: string, cwd: string): Promise<string>;
