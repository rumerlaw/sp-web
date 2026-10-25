#!/usr/bin/env python3
"""Regenerate sitemap.xml: the main pages + one URL (with its photo) for every plant page in plants/.
Usage: python3 scripts/build_sitemap.py [https://yourdomain.com]
Runs automatically after build_plants.py in the sync workflow. Plants that are gone/sold out are not listed."""
import json, sys
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape
ROOT = Path(__file__).resolve().parent.parent
base = (sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "https://spinanspiritus.com").rstrip("/")
today = date.today().isoformat()
pages = [("/", "1.0", "weekly"), ("/shop.html", "0.9", "daily"), ("/about.html", "0.6", "monthly"), ("/faq.html", "0.6", "monthly")]
rows = [f"  <url><loc>{base}{p}</loc><lastmod>{today}</lastmod><changefreq>{c}</changefreq><priority>{pr}</priority></url>" for p, pr, c in pages]
try: index = json.loads((ROOT / "data/plants_index.json").read_text(encoding="utf-8"))
except Exception: index = []
n = 0
for it in sorted(index, key=lambda x: x["slug"]):
    if not (ROOT / "plants" / f"{it['slug']}.html").exists(): continue
    img = it.get("image")
    image_xml = ""
    if img and str(img).startswith("assets/"):
        image_xml = f"<image:image><image:loc>{escape(base + '/' + str(img).lstrip('./'))}</image:loc><image:title>{escape(it['name'])}</image:title></image:image>"
    rows.append(f"  <url><loc>{base}/plants/{it['slug']}.html</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority>{image_xml}</url>")
    n += 1
xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
       'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + "\n".join(rows) + "\n</urlset>\n")
(ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
print(f"wrote sitemap.xml with {len(rows)} URLs ({n} plants)")
