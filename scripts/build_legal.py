#!/usr/bin/env python3
"""Build the policy pages: shipping.html (Shipping & returns), privacy.html, terms.html.

Numbers (shipping fees, excluded states, candle price) come from data/site.json so the pages never drift from the shop.
THESE ARE DRAFTS written from how the site works today; the owner should read them and confirm the policy choices
(see the CONFIRM markers in this file) and have them reviewed by a lawyer if desired.
Run after build_plants.py / build_books.py:  python3 scripts/build_legal.py [https://your-domain]
"""
import html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = (sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "https://spinanspiritus.com").rstrip("/")
esc = lambda s: html.escape(str(s), quote=True)
site = json.loads((ROOT / "data/site.json").read_text(encoding="utf-8"))
ship = site.get("shipping") or {}
cls = ship.get("classes") or {"small": 10, "medium": 15, "large": 20}
extra = ship.get("extraPlant", 5)
NAMES = {"CA": "California", "HI": "Hawaii"}
_ex = [NAMES.get(x, x) for x in (ship.get("excludedStates") or [])]
excl = " and ".join(_ex) if len(_ex) <= 2 else ", ".join(_ex[:-1]) + " and " + _ex[-1]
EMAIL = (site.get("contact") or {}).get("email") or "spinanspiritus@gmail.com"
UPDATED = "November 3, 2026"
m = lambda v: ("$%g" % float(v))
book_flat = ship.get("bookFlat")
book_line = ("Books ship free." if book_flat in (0, 0.0) else f"Books ship for one flat fee of {m(book_flat)} per order." if book_flat not in (None, "") else "Shipping for books is coming soon; for now, books are picked up at an event.")

