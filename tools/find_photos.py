#!/usr/bin/env python3
"""Find, download and Glimmer-score photo candidates for the China trip site.

Reuses the nature-almanac photo stack (household-dashboards/nature-almanac/tools):
  photo_sources.py  -- polite HTTP, Wikimedia Commons search with licence ranking
  photo_glimmer.py  -- Muse Glimmer 30B (local VLM) client

Sources, per slot:
  1. The lead image of the named Wikipedia article(s)   (editors already chose it)
  2. Commons "Quality images" matching the query        (community-reviewed)
  3. Commons full-text search                           (breadth)
  4. Openverse, Flickr only                             (CC travel photography)

Glimmer scores every candidate no-think (cheap), then re-scores the top few per
slot with thinking (the almanac's measured "no-think ranks, thinking verifies").
Output: <out>/<slot>/NNN.jpg + NNN.json, <out>/scores.json, and contact sheets
<out>/sheets/<group>.jpg cropped to each slot's on-page shape for a human pass.

    node mode.mjs glimmer-x16            # from llm-modes, first
    python tools/find_photos.py --out "../photo-candidates" --workers 16
"""

import argparse
import concurrent.futures as cf
import json
import os
import pathlib
import re
import sys
import threading
import urllib.parse

ALMANAC = pathlib.Path(r"C:\Users\jacks\Claude Code Workspace\Fun With Tokens"
                       r"\household-dashboards\nature-almanac\tools")
sys.path.insert(0, str(ALMANAC))
import photo_sources as S      # noqa: E402
import photo_glimmer as G      # noqa: E402
import PIL.Image               # noqa: E402
import PIL.ImageDraw           # noqa: E402
import PIL.ImageFont           # noqa: E402

S.UA = ("wagner-china-trip/1.0 (private family trip website; "
        "https://github.com/jackson-wxyz; contact via GitHub)")

