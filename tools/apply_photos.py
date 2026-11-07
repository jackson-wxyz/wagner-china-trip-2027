#!/usr/bin/env python3
"""Crop the chosen photo candidates into images/ and write the credits.

    python tools/apply_photos.py picks.json

picks.json maps slot -> {"idx": N, "y": 0.0-1.0 optional vertical focus, "x": optional horizontal focus}
(candidates from tools/find_photos.py, in ../photo-candidates/<slot>/NNN.jpg + NNN.json).

Writes images/<slot>.jpg at the slot's on-page shape, images/credits.json, and fills
<span class="photo-credit" data-credit="slot"> overlays and the <!-- credits:start/end -->
list in index.html and budget.html. Re-runnable.
"""
import html
import json
import pathlib
import re
import sys

import PIL.Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
CANDS = ROOT.parent / "photo-candidates"
sys.path.insert(0, str(ROOT / "tools"))
from find_photos import SLOTS, S  # noqa: E402
import io  # noqa: E402


def big_version(slot, idx, meta):
    """Banners get a larger rendition than the 1600px judging copy."""
    dest = CANDS / slot / ("%03d_big.jpg" % idx)
    if dest.exists():
        return PIL.Image.open(dest).convert("RGB")
    url = meta.get("url")
    th = meta.get("thumb") or ""
    if meta.get("source") == "commons" and "/1280px-" in th and meta.get("width", 0) > 1920:
        url = th.replace("/1280px-", "/1920px-")
    try:
        im = PIL.Image.open(io.BytesIO(S._get(url, binary=True, timeout=120))).convert("RGB")
    except Exception as e:  # noqa: BLE001
        print("  (big fetch failed for %s: %s)" % (slot, e))
        return None
    if max(im.size) > 2400:
        im.thumbnail((2400, 2400), PIL.Image.LANCZOS)
    im.save(dest, "JPEG", quality=92)
    return im

WIDTH = {"banner": 1800, "wide": 1400, "tile": 800}
LABEL = {
    "hero": "Great Wall at Mutianyu", "beijing": "Forbidden City", "xian": "Terracotta Army",
    "nanjing": "Sun Yat-sen Mausoleum", "suzhou": "Humble Administrator's Garden", "shanghai": "Shanghai skyline",
    "hangzhou": "Leifeng Pagoda, West Lake", "chengdu": "Giant panda", "bj-heaven": "Temple of Heaven",
    "bj-summer": "Summer Palace", "bj-hutong": "Beijing hutong", "bj-forbidden": "Forbidden City",
    "xa-wall": "Xi'an city wall", "xa-pagoda": "Big Wild Goose Pagoda", "xa-huashan": "Mount Hua",
    "xa-muslim": "Xi'an Bell Tower by night", "nj-palace": "Presidential Palace", "nj-ming": "Ming Xiaoling",
    "nj-qinhuai": "Qinhuai River", "sz-nets": "Master of the Nets Garden", "sz-museum": "Suzhou Museum",
    "sz-canal": "Suzhou canal", "sh-yu": "Yu Garden", "sh-bund": "The Bund", "sh-tower": "Shanghai Tower",
    "sh-french": "French Concession", "hz-lingyin": "Lingyin Temple", "hz-tea": "Longjing tea fields",
    "cd-sanxingdui": "Sanxingdui bronze", "cd-dujiangyan": "Dujiangyan",
    "cd-leshan": "Leshan Giant Buddha", "cd-jinli": "Jinli Ancient Street", "cd-teahouse": "People's Park teahouse",
    "cd-opera": "Sichuan opera", "cd-qingcheng": "Mount Qingcheng", "cd-wenshu": "Wenshu Monastery",
    "cd-kuanzhai": "Kuanzhai Xiangzi", "cd-hotpot": "Sichuan hotpot", "cd-panda2": "Giant panda",
    "cd-emei": "Mount Emei", "cd-jinsha": "Jinsha gold", "cd-train": "High-speed train",
    "bj-panjiayuan": "Panjiayuan Market", "bj-jinshanling": "Jinshanling Great Wall",
}


def crop(im, shape, fx=0.5, fy=0.5):
    w, h = im.size
    if w / h > shape:
        nw = int(h * shape)
        x0 = min(max(int(fx * w) - nw // 2, 0), w - nw)
        return im.crop((x0, 0, x0 + nw, h))
    nh = int(w / shape)
    y0 = min(max(int(fy * h) - nh // 2, 0), h - nh)
    return im.crop((0, y0, w, y0 + nh))


def clean_author(a):
    a = re.sub(r"\s+", " ", html.unescape(a or "")).strip()
    a = re.sub(r"^(User:|by )", "", a, flags=re.I)
    return (a[:48] + "…") if len(a) > 49 else (a or "unknown")


def main():
    picks = json.loads(pathlib.Path(sys.argv[1]).read_text("utf8"))
    out = ROOT / "images"
    out.mkdir(exist_ok=True)
    credits = {}
    for slot, p in picks.items():
        spec = SLOTS[slot]
        meta = json.loads((CANDS / slot / ("%03d.json" % p["idx"])).read_text("utf8"))
        im = PIL.Image.open(CANDS / slot / ("%03d.jpg" % p["idx"])).convert("RGB")
        if spec["shape"] >= 2:
            im = big_version(slot, p["idx"], meta) or im
        im = crop(im, spec["shape"], p.get("x", 0.5), p.get("y", meta.get("focus_y") or 0.5))
        kind = "banner" if spec["shape"] >= 3 else "wide" if spec["shape"] >= 2 else "tile"
        tw = min(1920 if slot in ("hero", "cd-leshan") else WIDTH[kind], im.size[0])
        im = im.resize((tw, int(tw / spec["shape"])), PIL.Image.LANCZOS)
        im.save(out / ("%s.jpg" % slot), "JPEG", quality=84, optimize=True, progressive=True)
        credits[slot] = {
            "what": LABEL.get(slot, slot), "author": clean_author(meta.get("author")),
            "licence": (meta.get("licence") or "").strip(), "page": meta.get("page"),
            "source": meta.get("source"), "title": meta.get("title"),
        }
        print("%-14s %4dx%-4d %s / %s" % (slot, im.size[0], im.size[1], credits[slot]["author"], credits[slot]["licence"]))
    (out / "credits.json").write_text(json.dumps(credits, indent=1, ensure_ascii=False), encoding="utf8")

    def overlay(m):
        c = credits.get(m.group(1))
        if not c:
            return m.group(0)
        return ('<span class="photo-credit" data-credit="%s">Photo: <a href="%s" target="_blank" rel="noopener">%s</a> · %s</span>'
                % (m.group(1), html.escape(c["page"] or "#"), html.escape(c["author"]), html.escape(c["licence"])))

    items = "".join('<li>%s: <a href="%s" target="_blank" rel="noopener">%s</a> · %s</li>' % (
        html.escape(c["what"]), html.escape(c["page"] or "#"), html.escape(c["author"]), html.escape(c["licence"]))
        for c in credits.values())
    for page in ("index.html", "budget.html", "chengdu.html"):
        f = ROOT / page
        s = f.read_text("utf8")
        s = re.sub(r'<span class="photo-credit" data-credit="([\w-]+)">.*?</span>', overlay, s)
        s = re.sub(r"<!-- credits:start -->.*?<!-- credits:end -->",
                   lambda m: "<!-- credits:start -->" + items + "<!-- credits:end -->", s, flags=re.S)
        f.write_text(s, "utf8")


if __name__ == "__main__":
    main()
