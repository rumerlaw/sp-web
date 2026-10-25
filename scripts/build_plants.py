#!/usr/bin/env python3
"""Build one real, crawlable HTML page per plant: plants/<sku>.html.

Why: search engines index real pages with their own title, description, picture and structured data far better
than a page that is filled in by JavaScript. The page still becomes the normal interactive plant page in the browser
(app.js takes over), but the HTML below is what Google and AI search tools read first.

Runs after sync_inventory.py. A plant with 0 in stock (or one that is no longer in the sheet) gets no page, and its old
page is deleted. Run: python3 scripts/build_plants.py [https://your-domain]
"""
import csv, html, json, re, sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = (sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "https://spinanspiritus.com").rstrip("/")
OUTDIR = ROOT / "plants"
esc = lambda s: html.escape(str(s if s is not None else ""), quote=True)
slug = lambda sku: re.sub(r"[^a-z0-9-]+", "-", str(sku).lower()).strip("-")
normkey = lambda n: re.sub(r"[^a-z0-9]", "", str(n or "").lower())


def num(v):
    m = re.search(r"-?\d+(?:\.\d+)?", str(v or "").replace(",", ""))
    return float(m.group()) if m else 0.0


def variant(path, kind="web"):
    m = re.fullmatch(r"(?:\./)?assets/photos/([^/]+)\.(?:jpe?g|png|webp)", path or "", re.I)
    if m and (ROOT / f"assets/photos/{kind}/{m.group(1)}.webp").exists(): return f"assets/photos/{kind}/{m.group(1)}.webp"
    return path


def size_of(path):
    try:
        from PIL import Image
        with Image.open(ROOT / path) as im: return im.size
    except Exception:
        return None