# shape = on-page aspect ratio (w/h). banner 1000x290 -> 3.4; hero ~2.3; ext card
# 500x215 -> 2.3; gallery tiles 4:3.
SLOTS = {
    # ---- banners ----
    "hero":      dict(group="banners", shape=2.3, subject="the Great Wall of China winding over green mountains (Mutianyu or similar restored section)",
                      wiki=["Mutianyu", "Great Wall of China"], q=["Mutianyu Great Wall", "Great Wall Mutianyu", "Great Wall of China mountains"]),
    "beijing":   dict(group="banners", shape=3.4, subject="Beijing's Forbidden City (golden roofs of the imperial palace)",
                      wiki=["Forbidden City"], q=["Forbidden City Jingshan view", "Forbidden City roofs", "Forbidden City Beijing"]),
    "xian":      dict(group="banners", shape=3.4, subject="the Terracotta Army warriors in Pit 1 near Xi'an",
                      wiki=["Terracotta Army"], q=["Terracotta Army pit 1", "Terracotta warriors Xian", "Terracotta Army"]),
    "nanjing":   dict(group="banners", shape=3.4, subject="the Sun Yat-sen Mausoleum on Purple Mountain, Nanjing",
                      wiki=["Sun Yat-sen Mausoleum"], q=["Sun Yat-sen Mausoleum", "Sun Yat-sen Mausoleum Nanjing", "Zhongshan Mausoleum"]),
    "suzhou":    dict(group="banners", shape=3.4, subject="a Suzhou classical garden or canal (Humble Administrator's Garden, Pingjiang Road)",
                      wiki=["Humble Administrator's Garden", "Pingjiang Road"], q=["Humble Administrator's Garden", "Suzhou canal", "Pingjiang Road Suzhou"]),
    "shanghai":  dict(group="banners", shape=3.4, subject="the Shanghai skyline (Pudong / Lujiazui towers seen from the Bund)",
                      wiki=["The Bund", "Lujiazui"], q=["Shanghai skyline Bund night", "Lujiazui skyline", "Pudong skyline Shanghai"]),
    "hangzhou":  dict(group="banners", shape=2.3, subject="West Lake in Hangzhou (lake, pagoda, causeway or willows)",
                      wiki=["West Lake"], q=["West Lake Hangzhou", "Leifeng Pagoda West Lake", "Hangzhou West Lake"]),
    "chengdu":   dict(group="banners", shape=2.3, subject="a giant panda in Chengdu (ideally eating bamboo)",
                      wiki=["Chengdu Research Base of Giant Panda Breeding"], q=["Giant panda Chengdu", "Chengdu Research Base of Giant Panda Breeding", "giant panda bamboo"]),
    # ---- galleries: Beijing ----
    "bj-heaven": dict(group="beijing", shape=4/3, subject="the Hall of Prayer for Good Harvests at the Temple of Heaven, Beijing",
                      wiki=["Temple of Heaven"], q=["Hall of Prayer for Good Harvests", "Temple of Heaven Beijing"]),
    "bj-summer": dict(group="beijing", shape=4/3, subject="the Summer Palace in Beijing (Kunming Lake, Tower of Buddhist Incense, Seventeen-Arch Bridge)",
                      wiki=["Summer Palace"], q=["Summer Palace Kunming Lake", "Summer Palace Beijing", "Seventeen-Arch Bridge"]),
    "bj-hutong": dict(group="beijing", shape=4/3, subject="a traditional Beijing hutong lane",
                      wiki=["Hutong"], q=["Beijing hutong", "hutong Beijing alley", "Nanluoguxiang"]),
    "bj-forbidden": dict(group="beijing", shape=4/3, subject="the Hall of Supreme Harmony / Forbidden City courtyard",
                      wiki=["Hall of Supreme Harmony"], q=["Hall of Supreme Harmony", "Forbidden City courtyard"]),
    # ---- Xi'an ----
    "xa-wall":   dict(group="xian", shape=4/3, subject="the top of the Xi'an City Wall (ideally with people cycling, gate towers)",
                      wiki=["Fortifications of Xi'an"], q=["Xi'an city wall", "Xian city wall bicycle", "Xi'an city wall gate"]),
    "xa-pagoda": dict(group="xian", shape=4/3, subject="the Big Wild Goose Pagoda in Xi'an",
                      wiki=["Giant Wild Goose Pagoda"], q=["Big Wild Goose Pagoda", "Giant Wild Goose Pagoda"]),
    "xa-huashan": dict(group="xian", shape=4/3, subject="the granite peaks and cliff paths of Mount Hua (Huashan)",
                      wiki=["Mount Hua"], q=["Mount Hua", "Huashan peaks", "Huashan"]),
    "xa-muslim": dict(group="xian", shape=4/3, subject="the Muslim Quarter street food market in Xi'an (or the Bell/Drum Tower lit at night)",
                      wiki=["Muslim Quarter (Xi'an)", "Bell Tower of Xi'an"], q=["Xi'an Muslim Quarter", "Xian Muslim street", "Bell Tower Xi'an night"]),
    # ---- Nanjing ----
    "nj-palace": dict(group="nanjing", shape=4/3, subject="the Presidential Palace in Nanjing",
                      wiki=["Presidential Palace (Nanjing)"], q=["Presidential Palace Nanjing", "Nanjing Presidential Palace"]),
    "nj-ming":   dict(group="nanjing", shape=4/3, subject="the stone animal statues on the Sacred Way of the Ming Xiaoling Mausoleum, Nanjing",
                      wiki=["Ming Xiaoling"], q=["Ming Xiaoling Sacred Way", "Ming Xiaoling elephants", "Ming Xiaoling"]),
    "nj-qinhuai": dict(group="nanjing", shape=4/3, subject="the Qinhuai River / Fuzimiao / Laomendong old lanes of Nanjing, ideally lantern-lit at night",
                      wiki=["Qinhuai River", "Laomendong"], q=["Qinhuai River night", "Fuzimiao Nanjing", "Laomendong Nanjing"]),
    # ---- Suzhou ----
    "sz-nets":   dict(group="suzhou", shape=4/3, subject="the Master of the Nets Garden in Suzhou",
                      wiki=["Master of the Nets Garden"], q=["Master of the Nets Garden", "Wangshi Garden"]),
    "sz-museum": dict(group="suzhou", shape=4/3, subject="I. M. Pei's Suzhou Museum building (white walls, grey geometric roofs, water garden)",
                      wiki=["Suzhou Museum"], q=["Suzhou Museum", "Suzhou Museum I.M. Pei"]),
    "sz-canal":  dict(group="suzhou", shape=4/3, subject="a Suzhou canal street with old houses and stone bridges (Pingjiang Road, Shantang Street)",
                      wiki=["Pingjiang Road", "Shantang Street"], q=["Pingjiang Road", "Shantang Street Suzhou", "Suzhou canal houses"]),
    # ---- Shanghai ----
    "sh-yu":     dict(group="shanghai", shape=4/3, subject="Yu Garden in Shanghai (or its zigzag bridge and teahouse)",
                      wiki=["Yu Garden"], q=["Yu Garden Shanghai", "Yuyuan Garden", "Huxinting teahouse"]),
    "sh-bund":   dict(group="shanghai", shape=4/3, subject="the historic Bund waterfront buildings in Shanghai",
                      wiki=["The Bund"], q=["The Bund Shanghai buildings", "Bund Shanghai", "Shanghai Bund"]),
    "sh-tower":  dict(group="shanghai", shape=4/3, subject="Shanghai Tower (the twisting supertall skyscraper)",
                      wiki=["Shanghai Tower"], q=["Shanghai Tower", "Shanghai Tower Lujiazui"]),
    "sh-french": dict(group="shanghai", shape=4/3, subject="a plane-tree-lined street in Shanghai's former French Concession",
                      wiki=["Shanghai French Concession"], q=["French Concession Shanghai", "Wukang Road", "Wukang Mansion"]),
    # ---- extensions ----
    "hz-lingyin": dict(group="extensions", shape=4/3, subject="Lingyin Temple and the Feilai Feng cliff-carved Buddhas, Hangzhou",
                      wiki=["Lingyin Temple", "Feilai Feng"], q=["Feilai Feng", "Lingyin Temple", "Feilai Feng Buddha"]),
    "hz-tea":    dict(group="extensions", shape=4/3, subject="Longjing (Dragon Well) tea plantations on hillsides near Hangzhou",
                      wiki=["Longjing tea"], q=["Longjing tea plantation", "Dragon Well tea fields", "Meijiawu tea"]),
    "cd-sanxingdui": dict(group="extensions", shape=4/3, subject="a Sanxingdui bronze mask or head",
                      wiki=["Sanxingdui"], q=["Sanxingdui bronze mask", "Sanxingdui bronze head", "Sanxingdui"]),
    "cd-dujiangyan": dict(group="extensions", shape=4/3, subject="the Dujiangyan irrigation system on the Min River",
                      wiki=["Dujiangyan"], q=["Dujiangyan", "Dujiangyan irrigation", "Anlan Bridge Dujiangyan"]),
}

