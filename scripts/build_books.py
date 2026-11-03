#!/usr/bin/env python3
"""Build the book cards on the home page and one detail page per book (books/<slug>.html) from data/books.json.

The home page shows short cards (cover, title, price, one-line intro). Everything long (description, what's inside, reviews,
award, page count, ISBN) lives on the book's own page. Prices come from data/site.json ("books"), so a price is changed in one place.
Run after build_plants.py (it copies that script's asset version stamps):  python3 scripts/build_books.py [https://your-domain]
"""
import html, json, re, sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = (sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "https://spinanspiritus.com").rstrip("/")
esc = lambda s: html.escape(str(s if s is not None else ""), quote=True)
books = json.loads((ROOT / "data/books.json").read_text(encoding="utf-8"))
site = json.loads((ROOT / "data/site.json").read_text(encoding="utf-8"))
price_of = {b["id"]: b.get("price") for b in site.get("books", [])}
money = lambda v: ("$%.2f" % float(v)) if v is not None else ""


def meta_parts(meta):
    pages = lang = date = isbn = ""
    for m in meta:
        if m.endswith("pages"): pages = re.sub(r"\D", "", m)
        elif m.startswith("ISBN"): isbn = m.replace("ISBN", "").strip()
        elif m.startswith("Published"):
            try: date = datetime.strptime(m.replace("Published", "").strip(), "%b %d, %Y").date().isoformat()
            except Exception: date = ""
        else: lang = m
    return pages, lang, date, isbn


def stamps():
    s = (ROOT / "index.html").read_text(encoding="utf-8")
    return {n: (re.search(re.escape(n) + r"\?v=([0-9a-f]+)", s) or [None, ""])[1] for n in ("app.js", "styles.css", "early.js")}


def inside(b):
    return "".join(f"<li>{x}</li>" for x in b["inside"])


def quotes(b):
    return "".join(f'<blockquote class="book-quote">&ldquo;{esc(q["text"].strip(chr(8220) + chr(8221) + chr(34)))}&rdquo;<cite>{esc(q["cite"])}</cite></blockquote>' for q in b.get("quotes", []))


def detail(b, h1, tag_id=""):
    price = price_of.get(b["id"])
    meta = "".join(f"<span>{esc(m)}</span>" for m in b["meta"])
    award = f'<p class="book-award"><span>{esc(b["award_tag"])}</span> {esc(b["award_text"])}</p>' if b.get("award_tag") else ""
    st = b.get("subtitle", "") if b.get("subtitle", "") not in b["title"] else ""
    sub = f'<p class="book-by">{esc(st)}{" &middot; " if st else ""}By {esc(b["authors"])}</p>' if "authors" in b else f'<p class="book-by">{esc(b.get("note", ""))}</p>'
    aud = f'<p class="book-for">{b["audience"]}</p>' if b.get("audience") else ""
    heading = f'<h{h1} class="book-title">{esc(b["title"])}</h{h1}>'
    return f'''
    <article class="book"{f' id="{tag_id}"' if tag_id else ""}>
      <div class="book-gallery">
        <img class="book-main" src="{esc(b["front"])}" width="311" height="466" alt="{esc(b["front_alt"])}">
        <div class="book-thumbs" role="group" aria-label="Book photos">
          <button type="button" class="on" data-src="{esc(b["front"])}" data-alt="{esc(b["front_alt"])}" aria-label="Show front cover"><img src="{esc(b["front"].replace(".webp", "-thumb.webp"))}" width="240" height="360" alt=""></button>
          <button type="button" data-src="{esc(b["back"])}" data-alt="{esc(b["back_alt"])}" aria-label="Show back cover"><img src="{esc(b["back"].replace(".webp", "-thumb.webp"))}" width="240" height="360" alt=""></button>
        </div>
      </div>
      <div class="book-info">
        {heading}
        {sub}
        {award}
        <p class="book-lead">{b["lead"]}</p>
        <p class="book-price" data-book-price="{esc(b["id"])}"><b>{money(price)}</b> <span>Ships for a flat fee, or pick it up at an event</span></p>
        <h4>{esc(b.get("inside_heading", "What's inside"))}</h4>
        <ul class="book-list">{inside(b)}</ul>
        {quotes(b)}
        {aud}
        <p class="book-meta">{meta}</p>
        <p class="book-cta"><button type="button" class="btn" data-add-spirit="{esc(b["id"])}">Add to cart</button></p>
      </div>
    </article>'''


