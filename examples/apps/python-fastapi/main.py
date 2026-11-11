import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()
NOTES_DIR = Path("release-notes")

# Serve the files as-is: GET /release-notes/latest.json
app.mount("/release-notes", StaticFiles(directory=NOTES_DIR), name="release-notes")

# Or read them, e.g. for server-rendered templates (Django/Flask work the same way).
latest = json.loads((NOTES_DIR / "latest.json").read_text())


@app.get("/api/version")
def version():
    return {"version": latest["version"], "title": latest["title"]}