WIKI = "https://en.wikipedia.org/w/api.php"
OPENVERSE = "https://api.openverse.org/v1/images/"


def wiki_lead_files(titles):
    """Lead-image file names for English Wikipedia articles."""
    params = {"action": "query", "format": "json", "prop": "pageimages",
              "piprop": "name", "titles": "|".join(titles), "redirects": 1}
    try:
        res = S._get("%s?%s" % (WIKI, urllib.parse.urlencode(params)))
    except Exception:                                              # noqa: BLE001
        return []
    return [p["pageimage"] for p in res.get("query", {}).get("pages", {}).values()
            if p.get("pageimage")]


def commons_files(names, min_side):
    """Commons metadata for named files, in the same shape as commons_search."""
    if not names:
        return []
    out = []
    for n in names:
        q = 'intitle:"%s"' % os.path.splitext(n.replace("_", " "))[0][:80]
        for c in S._commons_once(q, want=3, min_side=min_side):
            if c["title"].replace(" ", "_").endswith(n.replace(" ", "_")):
                c["via"] = "wikipedia-lead"
                out.append(c)
                break
    return out


def openverse_search(query, want=10, min_side=900):
    """Openverse (WordPress/Creative Commons) restricted to Flickr. No key needed
    for anonymous use (page_size <= 20, modest rate limits). Excludes ND."""
    params = {"q": query, "source": "flickr", "page_size": 20,
              "license": "by,by-sa,cc0,pdm,by-nc,by-nc-sa", "mature": "false"}
    try:
        res = S._get("%s?%s" % (OPENVERSE, urllib.parse.urlencode(params)))
    except Exception:                                              # noqa: BLE001
        return []
    out = []
    for r in res.get("results", []):
        w, h = r.get("width") or 0, r.get("height") or 0
        if min(w, h) < min_side:
            continue
        lic = (r.get("license") or "").lower()
        rank = {"cc0": 0, "pdm": 0, "by": 1, "by-nc": 2, "by-sa": 3, "by-nc-sa": 4}.get(lic, 6)
        out.append({
            "source": "openverse/flickr", "url": r.get("url"), "thumb": r.get("url"),
            "width": w, "height": h, "title": r.get("title") or "",
            "licence": "CC %s %s" % (lic.upper(), r.get("license_version") or ""),
            "licence_url": r.get("license_url"), "author": r.get("creator") or "unknown",
            "page": r.get("foreign_landing_url"), "rank": rank, "via": "openverse",
        })
        if len(out) >= want:
            break
    return out


