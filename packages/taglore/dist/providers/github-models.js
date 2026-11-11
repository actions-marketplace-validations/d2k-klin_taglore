/** GitHub Models inference API. Note: free tiers have small input limits, keep max-diff-kb low. */
export function githubModelsProvider(o) {
    const model = o.model ?? "openai/gpt-4.1-mini";
    return {
        name: "github-models",
        async generate(prompt) {
            const res = await fetch(o.endpoint ?? "https://models.github.ai/inference/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${o.token}`,
                    Accept: "application/vnd.github+json",
                    "Content-Type": "application/json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                body: JSON.stringify({
                    model,
                    temperature: 0.2,
                    messages: [
                        { role: "system", content: "You write accurate, user-facing release notes and reply with JSON only." },
                        { role: "user", content: prompt },
                    ],
                }),
            });
            if (!res.ok)
                throw new Error(`GitHub Models request failed: ${res.status} ${(await res.text()).slice(0, 500)}`);
            const data = (await res.json());
            const text = data.choices?.[0]?.message?.content;
            if (!text)
                throw new Error("GitHub Models returned an empty response");
            return { text, model };
        },
    };
}
