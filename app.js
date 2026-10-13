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
  web3formsKey: "",

  // Farmers markets shown in the reservation form and on the contact section. Edit freely.
  markets: [
    "Market name / city — day & time (placeholder)",
    "Second market — day & time (placeholder)",
  ],

  email: "email@placeholder.com",
  instagram: "azcactusdoctor",
  instagramUrl: "https://instagram.com/azcactusdoctor",

  // Private collection — images only. Add photos to assets/photos and list them here.
  collection: [
    { image: "assets/photos/collection-table.jpg", alt: "Table full of potted cacti in handmade ceramic pots, seen from above" },
    { image: "assets/photos/collection-columnar-wide.jpg", alt: "Tall columnar cacti in handmade pots with an Arizona mountain behind" },
    { image: "assets/photos/collection-patio.jpg", alt: "Cacti and euphorbia in sculpted pots on a stone patio beneath a pergola" },
    { image: "assets/photos/pottery-owl-wall.jpg", alt: "Cacti and agave on a garden wall in handmade pots, including a turquoise owl planter" },
    { image: "assets/photos/lawn-garden-1.jpg", alt: "Columnar cacti, a golden barrel and agave in sculpted pots on a lawn" },
    { image: "assets/photos/garden-wall-corner.jpg", alt: "Tall euphorbia and columnar cacti in pots against an adobe wall" },
  ],

  // Gallery — type is "image" or "video"; src is e.g. "assets/photos/one.jpg". wide:true makes it 2 columns.
  gallery: [
    { type: "image", src: "assets/photos/collection-columnar-wide.jpg", wide: true, alt: "Tall columnar cacti in handmade pots with an Arizona mountain behind" },
    { type: "image", src: "assets/photos/collection-table.jpg", alt: "Table full of potted cacti seen from above" },
    { type: "image", src: "assets/photos/collection-patio.jpg", alt: "Cacti on a stone patio beneath a pergola" },
    { type: "image", src: "assets/photos/collection-pots-row.jpg", alt: "Row of cacti in handmade pots" },
    { type: "image", src: "assets/photos/pottery-owl-wall.jpg", alt: "Turquoise owl planter and handmade pots on a garden wall" },
    { type: "image", src: "assets/photos/garden-wall-corner.jpg", alt: "Euphorbia and columnar cacti against an adobe wall" },
    { type: "image", src: "assets/photos/lawn-garden-2.jpg", alt: "Cacti in sculpted pots on a lawn" },
    { type: "image", src: "assets/photos/lawn-garden-1.jpg", wide: true, alt: "Columnar cacti, golden barrel and agave in handmade pots on a lawn" },
    { type: "image", src: "assets/photos/lawn-garden-3.jpg", alt: "Large white pot with agave among cacti in a garden" },
    { type: "video", src: "" },
  ],
};

