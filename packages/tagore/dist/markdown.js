function section(title, items) {
    if (!items.length)
        return "";
    const lines = items.map((i) => (i.description ? `- **${i.title}**: ${i.description}` : `- ${i.title}`));
    return `### ${title}\n\n${lines.join("\n")}\n\n`;
}
export function renderMarkdown(n, opts) {
    let md = `## ${n.title}\n\n${n.summary}\n\n`;
    md += section("⚠️ Breaking changes", n.breaking);
    md += section("✨ Highlights", n.highlights);
    md += section("🚀 Improvements", n.improvements);
    md += section("🐛 Fixes", n.fixes);
    if (opts.includeCommits !== false && opts.commits.length) {
        const list = opts.commits
            .slice(0, 200)
            .map((c) => `- ${c.subject.replace(/[<>]/g, "")} (${c.sha.slice(0, 7)})`)
            .join("\n");
        md += `<details>\n<summary>${opts.commits.length} commit${opts.commits.length > 1 ? "s" : ""}</summary>\n\n${list}\n\n</details>\n\n`;
    }
    if (opts.compareUrl)
        md += `**Full changelog:** ${opts.compareUrl}\n\n`;
    const ai = n.generator.provider === "fallback" ? "generated from commit messages" : `written with AI (${n.generator.provider})`;
    md += `<sub>Release notes ${ai} by [Tagore](https://github.com/d2k-klin/tagore).</sub>\n`;
    return md;
}
