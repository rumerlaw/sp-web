# Spina & Spiritus — AZ Cactus Doctor

Static site, no build step. Open via any web server (`python3 -m http.server`) or deploy the folder to Netlify / Vercel / Cloudflare Pages.

## Updating content
- **Inventory:** edit `data/inventory.csv` (columns: sku, name, category, price, status, size, description, image). Status: `In Stock`, `Low Stock`, `Pre-Order`, `Sold Out`. Categories build the left-hand catalog automatically.
- **Live spreadsheet:** in Google Sheets → File → Share → Publish to web → CSV, then paste the link into `inventoryUrl` at the top of `app.js`.
- **Photos/videos:** put files in `assets/photos` / `assets/videos`, then reference them in `CONFIG` (`app.js`) and the `image` column of the sheet.
- **About text / hero video:** edit `index.html` (look for "Placeholder").
- **Contact:** `email` and `instagram` in `CONFIG`.

## Reservation emails (farmers-market pickup, no shipping)
Customers pick plants, enter name/contact/market, and submit. To get each reservation emailed to the Doctor:
1. Create a free form at formspree.io (notifications go to his email) **or** web3forms.com.
2. Paste the endpoint into `orderEndpoint` in `app.js` (and the access key into `web3formsKey` for Web3Forms).
3. Edit `markets` in `app.js` with the real market names/times.
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
