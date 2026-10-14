/* ============================================================
   SPINA & SPIRITUS — site settings. Edit this block as info arrives.
   ============================================================ */
const CONFIG = {
  // Inventory source. Default is the local CSV file.
  // To use the live spreadsheet: in Google Sheets choose
  //   File → Share → Publish to web → pick the sheet → CSV,
  // then paste that link here. Keep the same column headers as data/inventory.csv.
  inventoryUrl: "data/inventory.csv",

  // ORDER NOTIFICATIONS — where reservations are sent (he gets an email for each one).
  // Easiest: create a free form at https://formspree.io (set it to email the Doctor) and paste
  // the endpoint here, e.g. "https://formspree.io/f/abcdwxyz".
  // Or use https://web3forms.com: endpoint "https://api.web3forms.com/submit" + paste its access key below.
  // Leave blank and the form falls back to opening an email draft.
  orderEndpoint: "",
  // Optional: a separate Formspree/Web3Forms form just for the "new arrivals" email signups.
  // If blank, signups go to the orderEndpoint above (or open an email draft).
  signupEndpoint: "",
  web3formsKey: "",

  // Upcoming events / farmers markets. Customers pick one when they reserve, so you know what to bring.
  // `date` (YYYY-MM-DD) is optional: once that day has passed the event disappears automatically.
  events: [
    { name: "Roadrunner Park Farmers Market", where: "3502 E Cactus Rd, Phoenix, AZ 85032", when: "Every Saturday, 8am–12pm", date: "" },
  ],



  email: "email@placeholder.com",
  instagram: "azcactusdoctor",
  instagramUrl: "https://instagram.com/azcactusdoctor",

  // Private collection slideshow — add photos to assets/photos and list them here.
  collection: [
    { image: "assets/photos/private-12.jpg", alt: "Cacti in handmade pots in front of a sun-dappled adobe wall" },
    { image: "assets/photos/private-19.jpg", alt: "Two tall columnar cacti in a large terracotta pot with a mountain view" },
    { image: "assets/photos/private-18.jpg", alt: "Cacti and prickly pear in sculpted pots along a rust-stained wall under an iron fence" },
    { image: "assets/photos/private-21.jpg", alt: "Columnar cacti and a large arching plant on a covered patio" },
    { image: "assets/photos/private-13.jpg", alt: "Prickly pear and columnar cacti in handmade pots on turf" },
    { image: "assets/photos/private-14.jpg", alt: "Prickly pear and columnar cacti beside a rust-stained wall" },
    { image: "assets/photos/private-15.jpg", alt: "Handmade pots including a gargoyle-sculpted planter with cacti" },
    { image: "assets/photos/private-16.jpg", alt: "Row of cacti in sculpted and glazed pots under a wrought-iron fence" },
    { image: "assets/photos/private-20.jpg", alt: "Tall euphorbia in a yellow glazed pot beside a stone wall" },
    { image: "assets/photos/collection-columnar-wide.jpg", alt: "Tall columnar cacti in handmade pots with an Arizona mountain behind" },
    { image: "assets/photos/collection-patio.jpg", alt: "Cacti and euphorbia in sculpted pots on a stone patio beneath a pergola" },
    { image: "assets/photos/collection-table.jpg", alt: "Table full of potted cacti in handmade ceramic pots, seen from above" },
    { image: "assets/photos/pottery-owl-wall.jpg", alt: "Cacti and agave in handmade pots including a turquoise owl planter" },
    { image: "assets/photos/garden-wall-corner.jpg", alt: "Tall euphorbia and columnar cacti in pots against an adobe wall" },
    { image: "assets/photos/lawn-garden-1.jpg", alt: "Columnar cacti, golden barrel and agave in sculpted pots on a lawn" },
    { image: "assets/photos/lawn-garden-2.jpg", alt: "Cacti in sculpted pots on a lawn" },
    { image: "assets/photos/lawn-garden-3.jpg", alt: "Large white pot with agave among cacti in a garden" },
    { image: "assets/photos/collection-pots-row.jpg", alt: "Row of cacti in handmade pots including a turquoise planter" },
  ],

};

