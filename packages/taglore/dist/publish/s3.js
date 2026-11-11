export function parseS3Uri(uri) {
    const m = /^s3:\/\/([^/]+)\/?(.*)$/.exec(uri);
    if (!m?.[1])
        throw new Error(`Invalid S3 URI "${uri}", expected s3://bucket/optional/prefix/`);
    const prefix = (m[2] ?? "").replace(/^\/+/, "");
    return { bucket: m[1], prefix: prefix && !prefix.endsWith("/") ? `${prefix}/` : prefix };
}
/**
 * Uploads files with the default AWS credential chain (OIDC role from
 * aws-actions/configure-aws-credentials, env vars, instance profile...).
 * Taglore never takes AWS keys as inputs.
 */
export async function uploadToS3(uri, files, region) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { bucket, prefix } = parseS3Uri(uri);
    const client = new S3Client(region ? { region } : {});
    const keys = [];
    for (const f of files) {
        const key = `${prefix}${f.name}`;
        await client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: f.content,
            ContentType: f.contentType,
            CacheControl: f.cacheControl,
        }));
        keys.push(`s3://${bucket}/${key}`);
    }
    return keys;
}
