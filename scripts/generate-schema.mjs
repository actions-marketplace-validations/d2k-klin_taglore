// Writes schema/release.schema.json from the zod schema, so apps and the action agree on one format.
import { writeFile, mkdir } from "node:fs/promises";
import { z } from "zod";
import { EvidenceIndexSchema, ReleaseNotesSchema } from "../packages/taglore/dist/index.js";

const schema = {
  ...z.toJSONSchema(ReleaseNotesSchema, { io: "output" }),
  $id: "https://raw.githubusercontent.com/d2k-klin/taglore/main/schema/release.schema.json",
  title: "Taglore release notes",
};
await mkdir("schema", { recursive: true });
await writeFile("schema/release.schema.json", JSON.stringify(schema, null, 2) + "\n");
console.log("schema/release.schema.json written");

const evidence = {
  ...z.toJSONSchema(EvidenceIndexSchema, { io: "output" }),
  $id: "https://raw.githubusercontent.com/d2k-klin/taglore/main/schema/evidence.schema.json",
  title: "Taglore release evidence index",
};
await writeFile("schema/evidence.schema.json", JSON.stringify(evidence, null, 2) + "\n");
console.log("schema/evidence.schema.json written");
