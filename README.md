# Spina & Spiritus — AZ Cactus Doctor

Static site, no build step. Open via any web server (`python3 -m http.server`) or deploy the folder to Netlify / Vercel / Cloudflare Pages.

## Updating content
- **Inventory:** edit `data/inventory.csv` (columns: sku, name, category, price, status, size, description, image). Status: `In Stock`, `Low Stock`, `Pre-Order`, `Sold Out`. Categories build the left-hand catalog automatically.
- **Live spreadsheet:** in Google Sheets → File → Share → Publish to web → CSV, then paste the link into `inventoryUrl` at the top of `app.js`.
- **Photos/videos:** put files in `assets/photos` / `assets/videos`, then reference them in `CONFIG` (`app.js`) and the `image` column of the sheet.
- **About text / hero video:** edit `index.html` (look for "Placeholder").
- **Contact:** `email` and `instagram` in `CONFIG`.