def gather(slot, spec, per_query=6):
    min_side = 1000 if spec["shape"] > 2 else 700
    cands, seen = [], set()

    def add(cs, via):
        for c in cs:
            key = (c.get("url") or "").split("?")[0]
            if not key or key in seen:
                continue
            # banners must be landscape enough to survive a wide crop
            if spec["shape"] > 2 and c["width"] < 1.25 * c["height"]:
                continue
            if spec["shape"] <= 2 and c["width"] < 0.95 * c["height"]:
                continue
            seen.add(key)
            c.setdefault("via", via)
            cands.append(c)

    add(commons_files(wiki_lead_files(spec["wiki"]), min_side), "wikipedia-lead")
    for q in spec["q"][:2]:
        add(S._commons_once('%s incategory:"Quality_images"' % q, per_query, min_side), "commons-QI")
    for q in spec["q"]:
        add(S.commons_search(q, want=per_query, min_side=min_side), "commons")
    for q in spec["q"][:2]:
        add(openverse_search(q, want=per_query, min_side=min_side), "openverse")
    return cands[:22]


def fetch(slot, cands, out):
    d = out / slot
    d.mkdir(parents=True, exist_ok=True)
    got = []
    for i, c in enumerate(cands):
        p = d / ("%03d.jpg" % i)
        if not (p.exists() and p.stat().st_size > 5000):
            try:
                raw = S._get(c.get("thumb") or c["url"], binary=True, timeout=90)
            except Exception as e:                                 # noqa: BLE001
                c["error"] = str(e)[:120]
                continue
            if len(raw) < 5000:
                continue
            try:
                import io
                im = PIL.Image.open(io.BytesIO(raw)).convert("RGB")
            except Exception:                                      # noqa: BLE001
                continue
            if max(im.size) > 1600:
                im.thumbnail((1600, 1600), PIL.Image.LANCZOS)
            im.save(p, "JPEG", quality=88)
        c["file"] = str(p)
        c["idx"] = i
        (d / ("%03d.json" % i)).write_text(json.dumps(c, indent=1), encoding="utf8")
        got.append(c)
    return got


PROMPT = """You are the photo editor for a family travel website pitching a trip to China.
This photo is a candidate for: {subject}.
It will be shown {usage}.

Judge it like a travel-magazine photo editor. Reply with JSON only:
{{"subject_seen": "<one sentence: what the photo actually shows>",
  "is_subject": <true if it clearly shows {short}, false if it shows something else or only a related thing>,
  "score": <0-10 overall: 10 = stunning, unmistakably the right subject, beautiful light and colour, sharp, inviting. Penalise: wrong or ambiguous subject, dull grey light, blur, crowds hiding the subject, watermarks/text/borders/collages, black-and-white or old historical photos, close-up faces of strangers, mostly empty sky or ground, construction scaffolding>,
  "crop_ok": <true if it would still read well cropped to {crop}>,
  "focus_y": <0.0-1.0, vertical centre of the main subject, 0 = top edge, 1 = bottom edge>,
  "problems": "<short, or empty>"}}"""


def usage_text(shape):
    if shape >= 3:
        return ("as a wide banner strip across the top of a city section (about 3.4:1)",
                "a wide 3.4:1 strip")
    if shape >= 2:
        return ("as a wide header image (about 2.3:1)", "a 2.3:1 strip")
    return ("as a small 4:3 gallery tile next to the itinerary", "a 4:3 tile")


def score(c, spec, think=False):
    usage, crop = usage_text(spec["shape"])
    short = spec["subject"].split("(")[0].strip()
    im = PIL.Image.open(c["file"])
    uri = G.encode_image(im, max_side=768)
    r = G.ask_json(PROMPT.format(subject=spec["subject"], usage=usage, crop=crop, short=short),
                   uri, require=("score",), think=think, max_tokens=300)
    return r or {}