def page(b):
    pages, lang, date, isbn = meta_parts(b["meta"])
    url = f"{SITE}/books/{b['slug']}.html"
    full = b["title"] + (": " + b["subtitle"] if b.get("subtitle") and b["subtitle"] not in b["title"] else "")
    title = f"{full} by {b['authors']} | Spina & Spiritus"
    ld = {"@context": "https://schema.org", "@type": "Book", "name": full, "url": url, "image": f"{SITE}/{b['front']}",
          "author": [{"@type": "Person", "name": n.strip()} for n in re.split(r"\s*&\s*", b["authors"])], "description": b["desc"],
          "bookFormat": "https://schema.org/Paperback", "publisher": {"@type": "Organization", "name": "Spina & Spiritus"}}
    if pages: ld["numberOfPages"] = int(pages)
    if lang: ld["inLanguage"] = lang
    if date: ld["datePublished"] = date
    if isbn: ld["isbn"] = isbn
    p = price_of.get(b["id"])
    if p: ld["offers"] = {"@type": "Offer", "price": "%.2f" % float(p), "priceCurrency": "USD", "availability": "https://schema.org/InStock", "url": url, "seller": {"@type": "Organization", "name": "Spina & Spiritus"}}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": "Books", "item": SITE + "/?realm=spiritus#book"},
        {"@type": "ListItem", "position": 3, "name": b["title"], "item": url}]}
    body = detail(b, 1)
    if b.get("edition"):
        e = b["edition"]
        body += f'\n    <h2 class="book-edition-head" id="spanish-edition">Also in Spanish</h2>' + detail({**e, "authors": b["authors"], "subtitle": "Spanish edition", "audience": "", "award_tag": "", "award_text": ""}, 3, "spanish")
    main = f'''<main class="bookpage" id="book"><div class="wrap">
  <p class="crumbs"><a href="index.html?realm=spiritus">Spiritus</a> &rsaquo; <a href="index.html?realm=spiritus#book">Books</a> &rsaquo; {esc(b["title"])}</p>{body}
  <p class="book-back"><a class="btn ghost" href="index.html?realm=spiritus#book">&larr; All books</a></p>
</div></main>'''
    s = (ROOT / "thanks.html").read_text(encoding="utf-8")
    st = stamps()
    for n, v in st.items():
        if v: s = re.sub(re.escape(n) + r"\?v=[0-9a-f]+", f"{n}?v={v}", s)
    s = s.replace("<head>\n", '<head>\n<base href="/">\n', 1)
    s = re.sub(r"<title>.*?</title>", f"<title>{esc(title)}</title>", s, count=1, flags=re.S)
    s = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(b["desc"])}">', s, count=1)
    s = s.replace('<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="index, follow, max-image-preview:large">')
    s = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', s, count=1)
    s = s.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="book">')
    s = re.sub(r'(<meta property="og:title" content=")[^"]*', r"\g<1>" + esc(title), s, count=1)
    s = re.sub(r'(<meta property="og:description" content=")[^"]*', r"\g<1>" + esc(b["desc"]), s, count=1)
    s = re.sub(r'(<meta property="og:url" content=")[^"]*', r"\g<1>" + url, s, count=1)
    s = re.sub(r'(<meta property="og:image" content=")[^"]*', r"\g<1>" + f"{SITE}/{b['front']}", s, count=1)
    s = re.sub(r'(<meta property="og:image:alt" content=")[^"]*', r"\g<1>" + esc(b["front_alt"]), s, count=1)
    s = re.sub(r'(<meta name="twitter:title" content=")[^"]*', r"\g<1>" + esc(title), s, count=1)
    s = re.sub(r'(<meta name="twitter:description" content=")[^"]*', r"\g<1>" + esc(b["desc"]), s, count=1)
    s = re.sub(r'(<meta name="twitter:image" content=")[^"]*', r"\g<1>" + f"{SITE}/{b['front']}", s, count=1)
    s = s.replace("<!-- FAQLD --><!-- /FAQLD -->", f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n<script type="application/ld+json">{json.dumps(crumbs, ensure_ascii=False)}</script>')
    s = s.replace('<body data-page="thanks">', '<body data-page="book">')
    s = s.replace('<a class="skip" href="#faqPage">Skip to content</a>', '<a class="skip" href="books/%s.html#book">Skip to content</a>' % b["slug"])
    i = s.index('<main class="faqpage"'); j = s.index("</main>", i) + len("</main>")
    s = s[:i] + main + s[j:]
    return s


def cards():
    out = []
    for b in books:
        url = f"books/{b['slug']}.html"
        full = b["title"]
        es = f'<p class="bcard-es"><a href="{url}#spanish">Also in Spanish &rarr;</a></p>' if b.get("edition") else ""
        out.append(f'''
      <article class="bcard">
        <a class="bcard-cover" href="{url}" aria-label="{esc(full)}, details"><img src="{esc(b["front"])}" width="311" height="466" loading="lazy" alt="{esc(b["front_alt"])}"></a>
        <div class="bcard-body">
          <p class="bcard-chip">{esc(b.get("chip", ""))}</p>
          <h3 class="bcard-title"><a href="{url}">{esc(full)}</a></h3>
          <p class="bcard-by">By {esc(b["authors"])}</p>
          <p class="bcard-short">{esc(b["short"])}</p>{es}
          <p class="bcard-foot"><span class="bcard-price" data-book-price="{esc(b["id"])}">{money(price_of.get(b["id"]))}</span><button type="button" class="btn" data-add-spirit="{esc(b["id"])}">Add to cart</button></p>
          <a class="bcard-more" href="{url}">View details &rarr;</a>
        </div>
      </article>''')
    return "".join(out)


def reviews_section(s):
    """A row of short real quotes (data/site.json -> reviews.spiritus / reviews.spina). A side with no quotes shows nothing."""
    rv = site.get("reviews") or {}
    def block(key, extra):
        items = rv.get(key) or []
        if not items: return ""
        cards = "".join(f'<figure class="rcard"><blockquote>&ldquo;{esc(i["quote"])}&rdquo;</blockquote><figcaption><b>{esc(i["who"])}</b><span>{esc(i.get("what", ""))}</span>' + (f'<em>On {esc(i["about"])}</em>' if i.get("about") else "") + '</figcaption></figure>' for i in items)
        return f'<div class="reviews-row {extra}">{cards}</div>'
    inner = block("spiritus", "reviews-spirit") + block("spina", "reviews-spina")
    sec = ('<!-- REVIEWS:START (built by scripts/build_books.py) -->\n<section class="section reviews" id="reviews">\n  <div class="wrap">\n    <p class="eyebrow center">Kind words</p>\n    <h2 class="center">What readers are saying</h2>\n    ' + inner + '\n  </div>\n</section>\n<!-- REVIEWS:END -->\n\n') if inner else ""
    s = re.sub(r"<!-- REVIEWS:START.*?<!-- REVIEWS:END -->\s*", "", s, flags=re.S)
    if sec: s = s.replace("<!-- FOLLOW -->", sec + "<!-- FOLLOW -->", 1)
    return s


def main():
    (ROOT / "books").mkdir(exist_ok=True)
    for b in books:
        (ROOT / "books" / f"{b['slug']}.html").write_text(page(b), encoding="utf-8")
    idx = ROOT / "index.html"
    s = idx.read_text(encoding="utf-8")
    s = reviews_section(s)
    sec = f'''<section class="section spirit-only" id="book">
  <!-- BOOKS:START (built by scripts/build_books.py from data/books.json) -->
  <div class="wrap">
    <div class="section-head center"><p class="eyebrow">The books</p><h2>Books by Don Rumer-Rivera</h2><p class="sub">Mediumship, affirmations, mindfulness and a paranormal mystery</p></div>
    <div class="bcards">{cards()}
    </div>
  </div>
  <!-- BOOKS:END -->
</section>'''
    if "<!-- BOOKS:START" in s:
        s = re.sub(r'<section class="section spirit-only" id="book">.*?<!-- BOOKS:END -->\s*</section>', lambda m: sec, s, count=1, flags=re.S)
    else:
        i = s.index('<section class="section spirit-only" id="book">'); j = s.index("</section>", i) + len("</section>")
        s = s[:i] + sec + s[j:]
    idx.write_text(s, encoding="utf-8")
    print(f"books: {len(books)} pages built, home cards updated")


main()
