#!/usr/bin/env python3
"""Remember when each plant (and each event) first showed up, so the Monday email can say what is NEW.

Writes data/first_seen.json: {"plants": {sku: "YYYY-MM-DD"}, "events": {"name|date": "YYYY-MM-DD"}}.
- A plant that is gone from the inventory (sold out / removed) is forgotten, so if it comes back it counts as new again.
- The very first run marks every existing plant as old (so the first email is not a flood); existing events count as new today.
Runs after sync_inventory.py in the sync workflow.
"""
import csv, json, sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "data/first_seen.json"
SEED_OLD = "2026-01-01"


def main():
    today = date.today().isoformat()
    inv = ROOT / "data/inventory.csv"
    if not inv.exists(): sys.exit("no inventory.csv")
    with open(inv, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    skus = {r["sku"] for r in rows if r.get("sku") and str(r.get("stock", "")).strip() != "0" and "sold" not in (r.get("status") or "").lower()}
    if not skus: sys.exit("inventory looks empty; leaving first_seen.json alone")
    events = {}
    try:
        site = json.loads((ROOT / "data/site.json").read_text(encoding="utf-8"))
        for e in site.get("events") or []:
            if e.get("name") and e.get("date"): events[f"{e['name']}|{e['date']}"] = e
    except Exception:
        pass

    first_run = not STATE.exists()
    try: state = json.loads(STATE.read_text(encoding="utf-8")) if not first_run else {}
    except Exception: state, first_run = {}, True
    plants, evs = state.get("plants", {}), state.get("events", {})

    new_plants = {s: (SEED_OLD if first_run else today) for s in skus if s not in plants}
    plants = {s: d for s, d in plants.items() if s in skus}          # forget plants that are gone
    plants.update(new_plants)
    for k in events:
        if k not in evs: evs[k] = today
    evs = {k: d for k, d in evs.items() if k in events}                # forget removed events

    out = {"plants": dict(sorted(plants.items())), "events": dict(sorted(evs.items()))}
    text = json.dumps(out, indent=1, ensure_ascii=False) + "\n"
    if not STATE.exists() or STATE.read_text(encoding="utf-8") != text: STATE.write_text(text, encoding="utf-8")
    print(f"first_seen.json: {len(plants)} plants tracked, {len(new_plants)} new" + (" (first run: all marked old)" if first_run else ""))


if __name__ == "__main__": main()
