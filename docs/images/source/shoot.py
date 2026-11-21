# Regenerates docs/images/*.png from the sample app, with the current web components.
# Run from the repository root after `npm run build`:  python3 docs/images/source/shoot.py
# Needs: pip install playwright pillow && playwright install chromium
import os, shutil, subprocess, tempfile, time
from PIL import Image
from playwright.sync_api import sync_playwright

src = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(src, "..")
work = tempfile.mkdtemp()
for f in ("app.html", "cards.html", "build.py"):
    shutil.copy(os.path.join(src, f), work)
os.makedirs(os.path.join(work, "release-notes"))
shutil.copy("dist/whats-new.js", os.path.join(work, "release-notes", "taglore-whats-new.js"))
subprocess.run(["python3", "build.py"], cwd=work, check=True)
server = subprocess.Popen(["python3", "-m", "http.server", "8766"], cwd=work, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for name, page, height in (("whats-new", "index.html", 760), ("changelog", "changelog.html", 900)):
            pg = b.new_page(viewport={"width": 1200, "height": height}, device_scale_factor=2)
            pg.goto(f"http://127.0.0.1:8766/{page}")
            pg.wait_for_timeout(1200)
            raw = os.path.join(work, f"{name}.png")
            pg.screenshot(path=raw)
            im = Image.open(raw).convert("RGB")
            im = im.resize((im.width * 3 // 4, im.height * 3 // 4), Image.LANCZOS)
            im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(os.path.join(out, f"{name}.png"), optimize=True)
        b.close()
finally:
    server.terminate()
