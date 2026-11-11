export interface AiResult {
  text: string;
  model: string | null;
}

export interface AiProvider {
  name: string;
  generate(prompt: string): Promise<AiResult>;
}

export type ProviderName = "copilot" | "github-models" | "none";
