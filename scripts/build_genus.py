#!/usr/bin/env python3
"""Build one category page per plant genus that has 2 or more plants in stock: genus/<name>.html.
Each page lists the plants in stock (real links to each plant page), the family's care line and short description from the site data.
Pages for genera that no longer have 2+ plants in stock are deleted. Run after build_plants.py:  python3 scripts/build_genus.py [https://your-domain]
"""
import csv, html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = (sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "https://spinanspiritus.com").rstrip("/")
esc = lambda s: html.escape(str(s if s is not None else ""), quote=True)
slug = lambda s: re.sub(r"[^a-z0-9-]+", "-", str(s).lower()).strip("-")
site = json.loads((ROOT / "data/site.json").read_text(encoding="utf-8"))
care = ((site.get("care") or {}).get("genus")) or {}
descs = {}
if (ROOT / "data/genus_descriptions.csv").exists():
    for r in csv.DictReader(open(ROOT / "data/genus_descriptions.csv", newline="", encoding="utf-8")): descs[r["genus"].strip().lower()] = r["description"].strip()
rows = [r for r in csv.DictReader(open(ROOT / "data/inventory.csv", newline="", encoding="utf-8"))]
live = [r for r in rows if r["genus"].strip() and "sold" not in (r.get("status") or "").lower() and str(r.get("stock", "")).strip() != "0" and float(r.get("price") or 0) > 0]
by = {}
for r in live: by.setdefault(r["genus"].strip(), []).append(r)
hubs = {g: ps for g, ps in by.items() if len(ps) >= 2}
OUT = ROOT / "genus"; OUT.mkdir(exist_ok=True)
for old in OUT.glob("*.html"):
    if old.stem not in {slug(g) for g in hubs}: old.unlink()


def stamps():
    s = (ROOT / "index.html").read_text(encoding="utf-8")
    return {n: (re.search(re.escape(n) + r"\?v=([0-9a-f]+)", s) or [None, ""])[1] for n in ("app.js", "styles.css", "early.js")}


def thumb(path):
    m = re.fullmatch(r"(?:\./)?assets/photos/([^/]+)\.(?:jpe?g|png|webp)", path or "", re.I)
    return f"assets/photos/thumb/{m.group(1)}.webp" if m and (ROOT / f"assets/photos/thumb/{m.group(1)}.webp").exists() else (path or "")


