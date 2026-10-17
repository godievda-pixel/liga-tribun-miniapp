#!/usr/bin/env python3
import json, os, urllib.parse, urllib.request, urllib.error, random, time
from concurrent.futures import ThreadPoolExecutor

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
    "tottenham": "Tottenham Hotspur F.C.",
    "newcastle": "Newcastle United F.C.",
    "aston-villa": "Aston Villa F.C.",
    "barcelona": "FC Barcelona",
    "atletico-madrid": "Atlético Madrid",
    "sevilla": "Sevilla FC",
    "valencia": "Valencia CF",
    "real-betis": "Real Betis",
    "napoli": "SSC Napoli",
    "atalanta": "Atalanta BC",
    "fiorentina": "ACF Fiorentina",
    "bayern": "FC Bayern Munich",
    "borussia-dortmund": "Borussia Dortmund",
    "bayer-leverkusen": "Bayer 04 Leverkusen",
    "rb-leipzig": "RB Leipzig",
    "psg": "Paris Saint-Germain FC",
    "marseille": "Olympique de Marseille",
    "monaco": "AS Monaco FC",
    "benfica": "S.L. Benfica",
    "porto": "FC Porto",
    "sporting": "Sporting CP",
    "ajax": "AFC Ajax",
    "psv": "PSV Eindhoven",
    "feyenoord": "Feyenoord",
    "celtic": "Celtic F.C.",
    "rangers": "Rangers F.C.",
    "galatasaray": "Galatasaray S.K. (football)",
    "fenerbahce": "Fenerbahçe S.K. (football)",
    "besiktas": "Beşiktaş J.K.",
    "zenit": "FC Zenit Saint Petersburg",
    "spartak-moscow": "FC Spartak Moscow",
    "cska-moscow": "PFC CSKA Moscow",
    "lokomotiv-moscow": "FC Lokomotiv Moscow",
    "dynamo-moscow": "FC Dynamo Moscow",
    "krasnodar": "FC Krasnodar",
    "rostov": "FC Rostov",
    "rubin": "FC Rubin Kazan",
}

OUT = os.path.join("assets", "clubs")
os.makedirs(OUT, exist_ok=True)
manifest = {}
headers = {"User-Agent": "LigaTribunMiniApp/1.0 (GitHub Pages build)"}

def open_with_retry(req):
    for attempt in range(4):
        try:
            return urllib.request.urlopen(req, timeout=12)
        except urllib.error.HTTPError as exc:
            if exc.code != 429 or attempt == 3:
                raise
            time.sleep((1.5 * (2 ** attempt)) + random.uniform(0, 0.4))

def download_one(item):
    key, title = item
    try:
        api = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_"), safe="")
        req = urllib.request.Request(api, headers=headers)
        with open_with_retry(req) as r:
            data = json.load(r)
        source = (data.get("thumbnail") or {}).get("source") or (data.get("originalimage") or {}).get("source")
        if not source:
            raise RuntimeError(f"No logo image found for {title}")
        img_req = urllib.request.Request(source, headers=headers)
        with open_with_retry(img_req) as r:
            blob = r.read()
            ctype = (r.headers.get("Content-Type") or "").split(";")[0].lower()
        ext = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/svg+xml": ".svg"}.get(ctype)
        if not ext:
            raise RuntimeError(f"Unsupported logo content type for {title}: {ctype}")
        filename = key + ext
        with open(os.path.join(OUT, filename), "wb") as f:
            f.write(blob)
        return key, filename, len(blob), None
    except Exception as exc:
        return key, None, 0, str(exc)

# Bound concurrent downloads so adding clubs doesn't slow down every Pages release.
with ThreadPoolExecutor(max_workers=3) as pool:
    for key, filename, size, error in pool.map(download_one, CLUBS.items()):
        if filename:
            manifest[key] = "./assets/clubs/" + filename
            print(f"{key}: {filename} ({size} bytes)")
        else:
            print(f"WARNING: no logo for {CLUBS[key]} ({key}): {error}")

if len(manifest) != len(CLUBS):
    print(f"WARNING: Downloaded {len(manifest)} of {len(CLUBS)} club logos; continuing with text fallback.")

with open(os.path.join(OUT, "manifest.js"), "w", encoding="utf-8") as f:
    f.write("window.LT_CLUB_LOGOS=" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n")
print("Generated", len(manifest), "club logos")
