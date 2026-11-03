#!/usr/bin/env python3
"""Build spiritus.html: a real, crawlable page for the Spiritus side (candles, books, readings) with its own title, description and
structured data. It is index.html with the plant-only sections removed, so it never drifts from the home page.
Run after build_books.py:  python3 scripts/build_spiritus.py [https://your-domain]
"""
import html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = (sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "https://spinanspiritus.com").rstrip("/")
esc = lambda s: html.escape(str(s), quote=True)
site = json.loads((ROOT / "data/site.json").read_text(encoding="utf-8"))
books = json.loads((ROOT / "data/books.json").read_text(encoding="utf-8"))
price_of = {b["id"]: b.get("price") for b in site.get("books", [])}
cand = site.get("candles") or {}
URL = f"{SITE}/spiritus.html"
TITLE = "Spiritus | Sonoran Mystic Tarot Candles, Books & Readings | Spina & Spiritus"
DESC = "Spiritus, the spirit side of Spina & Spiritus: Sonoran Mystic Tarot intention candles in six scents, books by Don Rumer-Rivera, and tarot and mediumship readings. Phoenix, AZ pickup or US shipping."

s = (ROOT / "index.html").read_text(encoding="utf-8")
for sec in ("about", "collection", "shop"):   # plant-only sections
    s = re.sub(rf'<section class="section {sec}[^"]*" id="{sec}">.*?</section>\s*', "", s, count=1, flags=re.S)
s = s.replace('<html lang="en">', '<html lang="en" data-realm="spiritus">', 1)
s = re.sub(r"<title>.*?</title>", lambda m: f"<title>{esc(TITLE)}</title>", s, count=1, flags=re.S)
for pat, val in ((r'(<meta name="description" content=")[^"]*', DESC), (r'(<meta property="og:description" content=")[^"]*', DESC), (r'(<meta name="twitter:description" content=")[^"]*', DESC),
                 (r'(<meta property="og:title" content=")[^"]*', TITLE), (r'(<meta name="twitter:title" content=")[^"]*', TITLE),
                 (r'(<meta property="og:url" content=")[^"]*', URL),
                 (r'(<meta property="og:image" content=")[^"]*', f"{SITE}/assets/brand/hero-spiritus.webp"), (r'(<meta name="twitter:image" content=")[^"]*', f"{SITE}/assets/brand/hero-spiritus.webp"),
                 (r'(<meta property="og:image:alt" content=")[^"]*', "Spina & Spiritus, Spiritus side: a desert night sky with cacti, tarot cards and crystals")):
    s = re.sub(pat, lambda m, v=val: m.group(1) + esc(v), s, count=1)
s = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{URL}">', s, count=1)
s = re.sub(r'(<meta name="keywords" content=")[^"]*', lambda m: m.group(1) + "Spiritus, Spina & Spiritus, Sonoran Mystic Tarot, intention candles, tarot readings Phoenix, mediumship, books by Don Rumer-Rivera, The Mediums, The Ultimate Power Within, A Silence Too Loud, A Space Between Breaths", s, count=1)

# structured data for this page: the Spiritus organization, six candle products, and the books
img = f"{SITE}/assets/spiritus/candle-table.webp"
graph = [
  {"@type": "Organization", "@id": f"{SITE}/#spiritus", "name": "Spiritus", "alternateName": ["Sonoran Mystic Tarot", "Spina & Spiritus Spiritus"], "url": URL, "parentOrganization": {"@id": f"{SITE}/#org"},
   "sameAs": ["https://sonoranmystictarot.com/", "https://instagram.com/sonoranmystictarot", "https://www.facebook.com/Sonoranmystictarot/", "https://www.youtube.com/@SonoranMysticTarot"]},
  {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Spina & Spiritus", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": "Spiritus", "item": URL}]},
]
if cand.get("scents") and float(cand.get("price") or 0) > 0:
    for n in cand["scents"]:
        graph.append({"@type": "Product", "name": f"{n} Intention Candle by Sonoran Mystic Tarot", "image": img, "brand": {"@type": "Brand", "name": "Sonoran Mystic Tarot"},
                      "description": (cand.get("descriptions") or {}).get(re.sub(r"[^a-z]", "", n.lower()), "Hand-poured intention candle."),
                      "offers": {"@type": "Offer", "price": "%.2f" % float(cand["price"]), "priceCurrency": "USD", "availability": "https://schema.org/InStock", "url": URL, "seller": {"@id": f"{SITE}/#spiritus"}}})
graph.append({"@type": "ItemList", "name": "Books by Don Rumer-Rivera", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/books/{b['slug']}.html", "name": b["title"]} for i, b in enumerate(books)]})
ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)
s = re.sub(r'(<script type="application/ld\+json"[^>]*>).*?(</script>)', lambda m: m.group(1) + ld + m.group(2), s, count=1, flags=re.S)
s = re.sub(r'\s*<script type="application/ld\+json" id="eventld">.*?</script>', "", s, flags=re.S)

# one real <h1> for this page: the Spiritus banner becomes the heading, the plant banner's heading becomes a plain block
s = s.replace('<h1 class="hero-brand">', '<div class="hero-brand">', 1)
s = re.sub(r'(<div class="hero-brand">.*?</picture>)</h1>', r'\1</div>', s, count=1, flags=re.S)
s = s.replace('<div class="hero-brand-spirit">', '<h1 class="hero-brand-spirit">', 1)
s = re.sub(r'(<h1 class="hero-brand-spirit">.*?</picture>)</div>', r'\1</h1>', s, count=1, flags=re.S)
s = s.replace('alt="Spina &amp; Spiritus: plants, metaphysical, spirits. A desert night sky with cacti, tarot cards and crystals."', 'alt="Spiritus by Sonoran Mystic Tarot, part of Spina &amp; Spiritus: intention candles, books and tarot readings under a desert night sky"', 1)
(ROOT / "spiritus.html").write_text(s, encoding="utf-8")
print("spiritus.html built")