shell = (ROOT / "thanks.html").read_text(encoding="utf-8")
st = stamps()
for g, ps in sorted(hubs.items()):
    ps = sorted(ps, key=lambda r: r["name"].lower())
    url = f"{SITE}/genus/{slug(g)}.html"
    title = f"{g} for Sale in Phoenix, AZ: {len(ps)} in Stock | Spina & Spiritus"
    names = ", ".join(p["name"] for p in ps[:4])
    intro = descs.get(g.lower(), "")
    desc = f"{len(ps)} {g} plants in stock from Spina & Spiritus (AzCactusDoctor), grown in Arizona: {names}{' and more' if len(ps) > 4 else ''}. Pick up in Phoenix or have them shipped bare-root."
    cards = ""
    for p in ps:
        img = next((u for u in (p.get("image") or "").split("|") if u.startswith("assets/") and ".." not in u), "")
        pic = f'<img src="{esc(thumb(img))}" alt="{esc(p["name"])} ({esc(g)}), cactus or succulent from Spina &amp; Spiritus, Phoenix AZ" loading="lazy" decoding="async" width="360" height="360">' if img else '<div class="ph"></div>'
        price = float(p["sale_price"]) if (p.get("sale_price") and "sale" in (p.get("status") or "").lower()) else float(p["price"])
        cards += f'<article class="card"><a class="card-hit" href="plants/{slug(p["sku"])}.html"><span class="thumb">{pic}</span><span class="body"><span class="name">{esc(p["name"])}</span><span class="price">${price:g}</span></span></a></article>'
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "name": f"{g} for sale", "url": url, "description": desc, "isPartOf": {"@id": f"{SITE}/#website"}},
        {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": "Shop", "item": SITE + "/shop.html"}, {"@type": "ListItem", "position": 3, "name": g, "item": url}]},
        {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/plants/{slug(p['sku'])}.html", "name": p["name"]} for i, p in enumerate(ps)]}]}
    carep = f'<p class="genus-care"><b>Care:</b> {esc(care[g])}</p>' if care.get(g) else ""
    main = (f'<main class="faqpage genus" id="faqPage"><div class="wrap"><p class="crumbs"><a href="index.html">Home</a> &rsaquo; <a href="shop.html">Shop</a> &rsaquo; {esc(g)}</p>'
            f'<h1>{esc(g)} for sale in Phoenix, AZ</h1>' + (f'<p class="sub genus-intro">{esc(intro)}</p>' if intro else "") + carep +
            f'<p class="genus-count">{len(ps)} in stock</p><div class="product-grid">{cards}</div>'
            f'<p class="genus-more"><a class="btn ghost" href="shop.html">&larr; See the whole shop</a></p></div></main>')
    s = shell
    for n, v in st.items():
        if v: s = re.sub(re.escape(n) + r"\?v=[0-9a-f]+", f"{n}?v={v}", s)
    s = s.replace("<head>\n", '<head>\n<base href="/">\n', 1)
    s = re.sub(r"<title>.*?</title>", lambda _: f"<title>{esc(title)}</title>", s, count=1, flags=re.S)
    s = re.sub(r'<meta name="description" content="[^"]*">', lambda _: f'<meta name="description" content="{esc(desc)}">', s, count=1)
    s = s.replace('<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="index, follow, max-image-preview:large">')
    s = re.sub(r'<link rel="canonical" href="[^"]*">', lambda _: f'<link rel="canonical" href="{url}">', s, count=1)
    for key in ("og:title", "twitter:title"): s = re.sub(rf'(<meta (?:property|name)="{key}" content=")[^"]*', lambda m: m.group(1) + esc(title), s, count=1)
    for key in ("og:description", "twitter:description"): s = re.sub(rf'(<meta (?:property|name)="{key}" content=")[^"]*', lambda m: m.group(1) + esc(desc), s, count=1)
    s = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + url, s, count=1)
    s = s.replace("<!-- FAQLD --><!-- /FAQLD -->", f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>')
    s = s.replace('<body data-page="thanks">', '<body data-page="genus">')
    s = s.replace('href="#faqPage"', 'href="genus/%s.html#faqPage"' % slug(g))
    i = s.index('<main class="faqpage"'); j = s.index("</main>", i) + len("</main>")
    s = s[:i] + main + s[j:]
    (OUT / f"{slug(g)}.html").write_text(s, encoding="utf-8")
# a crawlable "Browse by genus" row on the shop page, right above the A-Z list
links = "".join(f'<a href="genus/{slug(g)}.html">{esc(g)} <small>{len(ps)}</small></a>' for g, ps in sorted(hubs.items()))
blk = '<!-- GENUS:START (built by scripts/build_genus.py) -->\n<nav class="genus-links wrap" aria-label="Browse by genus"><h2>Browse by genus</h2><p>' + links + '</p></nav>\n<!-- GENUS:END -->\n'
sh = (ROOT / "shop.html").read_text(encoding="utf-8")
sh = re.sub(r"<!-- GENUS:START.*?<!-- GENUS:END -->\s*", "", sh, flags=re.S)
if "<!-- PLANTINDEX:START -->" in sh and hubs:
    sh = sh.replace("<!-- PLANTINDEX:START -->", blk + "<!-- PLANTINDEX:START -->", 1)
(ROOT / "shop.html").write_text(sh, encoding="utf-8")
print(f"genus pages: {len(hubs)} built ({', '.join(sorted(hubs)[:6])}...)")
