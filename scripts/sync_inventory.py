#!/usr/bin/env python3
"""Build data/inventory.csv from the Dropbox Excel sheet (only the public columns).

Reads: name, genus/type, sell price, in stock  (header text is matched loosely, see ALIASES).
Merges data/extras.csv (matched by plant name) for things the sheet doesn't have:
sku, genus (only used when the sheet's Genus/Type is blank), category, size, description, image (photos separated by |), status, sale_price.
Anything else in the spreadsheet (costs, notes, customers...) is never read or published.

Usage:
  DROPBOX_INVENTORY_URL=<share link> python3 scripts/sync_inventory.py
  python3 scripts/sync_inventory.py --file local.xlsx        # test with a local copy
  add --dry to print a summary without writing.
Optional env: SHEET_NAME (tab to read; default: first tab with the right headers).
"""
import csv, io, os, re, sys, urllib.request
from pathlib import Path
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parent.parent
OUT, EXTRAS = ROOT / "data/inventory.csv", ROOT / "data/extras.csv"
ALIASES = {
    "name": ["name", "plant", "plant name", "item"],
    "genus": ["genus/type", "genus / type", "genus", "type"],
    "price": ["sell price", "selling price", "price", "sale price", "retail"],
    "stock": ["in stock", "stock", "qty", "quantity", "count"],
}
COLS = ["sku", "name", "genus", "category", "price", "sale_price", "status", "stock", "size", "description", "image"]
MAX_ROWS = 3000

norm = lambda s: re.sub(r"[^a-z0-9/ ]+", "", str(s or "").strip().lower())
key = lambda s: re.sub(r"\s+", " ", str(s or "").strip().lower())
def slug(s): return re.sub(r"[^a-z0-9]+", "-", str(s).lower()).strip("-")[:60]
def clean(s): return re.sub(r"[\x00-\x1f\x7f]", " ", str(s if s is not None else "")).strip()

def fetch(url):
    u = urlparse(url)
    if "dropbox.com" not in u.netloc: sys.exit("DROPBOX_INVENTORY_URL must be a dropbox.com share link")
    q = dict(parse_qsl(u.query)); q["dl"] = "1"
    req = urllib.request.Request(urlunparse(u._replace(query=urlencode(q))), headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r: data = r.read(30_000_000)
    if data[:2] != b"PK": sys.exit("Downloaded file is not an .xlsx (check the share link permissions)")
    return io.BytesIO(data)

def find_table(wb, want_sheet):
    for ws in wb.worksheets:
        if want_sheet and ws.title.strip().lower() != want_sheet.strip().lower(): continue
        rows = list(ws.iter_rows(min_row=1, max_row=MAX_ROWS, values_only=True))
        for i, row in enumerate(rows[:25]):
            heads = [norm(c) for c in row]
            idx = {}
            for field, names in ALIASES.items():
                for n in names:
                    if n in heads: idx[field] = heads.index(n); break
            if "name" in idx and ("price" in idx or "stock" in idx):
                return ws.title, idx, rows[i + 1:]
    sys.exit(f"Could not find a header row with name / price / stock columns{' in sheet ' + repr(want_sheet) if want_sheet else ''}")

def num(v):
    if v is None or str(v).strip() == "": return None
    m = re.search(r"-?\d+(?:\.\d+)?", str(v).replace(",", ""))
    return float(m.group()) if m else None

def stock_val(v):
    s = str(v if v is not None else "").strip().lower()
    if s == "": return ""
    if s in ("no", "n", "out", "sold", "sold out", "none"): return "0"
    n = num(s)
    return "" if n is None else str(max(0, int(n)))

def main():
    args = sys.argv[1:]
    dry = "--dry" in args
    if "--file" in args: src = open(args[args.index("--file") + 1], "rb")
    else:
        url = os.environ.get("DROPBOX_INVENTORY_URL", "").strip()
        if not url: sys.exit("Set DROPBOX_INVENTORY_URL (or use --file)")
        src = fetch(url)
    wb = load_workbook(src, read_only=True, data_only=True)
    title, idx, rows = find_table(wb, os.environ.get("SHEET_NAME", ""))
    extras = {}
    if EXTRAS.exists():
        with open(EXTRAS, newline="", encoding="utf-8") as f:
            for r in csv.DictReader(f): extras[key(r.get("name"))] = r
    out, used = [], set()
    for row in rows:
        if not row or idx["name"] >= len(row): continue
        name = clean(row[idx["name"]])
        if not name or re.fullmatch(r"(grand )?totals?:?", key(name)): continue   # skip blanks and the sheet's Total row
        g = lambda f: row[idx[f]] if f in idx and idx[f] < len(row) else None
        price = num(g("price"))
        ex = extras.get(key(name), {})
        genus = clean(g("genus")) or ex.get("genus", "")   # sheet wins; extras.csv fills blanks
        sku = ex.get("sku") if (ex.get("sku") and ex.get("sku") not in used) else slug(name)
        n = 2
        while sku in used: sku = f"{slug(name)}-{n}"; n += 1
        used.add(sku)
        out.append({"sku": sku, "name": name, "genus": genus, "category": ex.get("category") or genus or "Plants",
                    "price": ("%g" % price) if price else "", "sale_price": ex.get("sale_price", ""),
                    "status": ex.get("status") or "In Stock", "stock": stock_val(g("stock")),
                    "size": ex.get("size", ""), "description": ex.get("description", ""), "image": ex.get("image", "")})
        if len(out) >= MAX_ROWS: break
    if not out: sys.exit("No plants found; leaving inventory.csv unchanged")
    print(f"sheet '{title}': {len(out)} plants, total stock {sum(int(r['stock'] or 0) for r in out)} ({sum(1 for r in out if r['image'])} with photos, {sum(1 for r in out if not r['price'])} without a price)")
    if dry: return
    buf = io.StringIO(); w = csv.DictWriter(buf, fieldnames=COLS, lineterminator="\n"); w.writeheader(); w.writerows(out)
    new = buf.getvalue()
    if OUT.exists() and OUT.read_text(encoding="utf-8") == new: print("no changes"); return
    OUT.write_text(new, encoding="utf-8"); print("wrote", OUT.relative_to(ROOT))

if __name__ == "__main__": main()
