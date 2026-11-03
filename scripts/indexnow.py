#!/usr/bin/env python3
"""Tell Bing, DuckDuckGo's Bing-powered results, Yandex and other IndexNow search engines that pages changed (Google does not use IndexNow).
Sends the home page, the sitemap and every page changed in the last commit. Safe to run any time; failures never stop a build.
Usage: python3 scripts/indexnow.py [https://your-domain]"""
import json, subprocess, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = (sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "https://spinanspiritus.com").rstrip("/")
KEY = "c3a1e7d94b6f4a2e8d05b7f1a9c64e32"   # public by design: the same value is served at /<key>.txt so search engines can verify ownership
host = SITE.split("//", 1)[1]
urls = {SITE + "/", SITE + "/sitemap.xml", SITE + "/spiritus.html"}
try:
    changed = subprocess.run(["git", "diff", "--name-only", "HEAD~1", "HEAD"], cwd=ROOT, capture_output=True, text=True, timeout=30).stdout.split()
except Exception:
    changed = []
for f in changed:
    if f.endswith(".html") and not f.startswith(("incoming/", "404", "thanks")) and (ROOT / f).exists():
        urls.add(SITE + ("/" if f == "index.html" else "/" + f))
body = json.dumps({"host": host, "key": KEY, "keyLocation": f"{SITE}/{KEY}.txt", "urlList": sorted(urls)[:200]}).encode()
try:
    req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, headers={"Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(req, timeout=20) as r: print("IndexNow:", r.status, f"{len(urls)} URLs")
except Exception as e:
    print("IndexNow skipped:", e)
