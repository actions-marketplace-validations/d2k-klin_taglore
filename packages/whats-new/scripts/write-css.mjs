// Generates styles.css from src/styles.ts (built to dist/styles.js) so React users can import it.
import { writeFile } from "node:fs/promises";
import { CSS } from "../dist/styles.js";
await writeFile(new URL("../styles.css", import.meta.url), CSS);
