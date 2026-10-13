#!/usr/bin/env python3
"""Strip ALL metadata (EXIF, GPS, camera, timestamps, XMP, thumbnails) from photos and videos.

Usage:
  1. Put originals in ./incoming/   (this folder is git-ignored)
  2. python3 scripts/strip_media.py
  3. Clean copies appear in assets/photos and assets/videos (photos resized to max 2400px).

  python3 scripts/strip_media.py --check   # fail if any file under assets/ still has metadata
Requires: Pillow (pip install pillow) and ffmpeg.
"""
import subprocess, sys
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC, PHOTOS, VIDEOS = ROOT / "incoming", ROOT / "assets/photos", ROOT / "assets/videos"
IMG = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".tif", ".tiff"}
VID = {".mp4", ".mov", ".m4v", ".webm"}
MAX_PX = 2400

def clean_photo(src, dst):
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)          # bake in rotation before dropping EXIF
        im.thumbnail((MAX_PX, MAX_PX))
        im = im.convert("RGB")
        clean = Image.frombytes("RGB", im.size, im.tobytes())   # fresh image: carries no metadata
        clean.save(dst, "JPEG", quality=88, optimize=True, progressive=True)

def clean_video(src, dst):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
                    "-map_metadata", "-1", "-map_chapters", "-1", "-map", "0:v", "-map", "0:a?",
                    "-c", "copy", "-fflags", "+bitexact", "-flags:v", "+bitexact", "-flags:a", "+bitexact",
                    "-movflags", "+faststart", str(dst)], check=True)

def run():
    PHOTOS.mkdir(parents=True, exist_ok=True); VIDEOS.mkdir(parents=True, exist_ok=True)
    n = 0
    for f in sorted(SRC.iterdir()) if SRC.exists() else []:
        ext = f.suffix.lower()
        if ext in IMG:
            clean_photo(f, PHOTOS / (f.stem.lower().replace(" ", "-") + ".jpg")); n += 1
        elif ext in VID:
            clean_video(f, VIDEOS / (f.stem.lower().replace(" ", "-") + ".mp4")); n += 1
        elif not f.name.startswith("."):
            print("skipped (unsupported):", f.name)
    print(f"cleaned {n} file(s). Originals stay in incoming/ (not committed).")

def check():
    bad = []
    for f in list(PHOTOS.glob("*")) + list(VIDEOS.glob("*")):
        if f.name.startswith("."): continue
        if f.suffix.lower() in IMG:
            with Image.open(f) as im:
                if im.getexif() or im.info.get("exif") or im.info.get("xmp"):
                    bad.append(f)
        elif f.suffix.lower() in VID:
            out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format_tags:stream_tags",
                                  "-of", "default=nw=1", str(f)], capture_output=True, text=True).stdout
            tags = [l for l in out.splitlines() if "=" in l and not l.split("=")[0].lower().endswith(("handler_name", "vendor_id", "language", "encoder", "major_brand", "minor_version", "compatible_brands"))]
            if tags: bad.append(f)
    for f in bad: print("HAS METADATA:", f.relative_to(ROOT))
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    check() if "--check" in sys.argv else run()
