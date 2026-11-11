import express from "express";
import { readFileSync } from "node:fs";

const app = express();

// Serve the files as-is: GET /release-notes/latest.json
app.use("/release-notes", express.static("release-notes", { maxAge: "60s" }));

// Or read them at startup, e.g. to show the current version in an /api/version endpoint.
const latest = JSON.parse(readFileSync("release-notes/latest.json", "utf8"));
app.get("/api/version", (_req, res) => res.json({ version: latest.version, title: latest.title }));

app.listen(3000);