/* ============================================================ */
const upcomingEvents = () => { const today = new Date().toISOString().slice(0, 10); return CONFIG.events.filter((ev) => !ev.date || ev.date >= today); };
const eventLabel = (ev) => `${ev.name} — ${ev.when}`;
const $ = (s) => document.querySelector(s);
const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Only allow same-site relative paths or https URLs for images coming from the spreadsheet.
const safeUrl = (u) => { u = String(u || "").trim(); return /^(https:\/\/|assets\/|\.\/assets\/)/i.test(u) && !/[<>"']/.test(u) ? u : ""; };
// Fast-loading variants made by scripts/strip_media.py (assets/photos/web, assets/photos/thumb).
const variant = (src, kind) => { const m = /^(?:\.\/)?assets\/photos\/([^/]+)\.(?:jpe?g|png|webp)$/i.exec(src); return m ? `assets/photos/${kind}/${m[1]}.webp` : src; };
const CACTUS_SVG = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M32 58V14a5 5 0 0 1 10 0v0M32 40h-9a4 4 0 0 1-4-4V26M32 34h9a4 4 0 0 0 4-4V22"/><path d="M22 58h20"/></svg>`;

// ---- "Back to shop" memory: remember scroll + filters when leaving the shop for a plant page ----
const RET_KEY = "sp-return";
const onHome = !document.body.dataset.page;
let pendingRestore = null;
if (onHome) {
  try {
    if (sessionStorage.getItem("sp-restore") === "1") {
      pendingRestore = JSON.parse(sessionStorage.getItem(RET_KEY) || "null");
      sessionStorage.removeItem("sp-restore");
    }
  } catch (e) {}
  if (pendingRestore) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    document.documentElement.style.visibility = "hidden";
    setTimeout(() => { document.documentElement.style.visibility = ""; }, 2500);
  }
}
const saveReturn = () => { try { sessionStorage.setItem(RET_KEY, JSON.stringify({ y: Math.round(window.scrollY), cat: state.cat, q: state.q, avail: state.avail, sort: state.sort })); } catch (e) {} };

let products = [];
const state = { cat: "All", q: "", avail: false, sort: "name" };
let cart = [];
try { cart = JSON.parse(localStorage.getItem("sp-cart") || "[]"); } catch (e) {}

/* ---------- CSV ---------- */
function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); rows.push(row); row = []; cur = "";
    } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const head = rows.shift().map((h) => h.trim().toLowerCase());
  return rows.filter((r) => r.some((x) => x.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
}

// Fills in the genus automatically from a Latin name like "Opuntia microdasys" or "Echeveria 'Perle'" when the sheet's genus column is blank.
const deriveGenus = (name) => { const m = /^([A-Z][a-z]{3,})\s+(?:[a-z×]|\')/.exec(String(name || "").trim()); return m ? m[1] : ""; };

async function loadInventory() {
  try {
    const res = await fetch(CONFIG.inventoryUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    products = parseCSV(await res.text()).map((p, i) => ({
      id: p.sku || "item-" + i,
      name: p.name || "Unnamed plant",
      genus: p.genus || deriveGenus(p.name),
      category: p.category || "Uncategorized",
      price: parseFloat(String(p.price).replace(/[^0-9.]/g, "")) || 0,
      salePrice: parseFloat(String(p.sale_price || "").replace(/[^0-9.]/g, "")) || 0,
      stock: p.stock === undefined || p.stock === "" ? null : Math.max(0, parseInt(p.stock, 10) || 0),
      status: p.status || "In Stock",
      size: p.size || "",
      description: p.description || "",
      images: String(p.image || "").split("|").map(safeUrl).filter(Boolean),
    }));
  } catch (e) {
    products = [];
    const g = $("#productGrid") || $("#plantPage");
    if (g) g.innerHTML = `<p class="empty">Couldn't load the inventory. If you opened this file directly, run a local server (e.g. <code>python3 -m http.server</code>).</p>`;
    return false;
  }
  return true;
}

/* ---------- SHOP ---------- */
const isOut = (p) => /sold/i.test(p.status) || p.stock === 0;
const isSale = (p) => /sale/i.test(p.status) && p.salePrice > 0 && p.salePrice < p.price;
const now = (p) => (isSale(p) ? p.salePrice : p.price);
const noPrice = (p) => now(p) <= 0;
const priceHtml = (p) => (noPrice(p) ? "Ask for price" : isSale(p) ? `<s>${money(p.price)}</s> ${money(p.salePrice)}` : money(p.price));
const banner = (p) => (isOut(p) ? ["out", "Sold out"] : isSale(p) ? ["sale", "Sale"] : isPre(p) ? ["pre", "Pre-order"] : null);
const isPre = (p) => /pre/i.test(p.status);
const isLow = (p) => /low/i.test(p.status) || (p.stock !== null && p.stock > 0 && p.stock <= 3);
const maxQty = (p) => (p.stock === null ? 20 : Math.max(1, Math.min(20, p.stock)));
const stockLine = (p) => (isOut(p) ? "Currently sold out" : (isPre(p) ? "Available for pre-order" : isSale(p) ? "On sale" : "In stock") + (p.stock === null ? "" : ` — ${p.stock} available`));
function addToCart(id, qty) {
  const p = products.find((x) => x.id === id); if (!p) return;
  if (noPrice(p) || isOut(p)) return;
  const row = cart.find((c) => c.id === id);
  if (row) row.qty = Math.min(row.qty + qty, maxQty(p)); else cart.push({ id, qty: Math.min(qty, maxQty(p)) });
  saveCart();
}

function renderCats() {
  const counts = {};
  products.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
  const cats = ["All", ...Object.keys(counts).sort()];
  $("#catList").innerHTML = cats
    .map((c) => `<li><button class="${c === state.cat ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}<small>${c === "All" ? products.length : counts[c]}</small></button></li>`)
    .join("");
}

function renderProducts() {
  let list = products.filter((p) =>
    (state.cat === "All" || p.category === state.cat) &&
    (!state.avail || !isOut(p)) &&
    (!state.q || (p.name + " " + p.genus + " " + p.category + " " + p.description).toLowerCase().includes(state.q))
  );
  const sorts = {
    name: (a, b) => a.name.localeCompare(b.name),
    priceAsc: (a, b) => a.price - b.price,
    priceDesc: (a, b) => b.price - a.price,
  };
  list.sort(sorts[state.sort]);
  $("#productGrid").innerHTML = list.length ? list.map(cardHtml).join("") : `<p class="empty">No plants match your selection.</p>`;
}
const pageUrl = (p) => `plant.html?id=${encodeURIComponent(p.id)}`;
function cardHtml(p) {
  const bn = banner(p), badge = bn ? `<span class="banner ${bn[0]}">${bn[1]}</span>` : "";
  const img = p.images[0] ? `<img src="${esc(variant(p.images[0], "thumb"))}" alt="${esc(p.name)}" loading="lazy">` : `<div class="ph" data-slot="Photo coming soon">${CACTUS_SVG}</div>`;
  return `<article class="card">
    <a class="card-hit" href="${esc(pageUrl(p))}" data-view="${esc(p.id)}" aria-label="${esc(p.name)}, ${esc(money(now(p)))}">
      <span class="thumb">${badge}${img}<span class="peek">Quick view</span></span>
      <span class="body"><span class="name">${esc(p.name)}</span><span class="price">${priceHtml(p)}</span></span>
    </a></article>`;
}

/* ---------- QUICK VIEW ---------- */
let qvProduct = null, qvOpener = null;
function openQuickView(id, opener) {
  const p = products.find((x) => x.id === id); if (!p) return;
  qvProduct = p; qvOpener = opener || null;
  $("#qvTitle").textContent = p.name;
  $("#qvPrice").innerHTML = priceHtml(p);
  $("#qvPage").href = pageUrl(p);
  $("#qvGenus").innerHTML = p.genus ? `Genus <i>${esc(p.genus)}</i>` : "";
  $("#qvDesc").textContent = p.description || "More details coming soon.";
  $("#qvMeta").textContent = stockLine(p);
  const add = $("#qvAdd"); add.disabled = isOut(p) || noPrice(p); add.textContent = isOut(p) ? "Sold out" : noPrice(p) ? "Ask at the market" : isPre(p) ? "Pre-order" : "Reserve this plant";
  const pics = p.images;
  const show = (k) => {
    $("#qvMain").innerHTML = pics[k] ? `<img src="${esc(variant(pics[k], "web"))}" alt="${esc(p.name)} — photo ${k + 1}">` : `<div class="ph" data-slot="Photos coming soon">${CACTUS_SVG}</div>`;
    document.querySelectorAll(".qv-thumbs button").forEach((b, j) => b.classList.toggle("on", j === k));
  };
  $("#qvThumbs").innerHTML = pics.length > 1 ? pics.map((u, k) => `<button data-qvpic="${k}" aria-label="Photo ${k + 1}"><img src="${esc(variant(u, "thumb"))}" alt=""></button>`).join("") : "";
  qvProduct.show = show; show(0);
  $("#qv").classList.add("on"); $("#qv").setAttribute("aria-hidden", "false");
  document.body.classList.add("lock");
  $(".qv").focus();
}
function closeQuickView() {
  $("#qv").classList.remove("on"); $("#qv").setAttribute("aria-hidden", "true");
  document.body.classList.remove("lock");
  if (qvOpener) qvOpener.focus(); qvProduct = null;
}

/* ---------- CART ---------- */
function saveCart() { try { localStorage.setItem("sp-cart", JSON.stringify(cart)); } catch (e) {} renderCart(); }
function renderCart() {
  const items = cart.map((c) => ({ ...c, p: products.find((p) => p.id === c.id) })).filter((c) => c.p);
  const count = items.reduce((s, c) => s + c.qty, 0);
  $("#cartCount").textContent = count; $("#cartCount").classList.toggle("on", count > 0);
  $("#cartItems").innerHTML = items.length
    ? items.map((c) => `<div class="cart-item">
        <h5>${esc(c.p.name)}</h5><span>${money(now(c.p) * c.qty)}</span>
        <div class="qty"><button data-dec="${esc(c.id)}">−</button>${c.qty}<button data-inc="${esc(c.id)}">+</button></div>
        <button class="rm" data-rm="${esc(c.id)}">Remove</button></div>`).join("")
    : `<p class="cart-empty">Your selection is empty.</p>`;
  $("#cartTotal").textContent = money(items.reduce((s, c) => s + now(c.p) * c.qty, 0));
  $("#checkout").disabled = !items.length;
}
function toggleCart(on) {
  $("#cart").classList.toggle("on", on);
  $("#scrim").classList.toggle("on", on);
  $("#cart").setAttribute("aria-hidden", String(!on));
}
function cartLines() {
  return cart.map((c) => ({ ...c, p: products.find((p) => p.id === c.id) })).filter((c) => c.p);
}
async function submitOrder(e) {
  e.preventDefault();
  const form = e.target, msg = $("#formMsg"), btn = $("#checkout");
  const say = (t, bad) => { msg.textContent = t; msg.className = "form-msg" + (bad ? " bad" : " ok"); };
  const items = cartLines();
  if (!items.length) return say("Add at least one plant first.", true);
  const f = new FormData(form);
  if (f.get("website")) return;                      // honeypot: bots fill this in
  const name = String(f.get("name") || "").trim().slice(0, 80);
  const contact = String(f.get("contact") || "").trim().slice(0, 120);
  const market = String(f.get("market") || "");
  if (!market) return say("Please choose which event you'll pick up at.", true);
  const notes = String(f.get("notes") || "").trim().slice(0, 500);
  if (!name || !contact) return say("Please add your name and a phone or email.", true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && contact.replace(/\D/g, "").length < 7) return say("That doesn't look like a phone number or email.", true);
  let last = 0; try { last = +localStorage.getItem("sp-last") || 0; } catch (err) {}
  if (Date.now() - last < 30000) return say("Please wait a moment before sending again.", true);

  const total = money(items.reduce((t, c) => t + now(c.p) * c.qty, 0));
  const lines = items.map((c) => `${c.qty} x ${c.p.name} (${c.p.id}) - ${money(now(c.p) * c.qty)}`).join("\n");
  const summary = `NEW PICKUP RESERVATION\n\nCustomer: ${name}\nContact: ${contact}\nPICKUP EVENT: ${market}\n\nPlease bring these to the event:\n${lines}\n\nTotal: ${total} (pay in person at pickup)\n\nNotes: ${notes || "-"}`;

  if (!CONFIG.orderEndpoint) {                        // fallback until an endpoint is configured
    location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Plant reservation: " + name)}&body=${encodeURIComponent(summary)}`;
    return;
  }
  btn.disabled = true; say("Sending…");
  try {
    const res = await fetch(CONFIG.orderEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: CONFIG.web3formsKey || undefined,
        subject: `Plant reservation: ${name} (${total})`,
        from_name: "Spina & Spiritus website",
        name, contact, email: /@/.test(contact) ? contact : undefined, market, notes, total,
        order: lines, message: summary,
      }),
    });
    if (!res.ok) throw new Error(res.status);
    try { localStorage.setItem("sp-last", String(Date.now())); } catch (err) {}
    cart = []; saveCart(); form.reset();
    say(`Reserved! We'll bring your plants to ${market.split(" — ")[0]} and message you to confirm.`);
  } catch (err) {
    say("Couldn't send that. Please try again or email us directly.", true);
  }
  btn.disabled = !cartLines().length;
}

/* ---------- COLLECTION SLIDESHOW ---------- */
function renderCollection() {
  const slides = CONFIG.collection.filter((c) => safeUrl(c.image));
  const root = $("#collectionGrid");
  if (!slides.length) { root.innerHTML = `<div class="ph slide-empty" data-slot="Collection photos coming soon">${CACTUS_SVG}</div>`; return; }
  const pad = (k) => String(k).padStart(2, "0");
  root.innerHTML = `
    <div class="stage-box"><div class="stage" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Private collection photos">
      ${slides.map((c, i) => {
        const u = safeUrl(c.image), eager = i < 2;
        return `<figure class="slide${i === 0 ? " on" : ""}" aria-hidden="${i !== 0}"><img class="main" ${eager ? `src="${esc(variant(u, "web"))}"` : `data-src="${esc(variant(u, "web"))}"`} alt="${esc(c.alt || "Plant from the private collection")}" decoding="async"></figure>`;
      }).join("")}
      <button class="nav-btn prev" aria-label="Previous photo">‹</button>
      <button class="nav-btn next" aria-label="Next photo">›</button>
    </div></div>
    <div class="s-thumbs">${slides.map((c, i) => `<button class="s-thumb${i === 0 ? " on" : ""}" data-slide="${i}" aria-label="Show photo ${i + 1}"><img src="${esc(variant(safeUrl(c.image), "thumb"))}" alt="" loading="lazy"></button>`).join("")}</div>`;
  initSlider(root, slides.length, pad);
}
function initSlider(root, n, pad) {
  const stage = root.querySelector(".stage"), slidesEl = [...root.querySelectorAll(".slide")], thumbs = [...root.querySelectorAll(".s-thumb")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DELAY = 3500;
  let i = 0, timer = null, playing = !reduce;
  const load = (k) => { const im = slidesEl[(k + n) % n].querySelector(".main"); if (im && im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } };
  // The frame takes the exact shape of the current photo, so there is nothing but the photo.
  const fit = (k) => {
    const im = slidesEl[k].querySelector(".main");
    const apply = () => { if (i === k && im.naturalWidth) stage.style.setProperty("--ar", (im.naturalWidth / im.naturalHeight).toFixed(4)); };
    if (im.complete && im.naturalWidth) apply(); else im.addEventListener("load", apply, { once: true });
  };
  const show = (k) => {
    i = (k + n) % n;
    load(i); load(i + 1); load(i - 1); fit(i);
    slidesEl.forEach((el, j) => { el.classList.toggle("on", j === i); el.setAttribute("aria-hidden", String(j !== i)); });
    thumbs.forEach((el, j) => el.classList.toggle("on", j === i));
    const t = thumbs[i]; if (t && t.parentElement) t.parentElement.scrollTo({ left: t.offsetLeft - t.parentElement.clientWidth / 2 + t.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  };
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => { clearInterval(timer); if (playing) timer = setInterval(() => show(i + 1), DELAY); };
  root.querySelector(".prev").addEventListener("click", () => { show(i - 1); start(); });
  root.querySelector(".next").addEventListener("click", () => { show(i + 1); start(); });
  thumbs.forEach((t) => t.addEventListener("click", () => { show(+t.dataset.slide); start(); }));
  stage.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") { show(i - 1); start(); } if (e.key === "ArrowRight") { show(i + 1); start(); } });
  stage.addEventListener("mouseenter", () => { if (playing) stop(); }); stage.addEventListener("mouseleave", () => { if (playing) start(); });
  let x0 = null;
  stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; if (playing) stop(); }, { passive: true });
  stage.addEventListener("touchend", (e) => { if (x0 !== null) { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); x0 = null; } if (playing) start(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { if (playing) stop(); } else if (playing) start(); });
  fit(0);
  start();
}
/* ---------- EVENTS ---------- */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-qv-close]")) return closeQuickView();
  const planta = e.target.closest('a[href^="plant.html"]');
  if (planta && onHome) saveReturn();
  const t = e.target.closest("button, a");
  if (!t) return;
  if (t.dataset.cat) { state.cat = t.dataset.cat; renderCats(); renderProducts(); $("#filters").classList.remove("on"); }
  else if (t.id === "backShop") { try { if (sessionStorage.getItem(RET_KEY)) sessionStorage.setItem("sp-restore", "1"); } catch (err) {} }
  else if (t.dataset.view && $("#qv")) { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); openQuickView(t.dataset.view, t); }
  else if (t.id === "plantAdd" && plantCurrent) {
    addToCart(plantCurrent.id, Math.max(1, Math.min(maxQty(plantCurrent), parseInt($("#plantQty").value, 10) || 1)));
    toggleCart(true);
  }
  else if (t.dataset.step && $("#plantQty")) { const q = $("#plantQty"); q.value = Math.max(1, Math.min(plantCurrent ? maxQty(plantCurrent) : 20, (parseInt(q.value, 10) || 1) + +t.dataset.step)); }
  else if (t.dataset.qvpic !== undefined && qvProduct) qvProduct.show(+t.dataset.qvpic);
  else if (t.dataset.plantpic !== undefined && plantCurrent) plantCurrent.show(+t.dataset.plantpic);
  else if (t.id === "qvAdd" && qvProduct) {
    addToCart(qvProduct.id, 1);
    const b = $("#qvAdd"); b.textContent = "Added ✓"; setTimeout(() => { if (qvProduct) b.textContent = isPre(qvProduct) ? "Pre-order" : "Reserve this plant"; }, 1400);
    const bag = $("#cartOpen"); bag.classList.remove("pulse"); void bag.offsetWidth; bag.classList.add("pulse");
  }
  else if (t.classList.contains("add")) {
    const row = cart.find((c) => c.id === t.dataset.id);
    row ? row.qty++ : cart.push({ id: t.dataset.id, qty: 1 });
    saveCart(); toggleCart(true);
  }
  else if (t.dataset.inc) addToCart(t.dataset.inc, 1);
  else if (t.dataset.dec) { const r = cart.find((c) => c.id === t.dataset.dec); if (--r.qty <= 0) cart = cart.filter((c) => c !== r); saveCart(); }
  else if (t.dataset.rm) { cart = cart.filter((c) => c.id !== t.dataset.rm); saveCart(); }
  else if (t.id === "cartOpen") toggleCart(true);
  else if (t.id === "cartClose") toggleCart(false);
  else if (t.id === "filtersOpen") $("#filters").classList.add("on");
  else if (t.id === "filtersClose") $("#filters").classList.remove("on");
  else if (t.id === "burger") { const m = $("#mobileMenu"), on = !m.classList.contains("on"); m.classList.toggle("on", on); t.setAttribute("aria-expanded", String(on)); }
  else if (t.closest("#mobileMenu")) { $("#mobileMenu").classList.remove("on"); $("#burger").setAttribute("aria-expanded", "false"); }
});
const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };
on("#orderForm", "submit", submitOrder);
on("#signupForm", "submit", submitSignup);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if ($("#qv") && $("#qv").classList.contains("on")) closeQuickView(); else toggleCart(false); } });
on("#scrim", "click", () => toggleCart(false));
on("#search", "input", (e) => { state.q = e.target.value.toLowerCase().trim(); renderProducts(); });
on("#onlyAvail", "change", (e) => { state.avail = e.target.checked; renderProducts(); });
on("#sort", "change", (e) => { state.sort = e.target.value; renderProducts(); });

