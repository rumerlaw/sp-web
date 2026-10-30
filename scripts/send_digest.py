#!/usr/bin/env python3
"""Monday email to everyone on the weekly list (sent through Resend).

Contents: plants that are NEW this week, and events that are coming up (any event added this week, plus every dated event
within the next 14 days: with a Saturday event that is exactly two Mondays, "2 weeks before" and "the following week").
If there is nothing new and no event to mention, nothing is sent (set ALWAYS_SEND=true to send anyway).

Environment: RESEND_API_KEY (required), RESEND_AUDIENCE_ID (the subscriber list), OWNER_EMAIL, FROM_EMAIL, SITE_URL,
             TEST_ONLY=true  -> send only to the owner (a preview), FORCE=true -> ignore the "already sent this week" guard.
Local preview without sending:  python3 scripts/send_digest.py --print [--today 2026-11-02]
"""
import csv, html, json, os, re, sys, urllib.error, urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = (os.environ.get("SITE_URL") or "https://spinanspiritus.com").strip().rstrip("/") or "https://spinanspiritus.com"
FROM = os.environ.get("FROM_EMAIL") or "Spina & Spiritus <orders@spinanspiritus.com>"
OWNER = os.environ.get("OWNER_EMAIL") or "spinanspiritus@gmail.com"
API = os.environ.get("RESEND_API_URL") or "https://api.resend.com"
KEY = os.environ.get("RESEND_API_KEY", "").strip()
AUDIENCE = os.environ.get("RESEND_AUDIENCE_ID", "").strip()
truthy = lambda v: str(v or "").strip().lower() in ("1", "true", "yes", "on")
esc = lambda s: html.escape(str(s), quote=True)
slug = lambda sku: re.sub(r"[^a-z0-9-]+", "-", str(sku).lower()).strip("-")


def money(v):
    try: v = float(v)
    except Exception: return ""
    return ("$%g" % v) if v > 0 else ""


def load():
    with open(ROOT / "data/inventory.csv", newline="", encoding="utf-8") as f: inv = list(csv.DictReader(f))
    try: seen = json.loads((ROOT / "data/first_seen.json").read_text(encoding="utf-8"))
    except Exception: seen = {"plants": {}, "events": {}}
    try: site = json.loads((ROOT / "data/site.json").read_text(encoding="utf-8"))
    except Exception: site = {}
    return inv, seen, site


