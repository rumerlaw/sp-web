#!/usr/bin/env python3
"""Regenerate sitemap.xml with one URL per plant in data/inventory.csv.
Usage: python3 scripts/build_sitemap.py [https://yourdomain.com]
Run it whenever you add plants, then redeploy. (Sold-out plants stay listed.)"""
import csv, sys
from pathlib import Path
from urllib.parse import quote
ROOT = Path(__file__).resolve().parent.parent
base = (sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "https://spinanspiritus.com").rstrip("/")
urls = [(base + "/", "1.0", "weekly"), (base + "/faq.html", "0.6", "monthly"), (base + "/about.html", "0.6", "monthly")]
with open(ROOT / "data/inventory.csv", newline="", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        sku = (r.get("sku") or "").strip()
        if sku: urls.append((f"{base}/plant.html?id={quote(sku)}", "0.7", "weekly"))
body = "".join(f"  <url><loc>{u.replace('&', '&amp;')}</loc><changefreq>{c}</changefreq><priority>{p}</priority></url>\n" for u, p, c in urls)
(ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}</urlset>\n')
print(f"wrote sitemap.xml with {len(urls)} URLs")
