#!/usr/bin/env python3
import json, os, urllib.parse, urllib.request

CLUBS = {
    "milan": "A.C. Milan",
    "chelsea": "Chelsea F.C.",
    "real-madrid": "Real Madrid CF",
    "juventus": "Juventus FC",
    "arsenal": "Arsenal F.C.",
    "inter": "Inter Milan",
    "lazio": "S.S. Lazio",
    "roma": "AS Roma",
    "man-city": "Manchester City F.C.",
    "liverpool": "Liverpool F.C.",
    "man-united": "Manchester United F.C.",
}

OUT = os.path.join("assets", "clubs")
os.makedirs(OUT, exist_ok=True)
manifest = {}
headers = {"User-Agent": "LigaTribunMiniApp/1.0 (GitHub Pages build)"}

for key, title in CLUBS.items():
    api = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_"), safe="")
    req = urllib.request.Request(api, headers=headers)
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.load(r)
    source = (data.get("thumbnail") or {}).get("source") or (data.get("originalimage") or {}).get("source")
    if not source:
        raise RuntimeError(f"No logo image found for {title}")
    img_req = urllib.request.Request(source, headers=headers)
    with urllib.request.urlopen(img_req, timeout=25) as r:
        blob = r.read()
        ctype = (r.headers.get("Content-Type") or "").split(";")[0].lower()
    ext = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/svg+xml": ".svg" }.get(ctype)
    if not ext:
        raise RuntimeError(f"Unsupported logo content type for {title}: {ctype}")
    filename = key + ext
    with open(os.path.join(OUT, filename), "wb") as f:
        f.write(blob)
    manifest[key] = "./assets/clubs/" + filename
    print(f"{key}: {filename} ({len(blob)} bytes)")

if len(manifest) != len(CLUBS):
    raise RuntimeError("Not all club logos were downloaded")

with open(os.path.join(OUT, "manifest.js"), "w", encoding="utf-8") as f:
    f.write("window.LT_CLUB_LOGOS=" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n")
print("Generated", len(manifest), "club logos")