/* ---------- NEW-ARRIVALS SIGNUP ---------- */
async function submitSignup(e) {
  e.preventDefault();
  const form = e.target, msg = $("#signupMsg"), btn = form.querySelector("button");
  const say = (t, bad) => { msg.textContent = t; msg.className = "form-msg" + (bad ? " bad" : " ok"); };
  const f = new FormData(form);
  if (f.get("website")) return;
  const email = String(f.get("email") || "").trim().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return say("Please enter a valid email address.", true);
  let last = 0; try { last = +localStorage.getItem("sp-signup") || 0; } catch (err) {}
  if (Date.now() - last < 30000) return say("Please wait a moment before trying again.", true);
  const endpoint = CONFIG.signupEndpoint || CONFIG.orderEndpoint;
  if (!endpoint) { location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Add me to the weekly inventory update list")}&body=${encodeURIComponent("Please email me each week when the inventory is updated.\n\n" + email)}`; return; }
  btn.disabled = true; say("Sending…");
  try {
    const res = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: CONFIG.web3formsKey || undefined, subject: "Weekly inventory email signup: " + email, from_name: "Spina & Spiritus website", email, type: "new-arrivals-signup", message: "Please add " + email + " to the weekly inventory update list." }),
    });
    if (!res.ok) throw new Error(res.status);
    try { localStorage.setItem("sp-signup", String(Date.now())); } catch (err) {}
    form.reset(); say("You're on the list. We'll email you each week when we update the inventory.");
  } catch (err) { say("Couldn't sign you up just now. Please try again.", true); }
  btn.disabled = false;
}

