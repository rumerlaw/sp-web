/* Spina & Spiritus — order + signup mailer (Cloudflare Worker).
 *
 * The site is static; this Worker only answers /api/order and /api/signup. Everything else is served straight from the
 * static files. It sends the emails through Resend, so the API key stays on the server (a Cloudflare secret), never in the page.
 *
 * Secrets / settings (Cloudflare dashboard → Workers & Pages → sp-web → Settings → Variables and Secrets):
 *   RESEND_API_KEY       (secret)  required. Resend → API Keys → "Sending access".
 *   RESEND_AUDIENCE_ID   (optional) Resend → Audiences. Weekly-list signups are added there so you can email them from Resend.
 * Plain settings live in wrangler.jsonc: OWNER_EMAIL, FROM_EMAIL.
 *
 * Safety: same-site requests only, small bodies, strict validation, the prices/names/total come from the site's own inventory
 * file (never from the browser), basic per-visitor rate limiting, all user text is escaped in the HTML email.
 */

const DEFAULT_ORIGINS = ["https://spinanspiritus.com", "https://www.spinanspiritus.com", "https://sp-web.123workerdev.workers.dev"];
const MAX_BODY = 10000;
const hits = new Map();   // per-visitor counters (per Worker instance; Cloudflare's own rate-limit rule is the backstop)

const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => "$" + (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 120;

function limited(ip, kind, max, windowMs) {
  const now = Date.now(), key = kind + ":" + ip;
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return true; }
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return false;
}

function parseCsv(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c !== "\r") cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const head = (rows.shift() || []).map((h) => h.trim());
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

async function readAsset(env, request, path) {
  const res = await env.ASSETS.fetch(new Request(new URL(path, request.url).toString()));
  if (!res.ok) throw new Error("asset " + path + " " + res.status);
  return res;
}

async function resend(env, path, payload) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch((env.RESEND_API_URL || "https://api.resend.com") + path, {
      method: "POST", signal: ctl.signal,
      headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return r.ok;
  } catch (e) { return false; } finally { clearTimeout(timer); }
}

const shell = (title, inner) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#24231f"><h2 style="margin:0 0 14px;font-size:20px">${esc(title)}</h2>${inner}</div>`;
const block = (label, html) => `<p style="margin:16px 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#a07d3c;font-weight:bold">${esc(label)}</p><div style="font-size:15px;line-height:1.5">${html}</div>`;

async function handleOrder(request, env, body) {
  if (clean(body.website, 50)) return json({ ok: true, copy: false });                 // honeypot: pretend success to bots
  const name = clean(body.name, 80), contact = clean(body.contact, 120), notes = clean(body.notes, 500), market = clean(body.market, 220);
  if (!name || !contact) return json({ error: "Please add your name and a phone or email." }, 400);
  const email = isEmail(contact) ? contact : "";
  if (!email && contact.replace(/\D/g, "").length < 7) return json({ error: "That doesn't look like a phone number or email." }, 400);
  if (!market) return json({ error: "Please choose which event you'll pick up at." }, 400);
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 25) return json({ error: "Your selection is empty." }, 400);

  // Prices, names and stock come from our own inventory file, not from the visitor.
  let inv;
  try { inv = parseCsv(await (await readAsset(env, request, "/data/inventory.csv")).text()); } catch (e) { return json({ error: "unavailable" }, 503); }
  const bySku = new Map(inv.map((r) => [r.sku, r]));
  const seen = new Set(), lines = []; let total = 0;
  for (const it of body.items) {
    const id = clean(it && it.id, 100), qty = Math.floor(Number(it && it.qty));
    if (!id || seen.has(id) || !(qty >= 1 && qty <= 20)) return json({ error: "Something in your selection looks off. Please refresh and try again." }, 400);
    seen.add(id);
    const p = bySku.get(id); const stock = p && String(p.stock).trim() !== "" ? Number(p.stock) : null;
    const price = p ? (/sale/i.test(p.status) && Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.price) ? Number(p.sale_price) : Number(p.price)) : 0;
    if (!p || /sold/i.test(p.status) || stock === 0 || !(price > 0)) return json({ error: `${p ? p.name : "A plant"} isn't available right now. Please refresh the page.` }, 409);
    if (stock !== null && qty > stock) return json({ error: `We only have ${stock} of ${p.name}.` }, 409);
    lines.push({ name: p.name, qty, sub: price * qty }); total += price * qty;
  }
  // The pickup event must be one we actually list.
  try {
    const site = await (await readAsset(env, request, "/data/site.json")).json();
    const names = (site.events || []).map((e) => String(e.name || "").toLowerCase()).filter(Boolean);
    if (names.length && !names.some((n) => market.toLowerCase().includes(n))) return json({ error: "Please choose one of the listed events." }, 400);
  } catch (e) { /* if the file can't be read, skip this check */ }

  const plantsText = lines.map((l) => `${l.qty} x ${l.name} - ${money(l.sub)}`).join("\n");
  const plantsHtml = lines.map((l) => `<div>${esc(l.qty)} × <b>${esc(l.name)}</b> — ${esc(money(l.sub))}</div>`).join("");
  const totalTxt = money(total);

  const ownerText = `NEW PLANT RESERVATION\n\n1. PLANTS\n${plantsText}\n\n2. PICKUP EVENT\n${market}\n\n3. NAME\n${name}\n\n4. PHONE OR EMAIL\n${contact}\n\n5. TOTAL (pay at pickup)\n${totalTxt}\n\n6. NOTES\n${notes || "-"}\n`;
  const ownerHtml = shell("New plant reservation", block("1. Plants", plantsHtml) + block("2. Pickup event", esc(market)) + block("3. Name", esc(name)) + block("4. Phone or email", esc(contact)) + block("5. Total (pay at pickup)", `<b>${esc(totalTxt)}</b>`) + block("6. Notes", esc(notes || "-")));
  const okOwner = await resend(env, "/emails", { from: env.FROM_EMAIL, to: [env.OWNER_EMAIL], ...(email ? { reply_to: email } : {}), subject: `Plant reservation: ${name} (${totalTxt})`, text: ownerText, html: ownerHtml });
  if (!okOwner) return json({ error: "send_failed" }, 502);

  let copy = false;
  if (email) {
    const text = `Hi ${name},\n\nThanks! We got your plant reservation.\n\nPLANTS\n${plantsText}\n\nPICKUP EVENT\n${market}\n\nTOTAL (pay in person at pickup)\n${totalTxt}\n\nNo payment is taken online and nothing ships. We'll message you to confirm. Questions? Just reply to this email.\n\n— Spina & Spiritus (AZ Cactus Doctor)`;
    const html = shell("Reservation received", `<p style="font-size:15px;line-height:1.5">Hi ${esc(name)}, thanks! We got your plant reservation and we'll message you to confirm.</p>` + block("Your plants", plantsHtml) + block("Pickup event", esc(market)) + block("Total (pay in person at pickup)", `<b>${esc(totalTxt)}</b>`) + `<p style="margin-top:20px;font-size:13px;color:#5d594e">No payment is taken online and nothing ships. Questions? Just reply to this email.<br>— Spina &amp; Spiritus (AZ Cactus Doctor)</p>`);
    copy = await resend(env, "/emails", { from: env.FROM_EMAIL, to: [email], reply_to: env.OWNER_EMAIL, subject: "We got your plant reservation — Spina & Spiritus", text, html });
  }
  return json({ ok: true, copy });
}