/* ============================================================ */
const $ = (s) => document.querySelector(s);
const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Only allow same-site relative paths or https URLs for images coming from the spreadsheet.
const safeUrl = (u) => { u = String(u || "").trim(); return /^(https:\/\/|assets\/|\.\/assets\/)/i.test(u) && !/[<>"']/.test(u) ? u : ""; };
const CACTUS_SVG = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M32 58V14a5 5 0 0 1 10 0v0M32 40h-9a4 4 0 0 1-4-4V26M32 34h9a4 4 0 0 0 4-4V22"/><path d="M22 58h20"/></svg>`;

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

async function loadInventory() {
  try {
    const res = await fetch(CONFIG.inventoryUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    products = parseCSV(await res.text()).map((p, i) => ({
      id: p.sku || "item-" + i,
      name: p.name || "Unnamed plant",
      category: p.category || "Uncategorized",
      price: parseFloat(String(p.price).replace(/[^0-9.]/g, "")) || 0,
      status: p.status || "In Stock",
      size: p.size || "",
      description: p.description || "",
      image: safeUrl(p.image),
    }));
  } catch (e) {
    products = [];
    $("#productGrid").innerHTML = `<p class="empty">Couldn't load the inventory. If you opened this file directly, run a local server (e.g. <code>python3 -m http.server</code>).</p>`;
    return false;
  }
  return true;
}

/* ---------- SHOP ---------- */
const isOut = (p) => /sold/i.test(p.status);
const isPre = (p) => /pre/i.test(p.status);
const isLow = (p) => /low/i.test(p.status);

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
    (!state.q || (p.name + " " + p.category + " " + p.description).toLowerCase().includes(state.q))
  );
  const sorts = {
    name: (a, b) => a.name.localeCompare(b.name),
    priceAsc: (a, b) => a.price - b.price,
    priceDesc: (a, b) => b.price - a.price,
  };
  list.sort(sorts[state.sort]);
  $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "plant" : "plants"}`;
  $("#productGrid").innerHTML = list.length
    ? list.map((p) => {
        const badge = isOut(p) ? `<span class="badge out">Sold out</span>` : isPre(p) ? `<span class="badge pre">Pre-order</span>` : isLow(p) ? `<span class="badge low">Low stock</span>` : "";
        const img = p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : `<div class="ph" data-slot="Photo coming soon">${CACTUS_SVG}</div>`;
        return `<article class="card">
          <div class="thumb">${badge}${img}</div>
          <div class="body">
            <span class="cat">${esc(p.category)}${p.size ? " · " + esc(p.size) : ""}</span>
            <h4>${esc(p.name)}</h4>
            <p class="desc">${esc(p.description)}</p>
            <div class="row"><span class="price">${money(p.price)}</span>
            <button class="add" data-id="${esc(p.id)}" ${isOut(p) ? "disabled" : ""}>${isOut(p) ? "Sold out" : isPre(p) ? "Pre-order" : "Add"}</button></div>
          </div></article>`;
      }).join("")
    : `<p class="empty">No plants match your selection.</p>`;
}

/* ---------- CART ---------- */
function saveCart() { try { localStorage.setItem("sp-cart", JSON.stringify(cart)); } catch (e) {} renderCart(); }
function renderCart() {
  const items = cart.map((c) => ({ ...c, p: products.find((p) => p.id === c.id) })).filter((c) => c.p);
  $("#cartCount").textContent = items.reduce((s, c) => s + c.qty, 0);
  $("#cartItems").innerHTML = items.length
    ? items.map((c) => `<div class="cart-item">
        <h5>${esc(c.p.name)}</h5><span>${money(c.p.price * c.qty)}</span>
        <div class="qty"><button data-dec="${esc(c.id)}">−</button>${c.qty}<button data-inc="${esc(c.id)}">+</button></div>
        <button class="rm" data-rm="${esc(c.id)}">Remove</button></div>`).join("")
    : `<p class="cart-empty">Your selection is empty.</p>`;
  $("#cartTotal").textContent = money(items.reduce((s, c) => s + c.p.price * c.qty, 0));
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
  const notes = String(f.get("notes") || "").trim().slice(0, 500);
  if (!name || !contact) return say("Please add your name and a phone or email.", true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && contact.replace(/\D/g, "").length < 7) return say("That doesn't look like a phone number or email.", true);
  let last = 0; try { last = +localStorage.getItem("sp-last") || 0; } catch (err) {}
  if (Date.now() - last < 30000) return say("Please wait a moment before sending again.", true);

  const total = money(items.reduce((t, c) => t + c.p.price * c.qty, 0));
  const lines = items.map((c) => `${c.qty} x ${c.p.name} (${c.p.id}) - ${money(c.p.price * c.qty)}`).join("\n");
  const summary = `NEW PICKUP RESERVATION\n\nCustomer: ${name}\nContact: ${contact}\nMarket: ${market}\n\n${lines}\n\nTotal: ${total} (pay at pickup)\n\nNotes: ${notes || "-"}`;

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
    say("Reserved! We'll message you to confirm. See you at the market.");
  } catch (err) {
    say("Couldn't send that. Please try again or email us directly.", true);
  }
  btn.disabled = !cartLines().length;
}

/* ---------- COLLECTION / GALLERY ---------- */
function renderCollection() {
  $("#collectionGrid").innerHTML = CONFIG.collection.map((c) => `<figure class="coll-card">
    ${safeUrl(c.image) ? `<img src="${esc(safeUrl(c.image))}" alt="${esc(c.alt || "Plant from the private collection")}" loading="lazy">` : `<div class="ph" data-slot="Collection photo">${CACTUS_SVG}</div>`}</figure>`).join("");
}
function renderGallery() {
  $("#galleryGrid").innerHTML = CONFIG.gallery.map((g) => {
    const cls = "g" + (g.wide ? " wide" : "");
    g = { ...g, src: safeUrl(g.src) };
    if (!g.src) return `<div class="g ph ${g.wide ? "wide" : ""}" data-slot="${g.type === "video" ? "Video" : "Photo"}"></div>`;
    return g.type === "video"
      ? `<div class="${cls}"><video src="${esc(g.src)}" controls muted playsinline preload="metadata"></video></div>`
      : `<div class="${cls}"><img src="${esc(g.src)}" alt="${esc(g.alt || "")}" loading="lazy"></div>`;
  }).join("");
}

/* ---------- EVENTS ---------- */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, a");
  if (!t) return;
  if (t.dataset.cat) { state.cat = t.dataset.cat; renderCats(); renderProducts(); $("#filters").classList.remove("on"); }
  else if (t.classList.contains("add")) {
    const row = cart.find((c) => c.id === t.dataset.id);
    row ? row.qty++ : cart.push({ id: t.dataset.id, qty: 1 });
    saveCart(); toggleCart(true);
  }
  else if (t.dataset.inc) { cart.find((c) => c.id === t.dataset.inc).qty++; saveCart(); }
  else if (t.dataset.dec) { const r = cart.find((c) => c.id === t.dataset.dec); if (--r.qty <= 0) cart = cart.filter((c) => c !== r); saveCart(); }
  else if (t.dataset.rm) { cart = cart.filter((c) => c.id !== t.dataset.rm); saveCart(); }
  else if (t.id === "cartOpen") toggleCart(true);
  else if (t.id === "cartClose") toggleCart(false);
  else if (t.id === "filtersOpen") $("#filters").classList.add("on");
  else if (t.id === "filtersClose") $("#filters").classList.remove("on");
  else if (t.id === "burger" || t.closest("#navLinks")) $("#navLinks").classList.toggle("on", t.id === "burger" && !$("#navLinks").classList.contains("on"));
});
$("#orderForm").addEventListener("submit", submitOrder);
$("#scrim").addEventListener("click", () => toggleCart(false));
$("#search").addEventListener("input", (e) => { state.q = e.target.value.toLowerCase().trim(); renderProducts(); });
$("#onlyAvail").addEventListener("change", (e) => { state.avail = e.target.checked; renderProducts(); });
$("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderProducts(); });

/* ---------- INIT ---------- */
$("#year").textContent = new Date().getFullYear();
$("#contactEmail").textContent = CONFIG.email;
$("#contactEmail").href = "mailto:" + CONFIG.email;
$("#contactInsta").textContent = "@" + CONFIG.instagram;
$("#contactInsta").href = CONFIG.instagramUrl;
$("#marketSelect").innerHTML = CONFIG.markets.map((m) => `<option>${esc(m)}</option>`).join("");
$("#marketList").innerHTML = CONFIG.markets.map(esc).join("<br>");
renderCollection();
renderGallery();
renderCart();
function addProductSchema() {
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem", position: i + 1,
      item: {
        "@type": "Product", name: p.name, sku: p.id, category: p.category,
        description: p.description || p.name,
        ...(p.image ? { image: new URL(p.image, location.href).href } : {}),
        brand: { "@type": "Brand", name: "Spina & Spiritus" },
        offers: { "@type": "Offer", price: p.price, priceCurrency: "USD", availableDeliveryMethod: "https://schema.org/OnSitePickup",
          availability: isOut(p) ? "https://schema.org/OutOfStock" : isPre(p) ? "https://schema.org/PreOrder" : "https://schema.org/InStock" },
      },
    })),
  });
  document.head.appendChild(el);
}
loadInventory().then((ok) => { if (ok) { renderCats(); renderProducts(); renderCart(); addProductSchema(); } });