/* ---------- PLANT PAGE ---------- */
let plantCurrent = null;
const setMeta = (sel, attr, val) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
function renderPlantPage() {
  const root = $("#plantPage");
  const id = new URLSearchParams(location.search).get("id");
  const p = products.find((x) => x.id === id);
  if (!p) {
    setMeta('meta[name="robots"]', "content", "noindex");
    root.innerHTML = `<div class="wrap narrow center"><p class="eyebrow">Not found</p><h1 class="plant-title">That plant isn't available</h1><p class="sub">It may have sold or moved. Browse everything currently available.</p><p><a class="btn" id="backShop" href="index.html#shop">Back to the shop</a></p></div>`;
    return;
  }
  plantCurrent = p;
  const url = `https://azcactusdoctor.com/plant.html?id=${encodeURIComponent(p.id)}`;
  const desc = (p.description && !/^placeholder/i.test(p.description) ? p.description : `${p.name} — ${p.category}. Reserve online and we'll bring it to your next Arizona farmers market.`).slice(0, 300);
  document.title = `${p.name} · Spina & Spiritus`;
  setMeta('meta[name="description"]', "content", desc);
  setMeta('link[rel="canonical"]', "href", url);
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('meta[property="og:title"]', "content", `${p.name} · Spina & Spiritus`);
  setMeta('meta[property="og:description"]', "content", desc);
  const pics = p.images, bn = banner(p);
  const related = [...products.filter((x) => x.id !== p.id && x.category === p.category), ...products.filter((x) => x.id !== p.id && x.category !== p.category)].slice(0, 4);
  root.innerHTML = `<div class="wrap-wide">
    <a class="back" id="backShop" href="index.html#shop">← Back to shop</a>
    <div class="plant-grid">
      <div class="plant-media">
        <div class="plant-main" id="plantMain"></div>
        <div class="plant-thumbs" id="plantThumbs"></div>
      </div>
      <div class="plant-info">
        <h1 class="plant-title">${esc(p.name)}</h1>
        ${p.genus ? `<p class="genus">Genus <i>${esc(p.genus)}</i></p>` : ""}
        ${bn ? `<span class="status ${bn[0]}">${bn[1]}</span>` : ""}
        <p class="plant-price">${priceHtml(p)}</p>
        <p class="plant-desc">${esc(p.description || "More details coming soon.")}</p>
        <dl class="specs">
          <div><dt>Availability</dt><dd>${esc(stockLine(p))}</dd></div>
          ${p.genus ? `<div><dt>Genus</dt><dd><i>${esc(p.genus)}</i></dd></div>` : ""}
          ${p.size ? `<div><dt>Size</dt><dd>${esc(p.size)}</dd></div>` : ""}
          <div><dt>Pickup</dt><dd>At our events only — no shipping</dd></div>
        </dl>
        <div class="buy">
          <div class="qty-box"><button type="button" data-step="-1" aria-label="Less">−</button><input id="plantQty" value="1" inputmode="numeric" aria-label="Quantity" max="${maxQty(p)}"><button type="button" data-step="1" aria-label="More">+</button></div>
          <button class="btn" id="plantAdd" ${isOut(p) || noPrice(p) ? "disabled" : ""}>${isOut(p) ? "Sold out" : noPrice(p) ? "Ask at the market" : isPre(p) ? "Pre-order" : "Reserve this plant"}</button>
        </div>
        <p class="fine">Not every plant comes to every event. Reserve it, pick the event you'll attend, and we'll bring it. Pay in person at pickup.</p>
      </div>
    </div>
    ${related.length ? `<section class="related"><h2>You may also like</h2><div class="product-grid">${related.map(cardHtml).join("")}</div></section>` : ""}
  </div>`;
  const show = (k) => {
    $("#plantMain").innerHTML = (bn ? `<span class="banner ${bn[0]}">${bn[1]}</span>` : "") + (pics[k] ? `<img src="${esc(variant(pics[k], "web"))}" alt="${esc(p.name)} — photo ${k + 1}">` : `<div class="ph" data-slot="Photos coming soon">${CACTUS_SVG}</div>`);
    document.querySelectorAll("#plantThumbs button").forEach((b, j) => b.classList.toggle("on", j === k));
  };
  $("#plantThumbs").innerHTML = pics.length > 1 ? pics.map((u, k) => `<button data-plantpic="${k}" aria-label="Photo ${k + 1}"><img src="${esc(variant(u, "thumb"))}" alt=""></button>`).join("") : "";
  plantCurrent.show = show; show(0);
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.id, category: p.category, description: desc,
    ...(p.genus ? { additionalProperty: [{ "@type": "PropertyValue", name: "Genus", value: p.genus }] } : {}),
    ...(pics[0] ? { image: pics.map((u) => new URL(u, location.href).href) } : {}),
    brand: { "@type": "Brand", name: "Spina & Spiritus" },
    ...(noPrice(p) ? {} : { offers: { "@type": "Offer", url, price: now(p), priceCurrency: "USD", itemCondition: "https://schema.org/NewCondition", availableDeliveryMethod: "https://schema.org/OnSitePickup",
      availability: isOut(p) ? "https://schema.org/OutOfStock" : isPre(p) ? "https://schema.org/PreOrder" : "https://schema.org/InStock" } }),
  });
  document.head.appendChild(ld);
}

