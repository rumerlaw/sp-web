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
Title/description, canonical, Open Graph/Twitter cards, Store + Product/Offer JSON-LD (pickup-only), robots.txt, sitemap.xml, favicon. **Before launch:** replace `https://spinanspiritus.com` with the real domain in `index.html`, `robots.txt`, `sitemap.xml`, and add `assets/og-image.jpg` (1200×630, metadata stripped).

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

## Dropbox inventory sync (automatic)
`scripts/sync_inventory.py` + `.github/workflows/sync-inventory.yml` rebuild `data/inventory.csv` every 30 minutes from your Dropbox Excel file. It reads ONLY the columns **Name**, **Genus/Type**, **Sell Price** and **In Stock**; every other column in the spreadsheet is ignored and never published.
- Plants are matched to `data/extras.csv` by name for things the sheet doesn't have (photos, description, category, size, sale price, a fixed sku). New plants get a link id made from their name.
- Stock: a number, or "No"/0 for sold out. Blank price shows "Ask for price".
- Setup (once): GitHub repo → Settings → Secrets and variables → Actions → add secret `DROPBOX_INVENTORY_URL` (the Dropbox share link), and optional variables `SITE_URL` (e.g. https://yourdomain.com) and `SHEET_NAME`. Connect the repo to Cloudflare Pages so every commit redeploys the site. Scheduled workflows only run on the repo's default branch.
- Test locally: `python3 scripts/sync_inventory.py --file copy-of-sheet.xlsx --dry`

## Photos and descriptions from Dropbox (automatic)
- **Photos:** put them in a Dropbox folder (share link stored as GitHub secret `DROPBOX_PHOTOS_URL`). Name each file after the plant as it's written in the spreadsheet: `Opuntia microdasys.jpg`, extra photos `Opuntia microdasys 2.jpg`, `... 3.jpg`. `scripts/sync_photos.py` strips all hidden data (GPS, camera), fixes rotation, makes fast web versions and attaches them to the matching plant. Photos that match no plant are listed in the job log. Plants listed twice in the sheet share the same photos.
- **Descriptions:** a plant gets (1) the text in `data/extras.csv` if you wrote one, else (2) the genus text in `data/genus_descriptions.csv` (add genera there any time), else (3) optionally a one-sentence AI description if you add a secret `ANTHROPIC_API_KEY` (cached in `data/descriptions_cache.json`, so each plant is only written once; only the plant name and genus are sent).

## Changing text, photos and products
The visual editor has been removed (it needed a GitHub sign-in key, which is a security risk). To change something:
- **Plants, prices, stock:** edit the Dropbox spreadsheet. The site updates itself every 30 minutes.
- **Plant photos:** put them in the Dropbox photo folder, named after the plant (see above).
- **Text, About story, FAQ, events, contact details:** these live in `data/site.json`. Edit that file on GitHub (pencil icon) or ask Claude to change it.

## Orders and signup emails (Cloudflare Worker + Resend)
`worker.js` answers `/api/order` and `/api/signup`. It re-checks every order against `data/inventory.csv` (names, prices, stock come from the site, never the browser), then emails the order to the owner and a copy to the customer through Resend. Weekly-list signups are emailed to the owner and, if `RESEND_AUDIENCE_ID` is set, added to a Resend audience for weekly emails.
- Setup: Resend account, verify the domain `spinanspiritus.com` (add the records Resend shows to Cloudflare DNS), create an API key, then in Cloudflare (Workers & Pages, sp-web, Settings, Variables and Secrets) add the **secret** `RESEND_API_KEY`. Optional: secret/variable `RESEND_AUDIENCE_ID`.
- Until the key exists the Worker answers 503 and the site falls back to the Formspree forms, so orders are never lost.
- `wrangler.jsonc` serves pages at their real file names (`html_handling: none`) and shows `index.html` at `/`.