def load_plants():
    site = {}
    f = ROOT / "data/site.json"
    if f.exists():
        try: site = json.loads(f.read_text(encoding="utf-8"))
        except Exception: site = {}
    ovs = site.get("plants") or {}
    out = []
    with open(ROOT / "data/inventory.csv", newline="", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            p = {"id": r.get("sku") or "", "name": r.get("name") or "", "genus": r.get("genus") or "", "category": r.get("category") or "",
                 "price": num(r.get("price")), "sale": num(r.get("sale_price")), "status": r.get("status") or "In Stock",
                 "stock": (int(float(r["stock"])) if str(r.get("stock") or "").strip() != "" else None),
                 "desc": (r.get("description") or "").strip(), "size": r.get("size") or "",
                 "images": [u for u in (r.get("image") or "").split("|") if re.match(r"^(assets/|\./assets/)", u)]}
            ov = ovs.get(normkey(p["name"])) or {}
            if str(ov.get("name") or "").strip(): p["name"] = ov["name"].strip()
            if str(ov.get("genus") or "").strip(): p["genus"] = ov["genus"].strip()
            for k, dst in (("price", "price"), ("salePrice", "sale")):
                if str(ov.get(k, "")).strip() != "" and num(ov.get(k)) >= 0: p[dst] = num(ov[k])
            if str(ov.get("stock", "")).strip() != "": p["stock"] = max(0, int(num(ov["stock"])))
            if str(ov.get("status") or "").strip(): p["status"] = ov["status"]
            if str(ov.get("description") or "").strip(): p["desc"] = ov["description"].strip()
            if isinstance(ov.get("images"), list) and ov["images"]: p["images"] = [u for u in ov["images"] if re.match(r"^(assets/|\./assets/)", str(u))]
            if p["id"] and p["name"]: out.append(p)
    return out


def is_out(p): return bool(re.search(r"sold", p["status"], re.I)) or p["stock"] == 0


def clip(text, n):
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= n: return text
    cut = text[: n - 1].rsplit(" ", 1)[0].rstrip(",;:— -")
    return cut + "…"


def build_page(shell, p, today):
    sl = slug(p["id"]); url = f"{SITE}/plants/{sl}.html"
    name, genus = p["name"], p["genus"]
    label = name if (not genus or normkey(genus) in normkey(name)) else f"{name} ({genus})"
    price = p["sale"] if (re.search(r"sale", p["status"], re.I) and 0 < p["sale"] < p["price"]) else p["price"]
    title = clip(f"{label} for Sale in Phoenix, AZ | Spina & Spiritus", 70)
    own = p["desc"] and not re.match(r"placeholder", p["desc"], re.I)
    kind = genus or p["category"] or "cactus"
    base_desc = p["desc"] if own else f"{name} — a {kind} plant grown in Arizona."
    desc = clip(f"{base_desc} Reserve online and pick up at our Phoenix, AZ farmers market events. No shipping.", 158)
    imgs = [variant(u, "web") for u in p["images"]]
    og_src = next((u for u in p["images"] if u.lower().endswith((".jpg", ".jpeg", ".png"))), None) or (imgs[0] if imgs else None)
    og_img = f"{SITE}/{og_src.lstrip('./')}" if og_src else f"{SITE}/assets/og-image.jpg"
    avail = "https://schema.org/PreOrder" if re.search(r"pre", p["status"], re.I) else "https://schema.org/InStock"

    product = {"@context": "https://schema.org", "@type": "Product", "name": name, "sku": p["id"], "url": url,
               "description": clip(base_desc, 300), "category": p["category"] or "Cactus & succulents",
               "brand": {"@type": "Brand", "name": "Spina & Spiritus"},
               "image": [f"{SITE}/{u.lstrip('./')}" for u in (imgs or [])] or [og_img]}
    if genus: product["additionalProperty"] = [{"@type": "PropertyValue", "name": "Genus", "value": genus}]
    if price > 0:
        product["offers"] = {"@type": "Offer", "url": url, "price": ("%g" % price), "priceCurrency": "USD", "availability": avail,
                             "itemCondition": "https://schema.org/NewCondition", "availableDeliveryMethod": "https://schema.org/OnSitePickup",
                             "priceValidUntil": (today + timedelta(days=45)).isoformat(),
                             "seller": {"@type": "Organization", "name": "Spina & Spiritus"}}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Shop", "item": SITE + "/shop.html"},
        {"@type": "ListItem", "position": 3, "name": name, "item": url}]}
    ld = lambda o: '<script type="application/ld+json"%s>%s</script>' % (' id="plantld"' if o is product else "", json.dumps(o, ensure_ascii=False).replace("</", "<\\/"))

    # visible, crawlable content (the browser version replaces it with the interactive page)
    sz = size_of(imgs[0]) if imgs else None
    img_html = (f'<img src="{esc(imgs[0])}" alt="{esc(name)} {esc(genus)} cactus succulent for sale in Phoenix, Arizona"'
                + (f' width="{sz[0]}" height="{sz[1]}"' if sz else "") + ' fetchpriority="high">') if imgs else ""
    specs = []
    if genus: specs.append(f"<div><dt>Genus</dt><dd>{esc(genus)}</dd></div>")
    if p["size"]: specs.append(f"<div><dt>Size</dt><dd>{esc(p['size'])}</dd></div>")
    specs.append("<div><dt>Availability</dt><dd>In stock" + (f" — {p['stock']} available" if p["stock"] is not None else "") + "</dd></div>")
    specs.append("<div><dt>Pickup</dt><dd>Pickup only at Arizona farmers market events (Phoenix, AZ). No shipping.</dd></div>")
    body = (f'<div class="wrap-wide"><nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> › <a href="shop.html">Shop</a> › <span>{esc(name)}</span></nav>'
            f'<div class="plant-grid"><div class="plant-media"><div class="plant-main">{img_html}</div></div>'
            f'<div class="plant-info"><h1 class="plant-title">{esc(name)}</h1>'
            + (f'<p class="plant-price">${price:g}</p>' if price > 0 else "")
            + f'<p class="plant-desc">{esc(base_desc)}</p><dl class="specs">{"".join(specs)}</dl>'
            f'<p><a class="btn" href="shop.html">Reserve at checkout — browse the shop</a></p></div></div></div>')

    s = shell
    s = s.replace("<head>\n", '<head>\n<base href="/">\n', 1)
    s = re.sub(r"<title>.*?</title>", f"<title>{esc(title)}</title>", s, count=1, flags=re.S)
    s = re.sub(r'<meta name="description"[^>]*>', f'<meta name="description" content="{esc(desc)}">', s, count=1)
    s = re.sub(r'<link rel="canonical"[^>]*>', f'<link rel="canonical" href="{esc(url)}">', s, count=1)
    s = re.sub(r'<meta property="og:type"[^>]*>', '<meta property="og:type" content="product">', s, count=1)
    s = re.sub(r'<meta property="og:title"[^>]*>', f'<meta property="og:title" content="{esc(title)}">', s, count=1)
    s = re.sub(r'<meta property="og:description"[^>]*>', f'<meta property="og:description" content="{esc(desc)}">', s, count=1)
    s = re.sub(r'<meta property="og:url"[^>]*>', f'<meta property="og:url" content="{esc(url)}">', s, count=1)
    s = re.sub(r'<meta property="og:image"[^>]*>', f'<meta property="og:image" content="{esc(og_img)}">\n<meta property="og:image:alt" content="{esc(name)} — cactus and succulent for sale at Spina &amp; Spiritus">', s, count=1)
    s = s.replace('<meta name="twitter:card" content="summary_large_image">',
                  f'<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="{esc(title)}">\n<meta name="twitter:description" content="{esc(desc)}">\n<meta name="twitter:image" content="{esc(og_img)}">', 1)
    s = s.replace("</head>", ld(product) + "\n" + ld(crumbs) + "\n</head>", 1)
    s = s.replace('href="#plantPage"', f'href="plants/{sl}.html#plantPage"')   # <base href="/"> would send a bare #anchor to the home page
    s = s.replace('<body data-page="plant">', f'<body data-page="plant" data-static="1" data-plant-id="{esc(p["id"])}">', 1)
    s = re.sub(r'<main class="plant" id="plantPage">.*?</main>', lambda m: f'<main class="plant" id="plantPage">{body}</main>', s, count=1, flags=re.S)
    return sl, s


