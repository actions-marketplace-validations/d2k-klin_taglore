const CC_RE = /^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?:\s*(?<desc>.+)$/;
const SKIP = new Set(["chore", "ci", "build", "test", "tests", "style", "refactor", "docs", "release", "revert"]);
function item(desc, scope) {
    const t = desc.charAt(0).toUpperCase() + desc.slice(1);
    return { title: scope ? `${scope}: ${t}` : t, description: "" };
}
/** Notes without AI, grouped by Conventional Commit type. Used when AI is disabled or fails. */
export function fallbackNotes(commits, version) {
    const highlights = [];
    const improvements = [];
    const fixes = [];
    const breaking = [];
    for (const c of commits) {
        const m = CC_RE.exec(c.subject);
        const isBreaking = Boolean(m?.groups?.bang) || /BREAKING[ -]CHANGE:/.test(c.body);
        if (!m?.groups) {
            if (!/^(merge|bump|wip)\b/i.test(c.subject))
                improvements.push(item(c.subject));
            continue;
        }
        const { type = "", scope, desc = "" } = m.groups;
        const t = type.toLowerCase();
        if (isBreaking)
            breaking.push(item(desc, scope));
        if (t === "feat")
            highlights.push(item(desc, scope));
        else if (t === "fix")
            fixes.push(item(desc, scope));
        else if (t === "perf")
            improvements.push(item(desc, scope));
        else if (!SKIP.has(t))
            improvements.push(item(desc, scope));
    }
    const parts = [
        highlights.length && `${highlights.length} new feature${highlights.length > 1 ? "s" : ""}`,
        improvements.length && `${improvements.length} improvement${improvements.length > 1 ? "s" : ""}`,
        fixes.length && `${fixes.length} fix${fixes.length > 1 ? "es" : ""}`,
    ].filter(Boolean);
    return {
        title: `Release ${version}`,
        summary: parts.length ? `This release includes ${parts.join(", ")}.` : "Maintenance release.",
        highlights: highlights.slice(0, 8),
        improvements: improvements.slice(0, 15),
        fixes: fixes.slice(0, 20),
        breaking: breaking.slice(0, 10),
    };
}