PAGES = {
 "shipping": dict(
  title="Shipping & Returns", desc="Pickup, shipping fees, delivery, damaged items and returns for plants, candles and books from Spina & Spiritus, Phoenix AZ.",
  sections=[
   ("Two ways to get your order", f"<p><b>Pick up at an event (free).</b> Reserve online, choose an event, and pay in person (cash or card). Plants are picked up at plant events, candles and books at the spirit-side events, and an order with both at events both sides attend. See <a href=\"index.html#events\">Upcoming events</a> for dates and places. We message you to confirm.</p><p><b>Ship to me.</b> Pay online on Stripe's secure page and we ship to any address in the US except {esc(excl)}.</p>"),
   ("Shipping fees", f"<ul><li><b>Plants (shipped bare-root, no pot):</b> a flat fee based on the largest plant in your order: {m(cls['small'])} small, {m(cls['medium'])} medium, {m(cls['large'])} large, plus {m(extra)} for each extra plant in the same box. The fee is shown in your cart before you pay.</li><li><b>Candles:</b> shipping is free.</li><li><b>Books:</b> {esc(book_line)}</li></ul>"),
   ("Bare-root plants (no pot)", "<p>Every plant we ship is <b>bare-root, with no pot</b>. Our photos show plants in pots, which is how they come when you pick them up at an event; for shipping we remove the pot. When your shipped plant arrives, unpack it right away and pot it in dry, gritty cactus mix, then wait about a week before the first watering so the roots can settle.</p>"),
   ("Packing and delivery", "<p>We pack plants with care and message you when your order ships. Delivery time depends on the carrier and the weather. In extreme heat or cold we may hold a plant shipment for a few days to keep your plant safe; we will message you if that happens.</p><p>Please be home, or have someone receive the box, soon after it arrives. Open it right away and give the plant light and air.</p>"),
   ("Damaged or unhappy arrivals", f"<p>If something arrives damaged, or a plant arrives in poor condition, email <a href=\"mailto:{esc(EMAIL)}\">{esc(EMAIL)}</a> within 48 hours of delivery with your name and a couple of photos. We will make it right with a replacement or a refund.</p>"),  # CONFIRM: the 48-hour window and replace-or-refund promise
   ("Returns and cancellations", f"<p>Plants are living things, so we can't take them back once they have left us, but please tell us if something is wrong. Candles and books: if there is a problem, contact us and we'll sort it out. You can cancel a pickup reservation any time before the event by messaging us at <a href=\"mailto:{esc(EMAIL)}\">{esc(EMAIL)}</a>; nothing is charged for a pickup reservation until you pay in person.</p><p>Refunds for online payments go back to the original payment method through Stripe.</p>"),  # CONFIRM
   ("Questions", f"<p>Email <a href=\"mailto:{esc(EMAIL)}\">{esc(EMAIL)}</a> or see the <a href=\"faq.html\">FAQ</a>.</p>"),
  ]),
 "privacy": dict(
  title="Privacy Policy", desc="What Spina & Spiritus collects, why, and who it is shared with. We never sell your information.",
  sections=[
   ("The short version", "<p>We collect only what we need to take your order and send you the emails you asked for. We never sell your information, we don't run ads, and we don't use tracking cookies.</p>"),
   ("What we collect", "<ul><li><b>When you order:</b> your name, phone or email, your shipping address (for shipped orders), the pickup event you choose, your order and any notes you add.</li><li><b>When you join the email list:</b> your email address.</li><li><b>Payments:</b> card payments are handled by Stripe. We never see or store your card number.</li></ul>"),
   ("How we use it", "<ul><li>To prepare, ship or hand over your order and to message you about it.</li><li>To send the weekly email about new plants, candles, books and events, only if you joined the list. Every email has an unsubscribe link.</li></ul>"),
   ("Who helps us", "<p>We use a few trusted services to run the shop: <b>Stripe</b> (payments), <b>Resend</b> (sending emails and keeping the email list), <b>Cloudflare</b> (hosting the website), and <b>EmailJS</b> (delivering confirmation messages when needed). The website's fonts are served from our own site. The event maps are embedded from <b>Google Maps</b>, so Google may see your visit when a map loads. These services only receive what they need to do their job.</p>"),
   ("Storage on your device", "<p>Your cart is kept in your browser so it is still there when you come back. If you tick \"Remember my details on this device\" at checkout, your name, contact and address are saved in your browser only, never on our servers, and unticking the box deletes them. You can also clear them any time by clearing this site's data in your browser.</p>"),
   ("Your choices", f"<p>You can unsubscribe from our emails at any time with the link in any email. To ask what we hold about you, or to have it corrected or deleted, email <a href=\"mailto:{esc(EMAIL)}\">{esc(EMAIL)}</a>.</p>"),
   ("Children", "<p>This site is not aimed at children under 13 and we do not knowingly collect their information.</p>"),
   ("Changes", f"<p>If this policy changes we will update this page. Last updated {UPDATED}.</p>"),
  ]),
 "terms": dict(
  title="Terms of Sale", desc="The terms for buying plants, candles and books from Spina & Spiritus: orders, pricing, shipping, plant and candle care, and readings.",
  sections=[
   ("Who we are", f"<p>Spina &amp; Spiritus is one shop with two sides: <b>Spina</b>, plants by AzCactusDoctor, and <b>Spiritus</b>, candles, books and readings by Sonoran Mystic Tarot. We are based in Phoenix, Arizona. Contact: <a href=\"mailto:{esc(EMAIL)}\">{esc(EMAIL)}</a>.</p>"),
   ("Orders and availability", "<p>Many of our plants are one of a kind and stock is limited. Putting an item in your cart does not hold it. An order is confirmed when we message you (pickup orders) or when your payment goes through (shipped orders). If something sells out or we can't fulfil an order, we will tell you and refund anything you paid.</p>"),
   ("Prices and payment", "<p>Prices are in US dollars and shown on each item. Pickup orders are paid in person at the event. Shipped orders are paid online by card, Apple Pay or Google Pay through Stripe. Shipping fees are shown before you pay. Sales tax is added where the law requires it.</p>"),  # CONFIRM: sales tax handling with your accountant
   ("Shipping, pickup and returns", "<p>See <a href=\"shipping.html\">Shipping &amp; Returns</a> for fees, delivery, damaged items and returns. We ship within the US except the states listed there.</p>"),
   ("Plants", "<p>Plants are living and their health depends on light, water and climate. Shipped plants arrive bare-root (no pot) and need to be potted on arrival. We share care tips, but we can't guarantee how a plant will do in your conditions. Some plants have sharp spines or a sap that can irritate skin or be harmful if eaten; keep them away from children and pets and handle them with care.</p>"),
   ("Candles", "<p>Never leave a burning candle unattended. Keep it away from anything flammable, from children and from pets, and place it on a heat-safe surface. Trim the wick and follow any instructions that come with it.</p>"),
   ("Books and readings", "<p>Books are paperbacks sold by Spina &amp; Spiritus. Tarot and mediumship readings, booked through Sonoran Mystic Tarot, are offered for guidance, reflection and entertainment. They are not a substitute for professional medical, legal, financial or mental-health advice.</p>"),
   ("Our content", "<p>The photographs, text and designs on this site belong to Spina &amp; Spiritus, AzCactusDoctor, Sonoran Mystic Tarot and the book authors. Please ask before using them.</p>"),
   ("Liability", "<p>To the extent the law allows, our liability for any order is limited to the amount you paid for it. Nothing here limits rights you have under the law.</p>"),
   ("Governing law and changes", f"<p>These terms are governed by the laws of the State of Arizona. We may update them from time to time; the version on this page applies to new orders. Last updated {UPDATED}.</p>"),
  ]),
}