/* ---------- INIT ---------- */
$("#year").textContent = new Date().getFullYear();
if ($("#contactEmail")) {
  $("#contactEmail").textContent = CONFIG.email;
  $("#contactEmail").href = "mailto:" + CONFIG.email;
  $("#contactInsta").href = CONFIG.instagramUrl;
  const ev = upcomingEvents();
  $("#marketList").innerHTML = ev.length ? ev.map((e) => `<li><b>${esc(e.name)}</b>${e.where ? `<span>${esc(e.where)}</span>` : ""}<span>${esc(e.when)}</span></li>`).join("") : `<li><span>New dates will be posted soon.</span></li>`;
}
$("#marketSelect").innerHTML = `<option value="">Choose an event…</option>` + upcomingEvents().map((e) => `<option>${esc(eventLabel(e))}</option>`).join("");
if ($("#collectionGrid")) renderCollection();
renderCart();
function addProductSchema() {
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem", position: i + 1, url: new URL(pageUrl(p), location.href).href,
      item: {
        "@type": "Product", name: p.name, sku: p.id, category: p.category,
        description: p.description || p.name,
        ...(p.images[0] ? { image: new URL(p.images[0], location.href).href } : {}),
        brand: { "@type": "Brand", name: "Spina & Spiritus" },
        offers: { "@type": "Offer", price: now(p), priceCurrency: "USD", availableDeliveryMethod: "https://schema.org/OnSitePickup",
          availability: isOut(p) ? "https://schema.org/OutOfStock" : isPre(p) ? "https://schema.org/PreOrder" : "https://schema.org/InStock" },
      },
    })),
  });
  document.head.appendChild(el);
}
loadInventory().then((ok) => {
  if (!ok) return;
  renderCart();
  if (document.body.dataset.page === "plant") renderPlantPage();
  else if ($("#productGrid")) {
    if (pendingRestore) {
      Object.assign(state, { cat: pendingRestore.cat || "All", q: pendingRestore.q || "", avail: !!pendingRestore.avail, sort: pendingRestore.sort || "name" });
      if ($("#search")) $("#search").value = state.q;
      if ($("#onlyAvail")) $("#onlyAvail").checked = state.avail;
      if ($("#sort")) $("#sort").value = state.sort;
    }
    renderCats(); renderProducts(); addProductSchema();
    if (pendingRestore) requestAnimationFrame(() => { window.scrollTo({ top: pendingRestore.y, behavior: "instant" }); document.documentElement.style.visibility = ""; });
  }
});
