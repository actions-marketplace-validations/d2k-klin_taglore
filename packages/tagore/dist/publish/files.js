import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
export async function writeOutputDir(dir, files, cwd) {
    const abs = resolve(cwd, dir);
    await mkdir(abs, { recursive: true });
    const written = [];
    for (const f of files) {
        const p = join(abs, f.name);
        await writeFile(p, f.content, "utf8");
        written.push(p);
    }
    return written;
}
