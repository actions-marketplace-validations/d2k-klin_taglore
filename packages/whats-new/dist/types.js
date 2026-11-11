export function isReleaseNotes(v) {
    if (!v || typeof v !== "object")
        return false;
    const n = v;
    return (n.schemaVersion === 1 &&
        typeof n.version === "string" &&
        typeof n.title === "string" &&
        typeof n.summary === "string" &&
        typeof n.announce === "boolean" &&
        Array.isArray(n.highlights));
}
/** Compares "v1.10.0" and "1.9.2" numerically. Returns >0 when a is newer. */
export function compareVersions(a, b) {
    const parse = (v) => (v.match(/\d+/g) ?? []).slice(0, 3).map(Number);
    const pa = parse(a);
    const pb = parse(b);
    for (let i = 0; i < 3; i++) {
        const d = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (d !== 0)
            return d;
    }
    return 0;
}