def build(today):
    inv, seen, site = load()
    week_ago = (today - timedelta(days=7)).isoformat()
    new_plants = [r for r in inv if seen.get("plants", {}).get(r["sku"], "0000") > week_ago and str(r.get("stock", "")).strip() != "0"
                  and "sold" not in (r.get("status") or "").lower()]
    new_plants.sort(key=lambda r: r["name"].lower())

    coming, regular = [], []
    for e in site.get("events") or []:
        d = None
        try: d = datetime.strptime(e.get("date") or "", "%Y-%m-%d").date()
        except Exception: pass
        if not d:
            regular.append(e); continue
        days = (d - today).days
        is_new = seen.get("events", {}).get(f"{e.get('name')}|{e.get('date')}", "0000") > week_ago
        if 0 <= days <= 14 or (is_new and days >= 0): coming.append((d, days, is_new, e))
    coming.sort(key=lambda t: t[0])

    if not new_plants and not coming: return None
    btn = lambda url, label: f'<a href="{esc(url)}" style="display:inline-block;background:#2f4a2c;color:#ffffff;text-decoration:none;padding:12px 22px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold">{esc(label)}</a>'
    head = lambda t: f'<h2 style="font-family:Georgia,serif;font-size:22px;margin:30px 0 12px;color:#24231f">{esc(t)}</h2>'
    parts = []
    this_week = [t for t in coming if t[1] <= 6]
    later = [t for t in coming if t[1] > 6]
    if this_week:   # an event in the next 7 days goes first and is highlighted
        parts.append('<div style="background:#2f4a2c;color:#ffffff;padding:10px 16px;font-size:13px;font-weight:bold;letter-spacing:.14em;text-transform:uppercase;margin-top:24px">Happening this week</div>')
        for d, days, is_new, e in this_week:
            when = "today" if days == 0 else "tomorrow" if days == 1 else f"in {days} days"
            tag = '<span style="background:#a07d3c;color:#fff;font-size:11px;font-weight:bold;letter-spacing:.1em;padding:2px 7px;margin-right:6px">NEW</span>' if is_new else ""
            box = f'<div style="border:2px solid #2f4a2c;border-top:0;background:#f3ede0;padding:16px 18px;margin-bottom:12px"><div style="font-size:19px;font-weight:bold">{tag}{esc(e.get("name",""))}</div>'
            wt = str(e.get("when", ""))
            when_line = wt if re.search(r"jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec", wt, re.I) else f'{d.strftime("%A, %B %-d")} · {wt}'   # don't repeat the date
            box += f'<div style="font-size:16px;margin-top:5px"><b>{esc(when_line)}</b> <span style="color:#47443b">({when})</span></div>'
            if e.get("where"): box += f'<div style="font-size:14px;color:#47443b;margin-top:3px">{esc(e["where"])}</div>'
            if re.match(r"^https://", str(e.get("url") or "")) and "<" not in e["url"] and '"' not in e["url"]:
                box += f'<div style="margin-top:12px">{btn(e["url"], "Get your free ticket")}</div>'
            parts.append(box + "</div>")
    if later:
        parts.append(head("Coming up"))
        for d, days, is_new, e in later:
            when = "today" if days == 0 else "tomorrow" if days == 1 else f"in {days} days"
            tag = '<span style="background:#a07d3c;color:#fff;font-size:11px;font-weight:bold;letter-spacing:.1em;padding:2px 7px;margin-right:6px">NEW</span>' if is_new else ""
            line = f'<div style="border:1px solid #e6dfd0;padding:14px 16px;margin-bottom:12px"><div style="font-size:16px;font-weight:bold">{tag}{esc(e.get("name",""))}</div>'
            line += f'<div style="font-size:15px;margin-top:4px">{esc(e.get("when",""))} <span style="color:#6b675b">({when})</span></div>'
            if e.get("where"): line += f'<div style="font-size:14px;color:#47443b;margin-top:2px">{esc(e["where"])}</div>'
            if re.match(r"^https://", str(e.get("url") or "")) and "<" not in e["url"] and '"' not in e["url"]:
                line += f'<div style="margin-top:10px">{btn(e["url"], "Get your free ticket")}</div>'
            parts.append(line + "</div>")
    if new_plants:
        parts.append(head(f"New this week ({len(new_plants)})"))
        for r in new_plants[:30]:
            img = next((u for u in (r.get("image") or "").split("|") if u.startswith("assets/") and ".." not in u), "")
            price = money(r.get("sale_price") if (r.get("sale_price") and "sale" in (r.get("status") or "").lower()) else r.get("price"))
            img_html = f'<img src="{esc(SITE + "/" + img)}" width="96" alt="{esc(r["name"])}" style="display:block;border:0">' if img else ""
            cell = f'<td width="96" valign="top" style="padding:0 14px 14px 0">{img_html}</td>'
            parts.append(f'<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>{cell}<td valign="top" style="padding-bottom:14px"><a href="{esc(SITE)}/plants/{esc(slug(r["sku"]))}.html" style="color:#24231f;font-size:17px;font-weight:bold;text-decoration:none">{esc(r["name"])}</a><div style="color:#47443b;font-size:14px">{esc(r.get("genus",""))}</div><div style="color:#2d6b3f;font-size:16px;font-weight:bold">{esc(price)}</div></td></tr></table>')
        if len(new_plants) > 30: parts.append(f'<p style="font-size:14px">…and {len(new_plants)-30} more in the shop.</p>')
    if regular:
        parts.append(head("Where to find us"))
        for e in regular:
            note = ""
            ex = [x for x in re.findall(r"\d{4}-\d{2}-\d{2}", str(e.get("except") or "")) if x >= today.isoformat()]
            if ex: note = " — not on " + ", ".join(datetime.strptime(x, "%Y-%m-%d").strftime("%b %-d") for x in sorted(ex))
            parts.append(f'<p style="font-size:15px;margin:0 0 8px"><b>{esc(e.get("name",""))}</b><br>{esc(e.get("when",""))}{esc(note)}<br><span style="color:#47443b;font-size:14px">{esc(e.get("where",""))}</span></p>')
    parts.append(f'<p style="margin:26px 0 8px">{btn(SITE + "/shop.html", "Shop the plants")}</p><p style="font-size:13px;color:#6b675b">Reserve online, pay in person at pickup. No shipping.</p>')

    sub = []
    if new_plants: sub.append(f"{len(new_plants)} new plant" + ("s" if len(new_plants) != 1 else ""))
    if this_week: sub.insert(0, "This week: " + this_week[0][3].get("name", "an event") + (f" + {len(this_week)-1} more" if len(this_week) > 1 else ""))
    elif coming: sub.append(coming[0][3].get("name", "an event") + (f" + {len(coming)-1} more" if len(coming) > 1 else ""))
    subject = "New at Spina & Spiritus: " + " · ".join(sub)
    body = ('<div style="background:#faf8f3;padding:24px 12px"><div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;padding:28px 26px;color:#24231f">'
            f'<div style="text-align:center;margin-bottom:6px"><img src="{esc(SITE)}/assets/brand/spina-logo-640.png" width="150" alt="Spina &amp; Spiritus" style="border:0"></div>'
            + "".join(parts) +
            '<hr style="border:0;border-top:1px solid #e6dfd0;margin:30px 0 14px"><p style="font-size:12px;color:#6b675b;line-height:1.5">You are getting this because you joined the Spina &amp; Spiritus weekly list. '
            '<a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#6b675b">Unsubscribe</a></p></div></div>')
    return subject, body, len(new_plants), len(coming)


