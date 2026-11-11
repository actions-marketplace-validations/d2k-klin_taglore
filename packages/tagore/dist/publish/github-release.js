import { getOctokit } from "@actions/github";
export const RELEASE_ASSET_NAME = "tagore.json";
export function parseRepo(full) {
    const [owner, repo] = full.split("/");
    if (!owner || !repo)
        throw new Error(`Invalid repository "${full}", expected owner/name`);
    return { owner, repo };
}
export class GitHubReleases {
    ref;
    octokit;
    constructor(token, ref, baseUrl) {
        this.ref = ref;
        this.octokit = getOctokit(token, baseUrl ? { baseUrl } : {});
    }
    async findByTag(tag) {
        try {
            const { data } = await this.octokit.rest.repos.getReleaseByTag({ ...this.ref, tag });
            return data;
        }
        catch (e) {
            if (e.status === 404)
                return null;
            throw e;
        }
    }
    /** Creates the release, or updates the body of an existing one (e.g. created by another workflow). */
    async upsert(o) {
        const existing = await this.findByTag(o.tag);
        if (existing) {
            const { data } = await this.octokit.rest.repos.updateRelease({
                ...this.ref,
                release_id: existing.id,
                name: o.name,
                body: o.body,
            });
            return data;
        }
        const { data } = await this.octokit.rest.repos.createRelease({
            ...this.ref,
            tag_name: o.tag,
            name: o.name,
            body: o.body,
            prerelease: o.prerelease,
            draft: o.draft,
            make_latest: o.makeLatest ? "true" : "false",
        });
        return data;
    }
    async uploadAsset(releaseId, name, content) {
        const { data: assets } = await this.octokit.rest.repos.listReleaseAssets({ ...this.ref, release_id: releaseId, per_page: 100 });
        for (const a of assets.filter((a) => a.name === name)) {
            await this.octokit.rest.repos.deleteReleaseAsset({ ...this.ref, asset_id: a.id });
        }
        await this.octokit.rest.repos.uploadReleaseAsset({
            ...this.ref,
            release_id: releaseId,
            name,
            // Octokit types expect string; the request is sent as raw bytes.
            data: content,
            headers: { "content-type": "application/json", "content-length": Buffer.byteLength(content) },
        });
    }
    /** Reads tagore.json from an earlier release. Returns null if the release or asset doesn't exist. */
    async readAsset(tag, name = RELEASE_ASSET_NAME) {
        const release = await this.findByTag(tag);
        const asset = release?.assets.find((a) => a.name === name);
        if (!asset)
            return null;
        const res = await this.octokit.request("GET /repos/{owner}/{repo}/releases/assets/{asset_id}", {
            ...this.ref,
            asset_id: asset.id,
            headers: { accept: "application/octet-stream" },
        });
        const data = res.data;
        if (typeof data === "string")
            return data;
        if (data instanceof ArrayBuffer)
            return Buffer.from(data).toString("utf8");
        return JSON.stringify(data);
    }
}