async function handleSignup(request, env, body) {
  if (clean(body.website, 50)) return json({ ok: true });
  const email = clean(body.email, 120).toLowerCase();
  if (!isEmail(email)) return json({ error: "Please enter a valid email address." }, 400);
  let stored = false;
  if (env.RESEND_AUDIENCE_ID) stored = await resend(env, `/audiences/${encodeURIComponent(env.RESEND_AUDIENCE_ID)}/contacts`, { email, unsubscribed: false });
  const told = await resend(env, "/emails", { from: env.FROM_EMAIL, to: [env.OWNER_EMAIL], subject: "New weekly-list signup: " + email, text: `New weekly inventory email signup:\n\n${email}\n${stored ? "\n(Added to your Resend audience.)" : ""}`, html: shell("New weekly-list signup", `<p style="font-size:16px"><b>${esc(email)}</b></p>${stored ? "<p>Added to your Resend audience.</p>" : ""}`) });
  if (!stored && !told) return json({ error: "send_failed" }, 502);
  // Welcome email to the new subscriber (a bonus: if it fails the signup still counts).
  await resend(env, "/emails", { from: env.FROM_EMAIL, to: [email], reply_to: env.OWNER_EMAIL, subject: "You're on the Spina & Spiritus list",
    text: "Welcome! You're on the Spina & Spiritus list.\n\nEvery Monday we'll email you the new plants and any upcoming markets and events. We never spam, and every email has an unsubscribe link.\n\nSee what's in stock: https://spinanspiritus.com/shop.html\n\n— Spina & Spiritus (AZ Cactus Doctor)",
    html: shell("You're on the list", `<p style="font-size:15px;line-height:1.5">Welcome! Every <b>Monday</b> we'll email you the new plants and any upcoming markets and events. We never spam, and every email has an unsubscribe link.</p><p style="margin-top:18px"><a href="https://spinanspiritus.com/shop.html" style="display:inline-block;background:#2f4a2c;color:#fff;text-decoration:none;padding:12px 22px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold">See what's in stock</a></p><p style="margin-top:18px;font-size:13px;color:#5d594e">— Spina &amp; Spiritus (AZ Cactus Doctor)</p>`) });
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // The site's pages are served at their real file names (shop.html, plants/kesey.html ...) so every address, link, canonical tag and
    // sitemap entry matches exactly. The only thing the Worker adds for pages is the home address "/", which shows index.html.
    if (url.pathname === "/") return env.ASSETS.fetch(new Request(new URL("/index.html", request.url).toString(), request));
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const route = url.pathname === "/api/order" ? handleOrder : url.pathname === "/api/signup" ? handleSignup : null;
    if (!route) return json({ error: "not_found" }, 404);
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !env.OWNER_EMAIL) return json({ error: "not_configured" }, 503);

    const allowed = (env.ALLOWED_ORIGINS ? String(env.ALLOWED_ORIGINS).split(",").map((s) => s.trim()) : DEFAULT_ORIGINS);
    const origin = request.headers.get("Origin") || "";
    if (!allowed.includes(origin)) return json({ error: "forbidden" }, 403);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (limited(ip, url.pathname, url.pathname === "/api/order" ? 8 : 6, 10 * 60 * 1000)) return json({ error: "Please wait a few minutes before sending again." }, 429);

    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);
    let body; try { body = JSON.parse(raw); } catch (e) { return json({ error: "bad_request" }, 400); }
    if (!body || typeof body !== "object") return json({ error: "bad_request" }, 400);
    return route(request, env, body);
  },
};
