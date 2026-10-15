#!/usr/bin/env python3
"""NOTE: the live FAQ is now edited in the visual editor (data/site.json). This script only rebuilds the plain-HTML fallback
that shows if JavaScript is off. Build the FAQ (home-page section + faq.html) from the list below.
Edit FAQS, then run: python3 scripts/build_faq.py
Answers may use <b>, <i> and <a>. The first HOME_COUNT questions show on the home page."""
import html, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
HOME_COUNT = 5
FAQS = [
 ("What's a genus?",
  "Every plant has a two-part Latin name, like <i>Opuntia microdasys</i>. The first word is the <b>genus</b>: a group of closely related plants, like a family name. The second word is the <b>species</b>, the specific plant, like a first name. So <i>Opuntia</i> is the genus of all prickly pears, and <i>microdasys</i> is the bunny ears cactus."),
 ("How do reservations work?",
  "We can't bring every plant to every event, so browse the whole shop, reserve what you want, and choose the event you'll attend. We bring your plants there and message you to confirm. You pay in person when you pick them up."),
 ("Do you ship?",
  "No. Plants are pickup only, at our farmers market and events. Check the <a href=\"index.html#events\">Upcoming events</a> section for where we'll be."),
 ("Where can I find you?",
  "Every Saturday, 8am–12pm, at Roadrunner Park Farmers Market, <a href=\"https://www.google.com/maps/search/?api=1&query=3502+E+Cactus+Rd%2C+Phoenix%2C+AZ+85032\" rel=\"noopener\" target=\"_blank\">3502 E Cactus Rd, Phoenix, AZ 85032</a> (opens a map). For other locations we update the site and post on social media a couple of days before."),
 ("How do I pay?",
  "You pay when you pick up your plants at the event. There are no online payments."),
 ("How often should I water my cactus?",
  "Water deeply, then wait until the soil is completely dry before watering again. In the Arizona summer that is usually every week or two, and in winter much less, often once a month or less. Use a pot with a drainage hole and never leave it sitting in water. Too much water hurts a cactus faster than too little."),
 ("What if a plant is sold out?",
  "Sold out plants show a banner and can't be reserved. Join the email list at the bottom of the page and we'll send you a weekly update whenever we update the inventory."),
 ("Can I reserve more than one of a plant?",
  "Yes, up to the number we have in stock, which is shown on each plant's page."),
 ("How do I handle a prickly pear safely?",
  "Carry it by the pot. Opuntia pads have spines and tiny hair-like barbs called glochids that irritate skin. Use tongs or thick gloves if you need to touch the plant."),
 ("Who do I contact with questions?",
  "Message <a href=\"https://instagram.com/azcactusdoctor\" rel=\"noopener\" target=\"_blank\">@azcactusdoctor</a> or ask us at the market."),
]
def item(q, a): return f'<details class="faq-item"><summary><span>{html.escape(q)}</span><i class="plus" aria-hidden="true"></i></summary><div class="faq-a"><p>{a}</p></div></details>'
def plain(a): return re.sub(r"<[^>]+>", "", a).replace("&amp;", "&")
def block(n): return '<div class="faq-list" id="faqList">\n' + "\n".join(item(q, a) for q, a in FAQS[:n]) + "\n</div>"
ld = '<script type="application/ld+json">' + json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":plain(a)}} for q, a in FAQS]}, ensure_ascii=False) + '</script>'
# home page
p = ROOT / "index.html"; h = p.read_text()
sec = f'''<!-- FAQ:START -->
<section class="section faq" id="faq">
  <div class="wrap narrow">
    <div class="section-head center"><h2>Questions</h2></div>
    {block(HOME_COUNT)}
    <p class="center faq-more"><a class="btn ghost" href="faq.html">See all questions</a></p>
  </div>
</section>
<!-- FAQ:END -->'''
if "<!-- FAQ:START -->" in h: h = re.sub(r"<!-- FAQ:START -->.*?<!-- FAQ:END -->", sec, h, flags=re.S)
else: h = h.replace("<footer", sec + "\n\n<footer", 1)
p.write_text(h)
# faq page, built from the about page shell
a = (ROOT / "about.html").read_text()
a = a.replace('<body data-page="about">', '<body data-page="faq">').replace('href="#aboutPage"', 'href="#faqPage"')
a = re.sub(r"<title>.*?</title>", "<title>FAQ · Spina &amp; Spiritus</title>", a)
a = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Answers to common questions: what a genus is, how reservations and pickup work, events, payment and plant handling at Spina &amp; Spiritus by azcactusdoctor.">', a)
a = re.sub(r'<link rel="canonical"[^>]*>', '<link rel="canonical" href="https://azcactusdoctor.com/faq.html">', a)
a = re.sub(r'<meta property="og:url"[^>]*>', '<meta property="og:url" content="https://azcactusdoctor.com/faq.html">', a)
a = re.sub(r'<meta property="og:title"[^>]*>', '<meta property="og:title" content="FAQ · Spina &amp; Spiritus">', a)
a = re.sub(r"<!-- FAQLD -->.*?<!-- /FAQLD -->\n?", "", a, flags=re.S)
a = a.replace("</head>", "<!-- FAQLD -->" + ld + "<!-- /FAQLD -->\n</head>", 1)
a = re.sub(r'<main class="aboutpage" id="aboutPage">.*?</main>', f'<main class="faqpage" id="faqPage"><div class="wrap narrow"><h1>Frequently asked questions</h1>\n{block(len(FAQS))}\n<p class="center faq-more"><a class="btn" href="index.html#shop">Shop the plants</a></p></div></main>', a, flags=re.S)
(ROOT / "faq.html").write_text(a)
# nav links on every page
for fn in ("index.html", "about.html", "plant.html", "faq.html"):
    t = (ROOT / fn).read_text()
    if 'href="faq.html">FAQ' not in t:
        t = t.replace('    <a class="nl" href="index.html#contact">Contact</a>', '    <a class="nl" href="index.html#contact">Contact</a>\n    <a class="nl" href="faq.html">FAQ</a>', 1)
        t = t.replace('    <a href="index.html#contact">Contact</a>\n  </nav>', '    <a href="index.html#contact">Contact</a>\n    <a href="faq.html">FAQ</a>\n  </nav>', 1)
        t = t.replace('    <a class="nl" href="#contact">Contact</a>', '    <a class="nl" href="faq.html">FAQ</a>\n    <a class="nl" href="#contact">Contact</a>', 1)
    (ROOT / fn).write_text(t)
print("built faq.html and home FAQ with", len(FAQS), "questions")