def call(method, path, payload):
    req = urllib.request.Request(API + path, data=json.dumps(payload).encode() if payload is not None else None, method=method,
                                 headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json", "User-Agent": "spina-digest/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r: return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode("utf-8", "replace")[:400]}


def main():
    argv = sys.argv[1:]
    today = date.fromisoformat(argv[argv.index("--today") + 1]) if "--today" in argv else date.today()
    built = build(today)
    if not built and not truthy(os.environ.get("ALWAYS_SEND")):
        print("Nothing new and no event to mention this week: no email sent."); return
    if not built:
        built = ("This week at Spina & Spiritus", build_empty(), 0, 0)
    subject, body, n_plants, n_events = built
    print(f"Digest: {n_plants} new plants, {n_events} events. Subject: {subject}")
    if "--print" in argv:
        out = ROOT / "digest_preview.html"; out.write_text(body.replace("{{{RESEND_UNSUBSCRIBE_URL}}}", "#"), encoding="utf-8"); print("wrote", out); return
    if not KEY: print("RESEND_API_KEY is not set yet: nothing sent."); return

    state_f = ROOT / "data/digest_state.json"
    test_only = truthy(os.environ.get("TEST_ONLY")) or not AUDIENCE
    if not test_only and not truthy(os.environ.get("FORCE")) and state_f.exists():
        try:
            last = date.fromisoformat(json.loads(state_f.read_text())["last_sent"])
            if (today - last).days < 5: print(f"Already sent on {last}; skipping (set FORCE to resend)."); return
        except Exception: pass

    if test_only:
        st, res = call("POST", "/emails", {"from": FROM, "to": [OWNER], "subject": "[TEST] " + subject, "html": body.replace("{{{RESEND_UNSUBSCRIBE_URL}}}", "#")})
        print("test email to the owner:", st, res)
        if st >= 300: sys.exit(1)
        if not AUDIENCE: print("(No RESEND_AUDIENCE_ID yet, so only a test to the owner was possible.)")
        return

    base = {"from": FROM, "subject": subject, "html": body, "reply_to": OWNER, "name": "Weekly " + today.isoformat()}
    for key in ("audience_id", "segment_id"):         # Resend renamed this field in newer API versions: try both
        st, res = call("POST", "/broadcasts", {**base, key: AUDIENCE})
        if st < 300 and res.get("id"): break
        print(f"create broadcast with {key}: {st} {res}")
    else:
        sys.exit("Could not create the broadcast. See the messages above.")
    st, res2 = call("POST", f"/broadcasts/{res['id']}/send", {})
    print("send broadcast:", st, res2)
    if st >= 300: sys.exit(1)
    state_f.write_text(json.dumps({"last_sent": today.isoformat(), "subject": subject}, indent=1) + "\n")
    print("Sent to the weekly list.")


def build_empty():
    return ('<div style="font-family:Arial;max-width:600px;margin:0 auto"><p>Nothing new this week. See what is in stock:</p>'
            f'<p><a href="{esc(SITE)}/shop.html">Shop the plants</a></p><p style="font-size:12px"><a href="{{{{{{RESEND_UNSUBSCRIBE_URL}}}}}}">Unsubscribe</a></p></div>')


if __name__ == "__main__": main()
