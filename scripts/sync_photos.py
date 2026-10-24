#!/usr/bin/env python3
"""Pull plant photos from a Dropbox folder, clean them, and publish web-ready copies.

Name each photo after its plant (same name as in the spreadsheet):
    Opuntia microdasys.jpg        first/main photo
    Opuntia microdasys 2.jpg      more photos (2, 3, ...)
Matching ignores capitals, spaces and punctuation.

What it does to every photo: removes ALL hidden data (GPS, camera, dates), fixes rotation,
and saves a 1400px JPG + a fast 1200px WebP + a 480px thumbnail. Originals never leave Dropbox.
Result: assets/photos/{photo-*.jpg, web/, thumb/} and data/photos.csv (read by sync_inventory.py).

Usage:
  DROPBOX_PHOTOS_URL=<folder share link> python3 scripts/sync_photos.py
  python3 scripts/sync_photos.py --zip folder.zip     # test with a local zip
"""
import csv, hashlib, io, json, os, re, sys, urllib.request, zipfile
from pathlib import Path, PurePosixPath
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from PIL import Image, ImageOps

try:
    import pillow_heif; pillow_heif.register_heif_opener()
except Exception:
    pass
Image.MAX_IMAGE_PIXELS = 120_000_000

ROOT = Path(__file__).resolve().parent.parent
PHOTOS, MANIFEST, OUTCSV = ROOT / "assets/photos", ROOT / "data/photos_manifest.json", ROOT / "data/photos.csv"
EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
MAX_FILES, MAX_BYTES, MAX_TOTAL = 1500, 60_000_000, 2_000_000_000

def fullkey(stem): return re.sub(r"[^a-z0-9]", "", stem.lower())

def fetch_zip(url):
    u = urlparse(url)
    if "dropbox.com" not in u.netloc: sys.exit("DROPBOX_PHOTOS_URL must be a dropbox.com folder share link")
    q = dict(parse_qsl(u.query)); q["dl"] = "1"
    req = urllib.request.Request(urlunparse(u._replace(query=urlencode(q))), headers={"User-Agent": "Mozilla/5.0"})
    buf = io.BytesIO(); total = 0
    with urllib.request.urlopen(req, timeout=300) as r:
        while True:
            chunk = r.read(1 << 20)
            if not chunk: break
            total += len(chunk)
            if total > MAX_TOTAL: sys.exit("Photo folder is too large (over 2 GB)")
            buf.write(chunk)
    buf.seek(0)
    if buf.read(2) != b"PK": sys.exit("Downloaded folder is not a zip (check the share link permissions)")
    buf.seek(0); return buf

def save_all(im, key):
    im = ImageOps.exif_transpose(im).convert("RGB")
    clean = Image.frombytes("RGB", im.size, im.tobytes())          # fresh image: no metadata at all
    PHOTOS.mkdir(parents=True, exist_ok=True)
    for sub in ("web", "thumb"): (PHOTOS / sub).mkdir(exist_ok=True)
    big = clean.copy(); big.thumbnail((1400, 1400)); big.save(PHOTOS / f"photo-{key}.jpg", "JPEG", quality=80, optimize=True, progressive=True)
    web = clean.copy(); web.thumbnail((1200, 1200)); web.save(PHOTOS / "web" / f"photo-{key}.webp", "WEBP", quality=66, method=6)
    th = clean.copy(); th.thumbnail((480, 480)); th.save(PHOTOS / "thumb" / f"photo-{key}.webp", "WEBP", quality=70, method=6)

def main():
    args = sys.argv[1:]
    if "--zip" in args: src = open(args[args.index("--zip") + 1], "rb")
    else:
        url = os.environ.get("DROPBOX_PHOTOS_URL", "").strip()
        if not url: print("DROPBOX_PHOTOS_URL not set; skipping photo sync"); return
        src = fetch_zip(url)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    new_manifest, done, skipped, bad, labels = {}, 0, [], [], {}
    with zipfile.ZipFile(src) as z:
        infos = [i for i in z.infolist() if not i.is_dir()]
        if len(infos) > MAX_FILES: sys.exit("Too many files in the photo folder")
        seen = {}
        for i in infos:
            name = PurePosixPath(i.filename).name            # basename only (blocks path tricks)
            stem, ext = os.path.splitext(name)
            if name.startswith(".") or name.startswith("~"): continue
            if ext.lower() not in EXT: skipped.append(name); continue
            if i.file_size > MAX_BYTES: bad.append(name + " (too big)"); continue
            key = fullkey(stem)
            if not key: continue
            data = z.read(i)
            h = hashlib.sha1(data).hexdigest()
            if key in seen: bad.append(f"{name} (same name as {seen[key]})"); continue
            seen[key] = name
            labels[key] = stem
            new_manifest[key] = h
            if manifest.get(key) == h and (PHOTOS / f"photo-{key}.jpg").exists(): continue
            try:
                with Image.open(io.BytesIO(data)) as im: save_all(im, key)
                done += 1
            except Exception as e:
                bad.append(f"{name} ({type(e).__name__})"); new_manifest.pop(key, None)
    # remove photos that were deleted from Dropbox
    for key in set(manifest) - set(new_manifest):
        for p in (PHOTOS / f"photo-{key}.jpg", PHOTOS / "web" / f"photo-{key}.webp", PHOTOS / "thumb" / f"photo-{key}.webp"):
            if p.exists(): p.unlink()
    MANIFEST.write_text(json.dumps(new_manifest, indent=0, sort_keys=True))
    (ROOT / "data/photos_labels.json").write_text(json.dumps({k: labels.get(k, k) for k in new_manifest}, indent=0, sort_keys=True, ensure_ascii=False))
    with open(OUTCSV, "w", newline="") as f:
        w = csv.writer(f, lineterminator="\n"); w.writerow(["key", "image"])
        for k in sorted(new_manifest): w.writerow([k, f"assets/photos/photo-{k}.jpg"])
    print(f"photos: {len(new_manifest)} in folder, {done} new/updated, {len(set(manifest) - set(new_manifest))} removed")
    if skipped: print("skipped (not a photo):", ", ".join(skipped[:10]))
    if bad: print("could not use:", "; ".join(bad[:10]))

if __name__ == "__main__": main()