def main():
    today = date.today()
    shell = (ROOT / "plant.html").read_text(encoding="utf-8")
    if 'id="plantPage"' not in shell: sys.exit("plant.html shell not found")
    plants = [p for p in load_plants() if not is_out(p)]
    if not plants: sys.exit("No plants in stock; leaving plants/ unchanged")
    OUTDIR.mkdir(exist_ok=True)
    keep, index = set(), []
    for p in plants:
        sl, page = build_page(shell, p, today)
        f = OUTDIR / f"{sl}.html"
        if not f.exists() or f.read_text(encoding="utf-8") != page: f.write_text(page, encoding="utf-8")
        keep.add(f.name)
        first = next((u for u in p["images"]), None)
        index.append({"slug": sl, "name": p["name"], "image": first})
    removed = 0
    for f in OUTDIR.glob("*.html"):
        if f.name not in keep: f.unlink(); removed += 1
    # a plain A-Z list of every plant page at the bottom of the shop page (helps visitors, search engines and AI tools find every plant)
    shop = ROOT / "shop.html"
    if shop.exists():
        items = "".join(f'<li><a href="plants/{esc(i["slug"])}.html">{esc(i["name"])}</a></li>' for i in sorted(index, key=lambda x: x["name"].lower()))
        block = ('<!-- PLANTINDEX:START -->\n<section class="section plant-index" aria-labelledby="plantIndexH"><div class="wrap">'
                 '<h2 id="plantIndexH">All plants in stock</h2><ul>' + items + '</ul></div></section>\n<!-- PLANTINDEX:END -->')
        t = shop.read_text(encoding="utf-8")
        if "<!-- PLANTINDEX:START -->" in t: t2 = re.sub(r"<!-- PLANTINDEX:START -->.*?<!-- PLANTINDEX:END -->", lambda m: block, t, count=1, flags=re.S)
        else: t2 = t.replace("<footer", block + "\n\n<footer", 1)
        if t2 != t: shop.write_text(t2, encoding="utf-8")
    (ROOT / "data/plants_index.json").write_text(json.dumps(index, indent=0, ensure_ascii=False), encoding="utf-8")
    print(f"plants/: {len(keep)} pages built, {removed} removed")


if __name__ == "__main__": main()
