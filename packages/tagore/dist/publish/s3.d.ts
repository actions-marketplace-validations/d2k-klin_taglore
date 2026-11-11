import type { OutFile } from "./files.js";
export declare function parseS3Uri(uri: string): {
    bucket: string;
    prefix: string;
};
/**
 * Uploads files with the default AWS credential chain (OIDC role from
 * aws-actions/configure-aws-credentials, env vars, instance profile...).
 * Tagore never takes AWS keys as inputs.
 */
export declare function uploadToS3(uri: string, files: OutFile[], region?: string): Promise<string[]>;
