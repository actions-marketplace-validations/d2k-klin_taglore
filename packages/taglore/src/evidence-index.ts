import { createHash } from "node:crypto";
import { z } from "zod";
import { TAGLORE_VERSION } from "./meta.js";
import { ReleaseTypeSchema, SupportSchema } from "./schema.js";
import { SecuritySummarySchema } from "./security/types.js";

/**
 * evidence.json: what Taglore produced for one release, with a SHA-256 per file, the commit it
 * was built from, and how the notes were checked. It is an index, not a compliance claim:
 * compliance tools and auditors can read it and verify each file against its hash.
 */
export const EvidenceIndexSchema = z.object({
  schemaVersion: z.literal(1),
  kind: z.literal("taglore-evidence"),
  product: z.string(),
  version: z.string(),
  previousVersion: z.string().nullable(),
  releaseType: ReleaseTypeSchema,
  /** Full SHA of the commit the release was built from. */
  commit: z.string(),
  repository: z.string().nullable(),
  generatedAt: z.string(),
  generator: z.object({ name: z.literal("taglore"), version: z.string() }),
  links: z.object({
    release: z.string().nullable(),
    compare: z.string().nullable(),
  }),
  notes: z.object({
    /** copilot, github-models or fallback (commit messages). */
    provider: z.string(),
    model: z.string().nullable(),
    /** How statements were checked against commits: warn, strict or off. */
    evidenceMode: z.string(),
    statements: z.number().int(),
    /** Statements without a supporting commit (removed when evidenceMode is strict). */
    unverified: z.number().int(),
    /** Notes reused from notes-from: checked when they were written, not again. */
    reused: z.boolean(),
    styleIssues: z.number().int(),
    /** The release was larger than the AI context budget; see the run log for what was left out. */
    contextTruncated: z.boolean(),
  }),
  security: SecuritySummarySchema.nullable(),
  support: SupportSchema.nullable(),
  files: z.array(
    z.object({
      name: z.string(),
      sha256: z.string().regex(/^[0-9a-f]{64}$/),
      bytes: z.number().int(),
      mediaType: z.string(),
    }),
  ),
});
export type EvidenceIndex = z.infer<typeof EvidenceIndexSchema>;

export function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function buildEvidenceIndex(
  o: Omit<EvidenceIndex, "schemaVersion" | "kind" | "generator" | "files" | "generatedAt"> & {
    files: { name: string; content: string; contentType: string }[];
    generatedAt?: string;
  },
): EvidenceIndex {
  return EvidenceIndexSchema.parse({
    schemaVersion: 1,
    kind: "taglore-evidence",
    ...o,
    generatedAt: o.generatedAt ?? new Date().toISOString(),
    generator: { name: "taglore", version: TAGLORE_VERSION },
    files: o.files.map((f) => ({
      name: f.name,
      sha256: sha256(f.content),
      bytes: Buffer.byteLength(f.content, "utf8"),
      mediaType: f.contentType.split(";")[0]!.trim(),
    })),
  });
}
