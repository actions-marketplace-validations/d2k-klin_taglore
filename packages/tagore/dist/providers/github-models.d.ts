import type { AiProvider } from "./types.js";
export interface GitHubModelsOptions {
    /** GITHUB_TOKEN with `models: read`, or a PAT with the Models permission. */
    token: string;
    model?: string;
    endpoint?: string;
}
/** GitHub Models inference API. Note: free tiers have small input limits, keep max-diff-kb low. */
export declare function githubModelsProvider(o: GitHubModelsOptions): AiProvider;
