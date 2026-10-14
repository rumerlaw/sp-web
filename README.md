# Spina & Spiritus — AZ Cactus Doctor

Static site, no build step. Open via any web server (`python3 -m http.server`) or deploy the folder to Netlify / Vercel / Cloudflare Pages.

## Updating content
- **Inventory:** edit `data/inventory.csv` (columns: sku, name, category, price, status, size, description, image, sale_price). Status: `In Stock`, `Low Stock`, `Pre-Order`, `Sold Out`, `Sale` (put the discounted price in `sale_price`; the old price shows struck through). The status shows as a banner across the top of the photo. `image` can hold several photos separated by `|` (e.g. `assets/photos/a.jpg|assets/photos/b.jpg`); the first is the catalog photo and all appear in the tap-to-open quick view. Categories build the left-hand catalog automatically.
- **Live spreadsheet:** in Google Sheets → File → Share → Publish to web → CSV, then paste the link into `inventoryUrl` at the top of `app.js`.
- **Photos:** drop originals in `incoming/`, run `python3 scripts/strip_media.py` (strips metadata and builds fast `web/` and `thumb/` versions), then list them in `CONFIG.collection` (slideshow) or the sheet's `image` column.
- **About text / hero video:** edit `index.html` (look for "Placeholder").
- **Contact:** `email` and `instagram` in `CONFIG`.

## Reservation emails (farmers-market pickup, no shipping)
Customers pick plants, enter name/contact/market, and submit. To get each reservation emailed to the Doctor:
1. Create a free form at formspree.io (notifications go to his email) **or** web3forms.com.
2. Paste the endpoint into `orderEndpoint` in `app.js` (and the access key into `web3formsKey` for Web3Forms).
3. Edit `events` in `app.js` with your real events (name, time, and optionally a `date` like `2026-11-08` so it disappears after that day).
Until an endpoint is set, the form opens a pre-filled email draft instead. Reservations are held, and payment happens in person.

## Stripping metadata from photos/videos
Phone photos carry GPS location, device and timestamps. Never put originals in `assets/`.
1. Drop originals into `incoming/` (git-ignored).
2. `python3 scripts/strip_media.py` → clean copies land in `assets/photos` and `assets/videos`.
3. `python3 scripts/strip_media.py --check` verifies nothing under `assets/` has metadata.

## Security
- Strict Content-Security-Policy (no inline scripts, same-origin only plus fonts/form provider), HSTS, nosniff, frame denial, Referrer/Permissions policies. Headers are set in `_headers` (Netlify/Cloudflare Pages) and `vercel.json` (Vercel). Serve over HTTPS.
- All spreadsheet/user text is HTML-escaped; image URLs from the sheet must be `https://` or `assets/…`.
- Order form: honeypot, input length limits, validation, client throttle; no payment data is collected. If you change the form provider, add its domain to `connect-src` in `index.html`, `_headers` and `vercel.json`.

## SEO
Title/description, canonical, Open Graph/Twitter cards, Store + Product/Offer JSON-LD (pickup-only), robots.txt, sitemap.xml, favicon. **Before launch:** replace `https://azcactusdoctor.com` with the real domain in `index.html`, `robots.txt`, `sitemap.xml`, and add `assets/og-image.jpg` (1200×630, metadata stripped).

## Plant pages
Every row in `data/inventory.csv` automatically gets its own page at `plant.html?id=<sku>` (title, price, description, all photos, quantity + Add to bag, related plants, and Product structured data). Tapping a card on the shop opens a quick view with a "View full details" link; the same links are crawlable by search engines. After adding plants run `python3 scripts/build_sitemap.py https://yourdomain.com` and redeploy so Google finds the new pages.

## Genus, stock and the new-arrivals list
- Spreadsheet columns `genus` and `stock` (a number). Genus shows on the plant page and quick view. Stock shows as "12 available" or "only 2 left", customers can't add more than what's in stock, and stock `0` automatically becomes **Sold out** (3 or fewer shows **Low stock**).
- The footer email box sends each signup to the Doctor as an email using the same form service as orders (or a separate one: set `signupEndpoint` in `app.js`). To email the whole list when new plants arrive, copy the signups into a mailing tool (Mailchimp, Buttondown, MailerLite, etc.), or point `signupEndpoint` at one of those services' form endpoints. Add the service's domain to `connect-src` in `index.html`, `plant.html`, `_headers` and `vercel.json`. Collecting emails means you should have a short privacy note and honor unsubscribe requests.

**Genus is automatic:** if the `genus` column is blank, the site takes it from the first word of a Latin name (e.g. "Echeveria 'Perle'" → Echeveria, "Opuntia microdasys" → Opuntia). For one-word or common names (like "Althea") fill the `genus` column yourself.

## Reserve-and-bring flow
You don't bring every plant to every event, so the whole site is framed as "reserve it and we'll bring it": customers browse your full inventory, reserve, and pick the event they'll attend. Each email you get says "PICKUP EVENT: ..." and "Please bring these to the event" with the plant list, so you can pack from it. Reserving does not change your stock count, so update the `stock` column in the spreadsheet as you confirm reservations.

## FAQ
Edit the questions in `scripts/build_faq.py`, then run `python3 scripts/build_faq.py`. It rebuilds the home-page FAQ section (first 5 questions) and `faq.html` (all of them, with search-engine FAQ data).