def crop_to(im, shape, focus_y=0.5):
    w, h = im.size
    if w / h > shape:                        # too wide: trim sides
        nw = int(h * shape)
        x0 = (w - nw) // 2
        return im.crop((x0, 0, x0 + nw, h))
    nh = int(w / shape)                      # too tall: trim top/bottom around focus
    cy = int(focus_y * h)
    y0 = min(max(cy - nh // 2, 0), h - nh)
    return im.crop((0, y0, w, y0 + nh))


def contact_sheets(out, results):
    sheets = out / "sheets"
    sheets.mkdir(exist_ok=True)
    try:
        font = PIL.ImageFont.truetype("arial.ttf", 15)
    except Exception:                                              # noqa: BLE001
        font = PIL.ImageFont.load_default()
    groups = {}
    for slot, spec in SLOTS.items():
        groups.setdefault(spec["group"], []).append(slot)
    for g, slots in groups.items():
        rows = []
        for slot in slots:
            spec = SLOTS[slot]
            cs = [c for c in results.get(slot, []) if c.get("score") is not None]
            cs.sort(key=lambda c: (-(c.get("final") or 0), -(c.get("score") or 0), c.get("rank", 6)))
            top = cs[:6]
            tw = 330 if spec["shape"] > 2 else 230
            th = int(tw / spec["shape"])
            row = PIL.Image.new("RGB", (6 * (tw + 6) + 130, th + 26), "white")
            dr = PIL.ImageDraw.Draw(row)
            dr.text((4, 4), slot, fill="black", font=font)
            for k, c in enumerate(top):
                im = PIL.Image.open(c["file"]).convert("RGB")
                im = crop_to(im, spec["shape"], c.get("focus_y", 0.5) or 0.5)
                im = im.resize((tw, th), PIL.Image.LANCZOS)
                x = 130 + k * (tw + 6)
                row.paste(im, (x, 0))
                lab = "#%d  %s%s  %s" % (c["idx"], c.get("final", c["score"]),
                                         "" if c.get("is_subject", True) else "?",
                                         (c.get("licence") or "")[:14])
                dr.text((x + 2, th + 4), lab, fill="black", font=font)
            rows.append(row)
        if not rows:
            continue
        W = max(r.size[0] for r in rows)
        H = sum(r.size[1] + 8 for r in rows)
        sheet = PIL.Image.new("RGB", (W, H), "#ddd")
        y = 0
        for r in rows:
            sheet.paste(r, (0, y))
            y += r.size[1] + 8
        sheet.save(sheets / ("%s.jpg" % g), "JPEG", quality=85)
        print("sheet", sheets / ("%s.jpg" % g))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(pathlib.Path(__file__).resolve().parents[2] / "photo-candidates"))
    ap.add_argument("--workers", type=int, default=16)
    ap.add_argument("--slots", default="")
    ap.add_argument("--verify", type=int, default=3)
    ap.add_argument("--sheets-only", action="store_true")
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    slots = [s for s in (a.slots.split(",") if a.slots else SLOTS) if s]
    scores_path = out / "scores.json"
    results = json.loads(scores_path.read_text("utf8")) if scores_path.exists() else {}

    if not a.sheets_only:
        print(G.probe())
        G.set_slots(a.workers)
        G.set_gate(a.workers, max_wait=3.0)
        lock = threading.Lock()

        # 1. gather + download (network-bound, polite per host, so a small pool)
        def grab(slot):
            cands = fetch(slot, gather(slot, SLOTS[slot]), out)
            print("%-14s %2d candidates" % (slot, len(cands)), flush=True)
            return slot, cands
        with cf.ThreadPoolExecutor(4) as ex:
            fetched = dict(ex.map(grab, slots))

        # 2. no-think score everything
        jobs = [(s, c) for s in slots for c in fetched[s]]

        def run(job, think=False):
            s, c = job
            r = score(c, SLOTS[s], think=think)
            with lock:
                if think:
                    c["score_nothink"] = c.get("score")
                    c["subject_seen_think"] = r.get("subject_seen")
                for k in ("subject_seen", "is_subject", "score", "crop_ok", "focus_y", "problems"):
                    if k in r and not (think and k == "subject_seen"):
                        c[k] = r[k]
                c["final"] = c.get("score", 0) if c.get("is_subject", True) else 0
            return job
        with cf.ThreadPoolExecutor(a.workers) as ex:
            list(ex.map(run, jobs))
        print("no-think pass done", G.stats(), flush=True)

        # 3. thinking re-score of each slot's top few
        vjobs = []
        for s in slots:
            top = sorted([c for c in fetched[s] if "score" in c], key=lambda c: -c["final"])[:a.verify]
            vjobs += [(s, c) for c in top]
        with cf.ThreadPoolExecutor(a.workers) as ex:
            list(ex.map(lambda j: run(j, think=True), vjobs))
        print("verify pass done", G.stats(), flush=True)

        results.update(fetched)
        scores_path.write_text(json.dumps(results, indent=1), encoding="utf8")

    contact_sheets(out, results)
    for s in slots:
        top = sorted([c for c in results.get(s, []) if "score" in c], key=lambda c: -c.get("final", 0))[:3]
        print("%-14s " % s + " | ".join("#%d %s %s" % (c["idx"], c.get("final"), (c.get("subject_seen") or "")[:50]) for c in top))


if __name__ == "__main__":
    main()
