/* ============================================================
   SPINA & SPIRITUS — site settings. Edit this block as info arrives.
   ============================================================ */
const CONFIG = {
  // Inventory source. Default is the local CSV file.
  // To use the live spreadsheet: in Google Sheets choose
  //   File → Share → Publish to web → pick the sheet → CSV,
  // then paste that link here. Keep the same column headers as data/inventory.csv.
  inventoryUrl: "data/inventory.csv",

  email: "email@placeholder.com",
  instagram: "azcactusdoctor",
  instagramUrl: "https://instagram.com/azcactusdoctor",

  // Private collection — add photos to assets/photos and list them here.
  collection: [
    { name: "Collection piece one", note: "Species · Age · Origin", image: "" },
    { name: "Collection piece two", note: "Species · Age · Origin", image: "" },
    { name: "Collection piece three", note: "Species · Age · Origin", image: "" },
    { name: "Collection piece four", note: "Species · Age · Origin", image: "" },
  ],

  // Gallery — type is "image" or "video"; src is e.g. "assets/photos/one.jpg". wide:true makes it 2 columns.
  gallery: [
    { type: "image", src: "", wide: true },
    { type: "image", src: "" },
    { type: "image", src: "" },
    { type: "image", src: "" },
    { type: "image", src: "" },
    { type: "video", src: "", wide: true },
  ],
};

/* ============================================================ */
const $ = (s) => document.querySelector(s);
const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
      image: p.image || "",
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
function checkout() {
  const items = cart.map((c) => ({ ...c, p: products.find((p) => p.id === c.id) })).filter((c) => c.p);
  const lines = items.map((c) => `- ${c.p.name} (${c.p.id}) × ${c.qty} — ${money(c.p.price * c.qty)}`).join("\n");
  const total = money(items.reduce((s, c) => s + c.p.price * c.qty, 0));
  const body = `Hello,\n\nI'd like to order:\n\n${lines}\n\nTotal: ${total}\n\nName:\nShipping address:\n`;
  location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Spina & Spiritus order")}&body=${encodeURIComponent(body)}`;
}

/* ---------- COLLECTION / GALLERY ---------- */
function renderCollection() {
  $("#collectionGrid").innerHTML = CONFIG.collection.map((c) => `<article class="coll-card">
    ${c.image ? `<img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy">` : `<div class="ph" data-slot="Collection photo">${CACTUS_SVG}</div>`}
    <div class="meta"><h4>${esc(c.name)}</h4><p>${esc(c.note)}</p></div></article>`).join("");
}
function renderGallery() {
  $("#galleryGrid").innerHTML = CONFIG.gallery.map((g) => {
    const cls = "g" + (g.wide ? " wide" : "");
    if (!g.src) return `<div class="g ph ${g.wide ? "wide" : ""}" data-slot="${g.type === "video" ? "Video" : "Photo"}"></div>`;
    return g.type === "video"
      ? `<div class="${cls}"><video src="${esc(g.src)}" controls muted playsinline preload="metadata"></video></div>`
      : `<div class="${cls}"><img src="${esc(g.src)}" alt="" loading="lazy"></div>`;
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
  else if (t.id === "checkout") checkout();
  else if (t.id === "filtersOpen") $("#filters").classList.add("on");
  else if (t.id === "filtersClose") $("#filters").classList.remove("on");
  else if (t.id === "burger" || t.closest("#navLinks")) $("#navLinks").classList.toggle("on", t.id === "burger" && !$("#navLinks").classList.contains("on"));
});
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
renderCollection();
renderGallery();
renderCart();
loadInventory().then((ok) => { if (ok) { renderCats(); renderProducts(); renderCart(); } });