def stamps():
    s = (ROOT / "index.html").read_text(encoding="utf-8")
    return {n: (re.search(re.escape(n) + r"\?v=([0-9a-f]+)", s) or [None, ""])[1] for n in ("app.js", "styles.css", "early.js")}


def build(slug, d):
    url = f"{SITE}/{slug}.html"
    title = f"{d['title']} | Spina & Spiritus"
    body = "".join(f'<section class="legal-sec"><h2>{esc(h)}</h2>{t}</section>' for h, t in d["sections"])
    main = f'<main class="faqpage legal" id="faqPage"><div class="wrap narrow"><p class="legal-updated">Updated {UPDATED}</p><h1>{esc(d["title"])}</h1>{body}<p class="legal-back"><a class="btn ghost" href="index.html">&larr; Back to the shop</a></p></div></main>'
    s = (ROOT / "thanks.html").read_text(encoding="utf-8")
    for n, v in stamps().items():
        if v: s = re.sub(re.escape(n) + r"\?v=[0-9a-f]+", f"{n}?v={v}", s)
    s = re.sub(r"<title>.*?</title>", lambda _: f"<title>{esc(title)}</title>", s, count=1, flags=re.S)
    s = re.sub(r'<meta name="description" content="[^"]*">', lambda _: f'<meta name="description" content="{esc(d["desc"])}">', s, count=1)
    s = s.replace('<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="index, follow">')
    s = re.sub(r'<link rel="canonical" href="[^"]*">', lambda _: f'<link rel="canonical" href="{url}">', s, count=1)
    for key in ("og:title", "twitter:title"):
        s = re.sub(rf'(<meta (?:property|name)="{key}" content=")[^"]*', lambda mm: mm.group(1) + esc(title), s, count=1)
    for key in ("og:description", "twitter:description"):
        s = re.sub(rf'(<meta (?:property|name)="{key}" content=")[^"]*', lambda mm: mm.group(1) + esc(d["desc"]), s, count=1)
    s = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda mm: mm.group(1) + url, s, count=1)
    s = s.replace('<body data-page="thanks">', '<body data-page="legal">')
    i = s.index('<main class="faqpage"'); j = s.index("</main>", i) + len("</main>")
    s = s[:i] + main + s[j:]
    (ROOT / f"{slug}.html").write_text(s, encoding="utf-8")


def build404():
    s = (ROOT / "thanks.html").read_text(encoding="utf-8")
    for n, v in stamps().items():
        if v: s = re.sub(re.escape(n) + r"\?v=[0-9a-f]+", f"{n}?v={v}", s)
    s = s.replace("<head>\n", '<head>\n<base href="/">\n', 1)
    s = re.sub(r"<title>.*?</title>", "<title>Page not found | Spina &amp; Spiritus</title>", s, count=1, flags=re.S)
    s = re.sub(r'<link rel="canonical" href="[^"]*">', "", s, count=1)
    main = ('<main class="faqpage legal" id="faqPage"><div class="wrap narrow center"><h1>We couldn\'t find that page</h1>'
            '<p class="sub">The link may be old, or the plant may have sold. Try one of these:</p>'
            '<p class="notfound-links"><a class="btn" href="shop.html">Shop the plants</a> <a class="btn ghost" href="spiritus.html">Candles, books &amp; tarot</a> <a class="btn ghost" href="index.html">Home</a></p></div></main>')
    i = s.index('<main class="faqpage"'); j = s.index("</main>", i) + len("</main>")
    (ROOT / "404.html").write_text(s[:i] + main + s[j:], encoding="utf-8")


for slug, d in PAGES.items(): build(slug, d)
build404()
print("legal pages built:", ", ".join(f"{k}.html" for k in PAGES))
