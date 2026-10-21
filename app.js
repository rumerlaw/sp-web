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
    { name: "Roadrunner Park Farmers Market", where: "3502 E Cactus Rd, Phoenix, AZ 85032", when: "Every Saturday, 8am–12pm", date: "", except: "2026-11-07" },
    { name: "Sonoran Spiritual and Wellness Market", where: "New Vision Center for Spiritual Living, Phoenix, AZ 85032", when: "Saturday, November 7, 2026 · 9:00 AM", date: "2026-11-07", url: "https://www.ticketsource.com/sonoranmarket/t-rzjqpvr" },
  ],



  email: "spinanspiritus@gmail.com",
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
const addLabel = () => (SITE.text && SITE.text.addToCart) || "Add to cart";
const upcomingEvents = () => { if (typeof SP !== "undefined" && SP.editing) return CONFIG.events; const today = new Date().toISOString().slice(0, 10); return CONFIG.events.filter((ev) => !ev.date || ev.date >= today); };
// Dates a recurring event does NOT happen (e.g. the Doctor is at another market). Shown as "Not on Nov 7".
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const exceptNote = (ev) => {
  const today = new Date().toISOString().slice(0, 10), editing = typeof SP !== "undefined" && SP.editing;
  const ds = (String(ev.except || "").match(/\d{4}-\d{2}-\d{2}/g) || []).filter((d) => editing || d >= today).sort();
  return ds.length ? "Not on " + ds.map((d) => MONTHS[+d.slice(5, 7) - 1] + " " + +d.slice(8)).join(", ") : "";
};
const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const mapHref = (where) => (isApple ? `https://maps.apple.com/?q=${encodeURIComponent(where)}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(where)}`);
const mapLink = (e) => (e.where ? `<a class="maplink" href="${mapHref(e.where)}" target="_blank" rel="noopener">${esc(e.where)} <span aria-hidden="true">↗</span><span class="sr">(opens ${isApple ? "Apple Maps" : "map"})</span></a>` : "");
const eventLabel = (ev) => `${ev.name} — ${ev.when}${exceptNote(ev) ? " (" + exceptNote(ev).replace(/^Not/, "not") + ")" : ""}`;
const ticketLink = (e) => (safeUrl(e.url) ? `<a class="evlink" href="${esc(safeUrl(e.url))}" target="_blank" rel="noopener noreferrer">Get your free ticket <span aria-hidden="true">↗</span></a>` : "");
const $ = (s) => document.querySelector(s);
const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Only allow same-site relative paths or https URLs for images coming from the spreadsheet.
const safeUrl = (u) => { u = String(u || "").trim(); return /^(https:\/\/|assets\/|\.\/assets\/)/i.test(u) && !/[<>"']/.test(u) ? u : ""; };
// Fast-loading variants made by scripts/strip_media.py (assets/photos/web, assets/photos/thumb).
const variant = (src, kind) => {
  if (SP.pending[src]) return SP.pending[src].url;
  let m = /^assets\/uploads\/([^/]+\.jpg)$/i.exec(src);
  if (m) return kind === "thumb" ? `assets/uploads/thumb/${m[1]}` : src;
  m = /^(?:\.\/)?assets\/photos\/([^/]+)\.(?:jpe?g|png|webp)$/i.exec(src);
  return m ? `assets/photos/${kind}/${m[1]}.webp` : src;
};
const CACTUS_SVG = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M32 58V14a5 5 0 0 1 10 0v0M32 40h-9a4 4 0 0 1-4-4V26M32 34h9a4 4 0 0 0 4-4V22"/><path d="M22 58h20"/></svg>`;

// ---- "Back to shop" memory: remember scroll + filters when leaving the shop for a plant page ----
const RET_KEY = "sp-return";
const isHome = !document.body.dataset.page, isShop = document.body.dataset.page === "shop";
const onHome = isHome || isShop;   // pages that remember scroll + filters for "Back to shop"
let pendingRestore = null;
if (onHome) {
  try {
    if (sessionStorage.getItem("sp-restore") === "1") {
      pendingRestore = JSON.parse(sessionStorage.getItem(RET_KEY) || "null");
      if (pendingRestore && pendingRestore.from && pendingRestore.from !== (isShop ? "shop" : "home")) pendingRestore = null;
      sessionStorage.removeItem("sp-restore");
    }
  } catch (e) {}
  // Refresh / browser back: return to exactly where the visitor was (ignore any #section left in the address).
  try {
    const nav = (performance.getEntriesByType("navigation")[0] || {}).type;
    if (!pendingRestore && (nav === "reload" || nav === "back_forward")) {
      const y = parseInt(sessionStorage.getItem("sp-y") || "", 10);
      if (y > 0) pendingRestore = { y, plain: true };
    }
  } catch (e) {}
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  // Arriving from another page with #section: stay hidden until we are already at that section (no scroll from the top).
  if (!pendingRestore && location.hash.length > 1) {
    document.documentElement.style.opacity = "0";
    setTimeout(() => { document.documentElement.style.opacity = ""; }, 2500);
  }
  if (pendingRestore) {
    document.documentElement.style.opacity = "0";
    setTimeout(() => { document.documentElement.style.opacity = ""; }, 2500);
  }
}
// Fade the page in (waits two frames so the browser has painted the hidden state and can animate it).
const reveal = () => requestAnimationFrame(() => requestAnimationFrame(() => { document.documentElement.style.opacity = ""; }));
const saveReturn = () => { try { sessionStorage.setItem(RET_KEY, JSON.stringify({ from: isShop ? "shop" : "home", y: Math.round(window.scrollY), cat: state.cat, q: state.q, avail: state.avail, sort: state.sort })); } catch (e) {} };

/* ---------- EDITABLE CONTENT (data/site.json) ---------- */
// Everything the owner can change in the visual editor lives in data/site.json. The static HTML already contains the same
// text as a fallback, so the page still works if the file is missing.
let SITE = { text: {}, images: {}, plants: {} };
let resolveReady; 
const SP = (window.SP = { editing: false, pending: {}, ready: new Promise((r) => (resolveReady = r)) });
const normKey = (n) => String(n || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const getPath = (o, p) => String(p).split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
const setPath = (o, p, v) => {
  const ks = String(p).split("."); let a = o;
  ks.slice(0, -1).forEach((k, i) => { if (a[k] == null || typeof a[k] !== "object") a[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; a = a[k]; });
  a[ks[ks.length - 1]] = v;
};
// Tiny safe markup for FAQ answers: **bold**, *italic*, [words](link). Everything else is escaped.
function md(src) {
  let t = esc(src);
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|index\.html#[\w-]+|faq\.html)\)/g, (m, txt, url) => /^https?:/.test(url) ? `<a href="${url}" target="_blank" rel="noopener">${txt}</a>` : `<a href="${url}">${txt}</a>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, "<i>$1</i>");
  return t.replace(/\n/g, "<br>");
}
async function loadSite() {
  try {
    const r = await fetch("data/site.json", { cache: "no-store" });
    if (r.ok) SITE = Object.assign({ text: {}, images: {}, plants: {} }, await r.json());
  } catch (e) {}
}
function syncConfig() {
  if (Array.isArray(SITE.events)) CONFIG.events = SITE.events;
  if (SITE.contact) {
    if (SITE.contact.email) CONFIG.email = SITE.contact.email;
    if (SITE.contact.instagram) { CONFIG.instagram = String(SITE.contact.instagram).replace(/^@/, ""); CONFIG.instagramUrl = "https://instagram.com/" + encodeURIComponent(CONFIG.instagram); }
  }
  if (Array.isArray(SITE.collection)) CONFIG.collection = SITE.collection;
}
const safeHref = (u) => { u = String(u || "").trim(); return /^(https?:\/\/|mailto:|tel:|#|index\.html|faq\.html|plant\.html|\/)/i.test(u) && !/^javascript:/i.test(u) ? u : ""; };
function applyPaths(root = document) {
  root.querySelectorAll("[data-path]").forEach((el) => {
    const p = el.dataset.path;
    if (el !== document.activeElement && !(el.hasAttribute("data-rich") && !SP.editing)) {
      const v = getPath(SITE, p);
      if (typeof v === "string" && el.textContent !== v) el.textContent = v;
    }
    const al = SITE.align && SITE.align[p]; el.style.textAlign = al || "";
    const sz = SITE.size && SITE.size[p]; el.style.zoom = sz && sz !== 1 ? sz : "";
  });
  root.querySelectorAll("[data-href-path]").forEach((el) => {
    const u = safeHref(getPath(SITE, el.dataset.hrefPath));
    if (u) el.setAttribute("href", u);
  });
  root.querySelectorAll("[data-img-key]").forEach((el) => {
    const u = safeUrl(getPath(SITE, el.dataset.imgKey));
    if (u && el.tagName === "IMG") el.src = variant(u, "web");
  });
}
const editAttrs = (path, extra = "") => ` data-path="${path}"${extra}`;
const dragHandle = `<span class="drag" title="Drag to reorder" aria-hidden="true">⠿</span>`;

function renderAbout() {
  const a = SITE.about; if (!a || !$("#aboutBody")) return;
  $("#aboutTitle").textContent = a.title || "";
  const paras = a.paragraphs || [];
  $("#aboutBody").innerHTML = paras.map((t, i) => `<div class="para"${SP.editing ? ` data-i="${i}" draggable="true"` : ""}>${SP.editing ? dragHandle : ""}<p${editAttrs("about.paragraphs." + i)}>${esc(t)}</p>${SP.editing ? `<button class="x" data-act="del-para" data-i="${i}" aria-label="Remove paragraph">✕</button>` : ""}</div>`).join("") + (SP.editing ? `<button class="addbtn" data-act="add-para">+ Add a paragraph</button>` : "");
  if (SP.editing) $("#aboutBody").setAttribute("data-sort", "paragraphs"); else $("#aboutBody").removeAttribute("data-sort");
  $("#aboutStats").innerHTML = (a.stats || []).map((s, i) => `<li><strong${editAttrs("about.stats." + i + ".value")}>${esc(s.value)}</strong><span${editAttrs("about.stats." + i + ".label")}>${esc(s.label)}</span></li>`).join("");
  renderPortrait();
}
function renderPortrait() {
  const el = $("#aboutPortrait"); if (!el) return;
  const src = SITE.images && SITE.images.aboutPortrait;
  el.setAttribute("data-img", "images.aboutPortrait");
  if (safeUrl(src)) { el.classList.remove("ph"); el.innerHTML = `<img src="${esc(variant(safeUrl(src), "web"))}" alt="${esc((SITE.about && SITE.about.title) || "Portrait")}">`; }
  else { el.classList.add("ph"); el.innerHTML = ""; }
  if (SP.editing) el.insertAdjacentHTML("beforeend", `<span class="img-hint">Click or drop a photo</span>`);
}
// The checkout "which event will you pick up at?" list. Lives in the cart drawer, which every page has,
// so it is filled on every page (not only where the contact block exists).
function renderMarketSelect() {
  const sel = $("#marketSelect"); if (!sel) return;
  const keep = sel.value;
  // The list shows just the event name (so it fits on a phone); the full name + time is shown under the box once chosen.
  sel.innerHTML = `<option value="">Choose an event…</option>` + upcomingEvents().map((e) => `<option value="${esc(eventLabel(e))}">${esc(e.name)}</option>`).join("");
  if (keep) sel.value = keep;
  showPicked();
}
function showPicked() {
  const sel = $("#marketSelect"); if (!sel) return;
  let box = $("#marketPicked");
  if (!box) { box = document.createElement("p"); box.id = "marketPicked"; box.className = "market-picked"; box.setAttribute("aria-live", "polite"); sel.closest("label").after(box); }
  box.textContent = sel.value ? "Pickup: " + sel.value : "";
  box.hidden = !sel.value;
}
document.addEventListener("change", (e) => { if (e.target && e.target.id === "marketSelect") showPicked(); });
function renderContactArea() {
  renderMarketSelect();
  if (!$("#contactEmail")) return;
  $("#contactEmail").textContent = CONFIG.email;
  $("#contactEmail").href = "mailto:" + CONFIG.email;
  $("#contactEmail").setAttribute("data-path", "contact.email");
  $("#contactInsta").href = CONFIG.instagramUrl;
  const it = $("#contactInstaText"); if (it) { it.textContent = CONFIG.instagram; it.setAttribute("data-path", "contact.instagram"); }
  const ev = upcomingEvents();
  if (SP.editing) {
    $("#marketList").setAttribute("data-sort", "events");
    $("#marketList").innerHTML = ev.map((e, i) => `<li class="ev-edit" data-i="${i}" draggable="true">${dragHandle}<b${editAttrs("events." + i + ".name")}>${esc(e.name)}</b><span${editAttrs("events." + i + ".where")}>${esc(e.where || "")}</span><span class="when"${editAttrs("events." + i + ".when")}>${esc(e.when)}</span><span class="evx"${editAttrs("events." + i + ".except")} data-ph="Not on dates (2026-11-07, …)">${esc(e.except || "")}</span><span class="evx"${editAttrs("events." + i + ".url")} data-ph="Ticket link (https://…)">${esc(e.url || "")}</span><label class="evdate">Hide after <input type="date" data-date="${i}" value="${esc(e.date || "")}"></label><button class="x" data-act="del-event" data-i="${i}" aria-label="Remove event">✕</button></li>`).join("") + `<li class="add-row"><button class="addbtn" data-act="add-event">+ Add an event</button></li>`;
  } else {
    $("#marketList").removeAttribute("data-sort");
    $("#marketList").innerHTML = ev.length ? ev.map((e) => `<li><b>${esc(e.name)}</b>${e.where ? `<span>${mapLink(e)}</span>` : ""}<span class="when">${esc(e.when)}</span>${exceptNote(e) ? `<span class="exnote">${esc(exceptNote(e))}</span>` : ""}${ticketLink(e)}${e.where ? `<div class="ev-map"><iframe title="Map to ${esc(e.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(e.where)}&output=embed"></iframe></div>` : ""}</li>`).join("") : `<li><span>New dates will be posted soon.</span></li>`;
  }
  if ($("#eventMap")) $("#eventMap").innerHTML = "";
}
function renderFaq() {
  const box = $("#faqList"); const items = SITE.faq;
  if (!box || !Array.isArray(items)) return;
  const onHome = !!$("#faq");
  const list = onHome && !SP.editing ? items.slice(0, 5) : items;
  if (SP.editing) {
    box.setAttribute("data-sort", "faq");
    box.innerHTML = (onHome ? `<p class="edit-tip">Only the first 5 questions show on the home page; all show on the FAQ page. Drag ⠿ to reorder. Links: [words](https://…). Bold: **word**.</p>` : `<p class="edit-tip">Drag ⠿ to reorder. Links: [words](https://…). Bold: **word**.</p>`) +
      list.map((f, i) => `<div class="faq-edit" data-i="${i}" draggable="true">${dragHandle}<div class="fe-body"><h4${editAttrs("faq." + i + ".q")}>${esc(f.q)}</h4><p data-rich data-multiline${editAttrs("faq." + i + ".a")}>${esc(f.a)}</p></div><button class="x" data-act="del-faq" data-i="${i}" aria-label="Remove question">✕</button></div>`).join("") + `<button class="addbtn" data-act="add-faq">+ Add a question</button>`;
  } else {
    box.removeAttribute("data-sort");
    box.innerHTML = list.map((f) => `<details class="faq-item"><summary><span>${esc(f.q)}</span><i class="plus" aria-hidden="true"></i></summary><div class="faq-a"><p data-rich>${md(f.a)}</p></div></details>`).join("");
  }
  document.querySelectorAll('script[type="application/ld+json"]').forEach((sc) => { try { if (JSON.parse(sc.textContent)["@type"] === "FAQPage") sc.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: String(f.a).replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") } })) }); } catch (e) {} });
}

/* ---------- SECTIONS, LAYOUT & CUSTOM BLOCKS ---------- */
const SECTION_IDS = ["hero", "about", "collection", "shop", "events", "faq"];
const builtinEl = (id) => ({ hero: document.querySelector(".hero"), about: $("#about"), collection: $("#collection"), shop: $("#shop"), events: $("#events"), faq: $("#faq") })[id];
function fullOrder() {
  const blocks = SITE.blocks || [], seen = new Set(), out = [];
  const ok = (id) => (SECTION_IDS.includes(id) ? !!builtinEl(id) : blocks.some((b) => b.id === id));
  (SITE.layout || []).forEach((id) => { if (!seen.has(id) && ok(id)) { seen.add(id); out.push(id); } });
  SECTION_IDS.forEach((id) => { if (!seen.has(id) && ok(id)) { seen.add(id); out.push(id); } });
  blocks.forEach((b) => { if (!seen.has(b.id)) { seen.add(b.id); out.push(b.id); } });
  return out;
}
function blockHtml(b, i) {
  const ed = SP.editing, P = (f) => `blocks.${i}.${f}`, layout = b.layout || "text", align = b.align || "center";
  const title = b.title || ed ? `<h2 data-path="${P("title")}" data-placeholder="Add a heading…">${esc(b.title || "")}</h2>` : "";
  const body = ed ? `<p class="b-text" data-multiline data-placeholder="Write something…" data-path="${P("body")}">${esc(b.body || "")}</p>`
    : (b.body ? String(b.body).split(/\n{2,}/).map((t) => `<p class="b-text">${esc(t).replace(/\n/g, "<br>")}</p>`).join("") : "");
  const btns = (b.buttons || []).map((x, j) => `<span class="b-btn-wrap">${ed ? `<button class="x" data-act="blk-del-btn" data-b="${i}" data-j="${j}" aria-label="Remove button">✕</button>` : ""}<a class="btn${x.style === "ghost" ? " ghost" : ""}" href="${esc(safeHref(x.url) || "#")}" data-path="${P("buttons." + j + ".label")}" data-href-path="${P("buttons." + j + ".url")}">${esc(x.label || "")}</a></span>`).join("");
  let media = "";
  if (layout.startsWith("photo")) media = `<figure class="b-img" data-img="${P("image")}">${safeUrl(b.image) ? `<img src="${esc(variant(safeUrl(b.image), "web"))}" alt="${esc(b.title || "")}" loading="lazy">` : `<div class="ph" data-slot="Photo">${CACTUS_SVG}</div>`}${ed ? `<span class="img-hint">Click or drop a photo</span>` : ""}</figure>`;
  if (layout === "gallery") media = `<div class="b-gallery"${ed ? ` data-sort="blockimgs:${i}" data-drop="blockgallery:${i}"` : ""}>${(b.images || []).map((u, k) => `<div class="bg-item"${ed ? ` data-i="${k}" draggable="true"` : ""}><img src="${esc(variant(safeUrl(u) || "", "thumb"))}" alt="" loading="lazy">${ed ? `<button class="x" data-act="blk-del-img" data-b="${i}" data-i="${k}" aria-label="Remove photo">✕</button>` : ""}</div>`).join("")}${ed ? `<button class="ce-add b-add" data-act="blk-add-imgs" data-b="${i}"><span>+</span>Add photos</button>` : ""}</div>`;
  const copy = `<div class="b-copy">${title}${body}${btns || ed ? `<div class="b-btns">${btns}${ed ? `<button class="addbtn" data-act="blk-add-btn" data-b="${i}">+ Add a button</button>` : ""}</div>` : ""}</div>`;
  const inner = layout === "photo-left" ? `<div class="b-grid">${media}${copy}</div>` : layout === "photo-right" ? `<div class="b-grid rev">${copy}${media}</div>` : layout === "photo-top" ? `${media}${copy}` : layout === "gallery" ? `${copy}${media}` : copy;
  return `<div class="wrap b-wrap" data-align="${align}">${inner}</div>`;
}
function applyLayout() {
  const footer = $("footer.footer"); if (!footer || document.body.dataset.page) return;
  fullOrder().forEach((id) => {
    const el = builtinEl(id) || document.getElementById(id); if (!el) return;
    footer.before(el); el.classList.toggle("sec-hidden", !!(SITE.hidden && SITE.hidden[id]));
  });
}
function renderBlocks() {
  if (document.body.dataset.page) return;
  document.querySelectorAll("[data-block]").forEach((n) => n.remove());
  const footer = $("footer.footer"); if (!footer) return;
  (SITE.blocks || []).forEach((b, i) => {
    const el = document.createElement("section");
    el.className = `section block bg-${b.bg || "light"}`; el.id = b.id; el.dataset.block = b.id;
    el.innerHTML = blockHtml(b, i); footer.before(el);
  });
  applyLayout();
}
function renderAll() {
  syncConfig(); renderAbout(); renderContactArea(); renderFaq(); renderBlocks();
  if ($("#collectionGrid")) renderCollection();
  if (document.body.dataset.page === "plant" && SP.rerenderPlant) SP.rerenderPlant();
  applyPaths();
}
function applyPlantOverrides() {
  products.forEach((p) => {
    if (!p.origKey) p.origKey = normKey(p.name);
    const ov = SITE.plants && SITE.plants[p.origKey]; if (!ov) return;
    if (typeof ov.name === "string" && ov.name.trim()) p.name = ov.name.trim();
    if (typeof ov.genus === "string" && ov.genus.trim()) p.genus = ov.genus.trim();
    if (ov.price !== undefined && ov.price !== "" && !isNaN(parseFloat(ov.price))) p.price = parseFloat(ov.price);
    if (ov.salePrice !== undefined && ov.salePrice !== "" && !isNaN(parseFloat(ov.salePrice))) p.salePrice = parseFloat(ov.salePrice);
    if (ov.stock !== undefined && ov.stock !== "" && !isNaN(parseInt(ov.stock, 10))) p.stock = Math.max(0, parseInt(ov.stock, 10));
    if (typeof ov.status === "string" && ov.status) p.status = ov.status;
    if (typeof ov.description === "string" && ov.description.trim()) p.description = ov.description;
    if (Array.isArray(ov.images) && ov.images.length) p.images = ov.images.map(safeUrl).filter(Boolean);
  });
}
Object.assign(SP, { fullOrder, builtinEl, renderBlocks, applyLayout, safeHref, normKey, getPath, setPath, esc, md, renderAll, renderAbout, renderFaq, renderCollection: () => renderCollection(), safeUrl, variant, applyPaths, applyPlantOverrides, renderPortrait,
  getSite: () => SITE, setSite: (x) => { SITE = x; }, upcomingEvents });
Object.defineProperty(SP, "products", { get: () => products });

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
    products.forEach((p) => (p.origKey = normKey(p.name)));
    applyPlantOverrides();
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
  if (!$("#catList")) return;   // home page shows only a short preview, no catalog sidebar
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
  const grid = $("#productGrid");
  const preview = isHome && matchMedia("(max-width:760px)").matches;   // phones: short preview on the home page; desktop: the full shop
  grid.toggleAttribute("data-preview", preview);
  if (preview) {   // home page: 9 in-stock plants (with photos first); the rest is on shop.html
    const ok = products.filter((p) => !isOut(p) && !noPrice(p));
    list = [...ok.filter((p) => p.images.length), ...ok.filter((p) => !p.images.length)].slice(0, 9);
  }
  grid.innerHTML = list.length ? list.map(cardHtml).join("") : `<p class="empty">No plants match your selection.</p>`;
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
  const add = $("#qvAdd"); add.disabled = isOut(p) || noPrice(p); add.textContent = isOut(p) ? "Sold out" : noPrice(p) ? "Ask at the market" : addLabel();
  const pics = p.images;
  const show = (k) => {
    qvProduct.cur = k;
    $("#qvMain").innerHTML = pics[k] ? `<img src="${esc(variant(pics[k], "web"))}" alt="${esc(p.name)} — photo ${k + 1}">` : `<div class="ph" data-slot="Photos coming soon">${CACTUS_SVG}</div>`;
    document.querySelectorAll(".qv-thumbs button").forEach((b, j) => b.classList.toggle("on", j === k));
  };
  $("#qvThumbs").innerHTML = pics.length > 1 ? pics.map((u, k) => `<button data-qvpic="${k}" aria-label="Photo ${k + 1}"><img src="${esc(variant(u, "thumb"))}" alt=""></button>`).join("") : "";
  document.querySelectorAll(".qv-arrow").forEach((a) => a.remove());
  if (pics.length > 1) $(".qv-media").insertAdjacentHTML("beforeend", `<button class="qv-arrow prev" data-qvnav="-1" aria-label="Previous photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg></button><button class="qv-arrow next" data-qvnav="1" aria-label="Next photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg></button>`);
  qvProduct.show = show; show(0);
  $("#qv").classList.add("on"); $("#qv").setAttribute("aria-hidden", "false");
  lockPage(true);
  $(".qv").focus();
}
function closeQuickView() {
  $("#qv").classList.remove("on"); $("#qv").setAttribute("aria-hidden", "true");
  lockPage(false);
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
// Freeze the page behind the cart / quick view so scrolling inside them never moves the page underneath (also works on iPhone).
let lockCount = 0, lockY = 0;
function lockPage(on) {
  if (on) {
    if (lockCount++ === 0) { lockY = window.scrollY; document.body.style.top = -lockY + "px"; document.body.classList.add("lock"); }
  } else if (lockCount > 0 && --lockCount === 0) {
    document.body.classList.remove("lock"); document.body.style.top = ""; window.scrollTo(0, lockY);
  }
}
let cartLocked = false;
function toggleCart(on) {
  $("#cart").classList.toggle("on", on);
  $("#scrim").classList.toggle("on", on);
  $("#cart").setAttribute("aria-hidden", String(!on));
  if (on !== cartLocked) { cartLocked = !!on; lockPage(!!on); }
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
    // No order form is connected yet: open the customer's email app, and ALWAYS show the order text with a copy button,
    // because on some phones the email app never opens.
    say("Almost done. Your email app should open: press Send. If it doesn't, copy your order below and email it to " + CONFIG.email + ".");
    let box = $("#orderFallback");
    if (!box) { box = document.createElement("div"); box.id = "orderFallback"; box.className = "order-fallback"; msg.after(box); }
    box.innerHTML = `<textarea readonly rows="7" aria-label="Your order">${esc(summary)}</textarea><button type="button" class="btn small" id="copyOrder">Copy my order</button>`;
    $("#copyOrder").onclick = async () => { try { await navigator.clipboard.writeText(summary); $("#copyOrder").textContent = "Copied ✓"; } catch (err) { box.querySelector("textarea").select(); $("#copyOrder").textContent = "Press copy on your keyboard"; } };
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
function renderCollectionEdit() {
  const root = $("#collectionGrid"); const list = CONFIG.collection || [];
  root.innerHTML = `<div class="coll-edit" data-sort="collection" data-drop="collection">${list.map((c, i) => `<div class="ce-item" data-i="${i}" draggable="true"><img src="${esc(variant(safeUrl(c.image) || "", "thumb"))}" alt=""><button class="x" data-act="del-coll" data-i="${i}" aria-label="Remove photo">✕</button><input class="ce-alt" data-alt="${i}" value="${esc(c.alt || "")}" placeholder="Describe this photo (for search engines)"></div>`).join("")}<button class="ce-add" data-act="add-coll"><span>+</span>Drop photos here<br>or click to choose</button></div><p class="edit-tip light">Drag a photo to reorder. Drop new photos anywhere in this box.</p>`;
}
function renderCollection() {
  if (SP.editing) return renderCollectionEdit();
  const slides = CONFIG.collection.filter((c) => safeUrl(c.image));
  const root = $("#collectionGrid");
  if (!slides.length) { root.innerHTML = `<div class="ph slide-empty" data-slot="Collection photos coming soon">${CACTUS_SVG}</div>`; return; }
  const pad = (k) => String(k).padStart(2, "0");
  root.innerHTML = `
    <div class="stage-box"><div class="stage" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Personal collection photos">
      ${slides.map((c, i) => {
        const u = safeUrl(c.image), eager = i < 2;
        return `<figure class="slide${i === 0 ? " on" : ""}" aria-hidden="${i !== 0}"><img class="main" ${eager ? `src="${esc(variant(u, "web"))}"` : `data-src="${esc(variant(u, "web"))}"`} alt="${esc(c.alt || "Plant from my personal collection")}" decoding="async"></figure>`;
      }).join("")}
      <button class="nav-btn prev" aria-label="Previous photo">‹</button>
      <button class="nav-btn next" aria-label="Next photo">›</button>
    </div></div>`;
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
  if (t.dataset.cat) { state.cat = t.dataset.cat; renderCats(); renderProducts(); if ($("#filters")) $("#filters").classList.remove("on"); }
  else if (t.id === "backShop") { try { if (sessionStorage.getItem(RET_KEY)) sessionStorage.setItem("sp-restore", "1"); } catch (err) {} }
  else if (t.dataset.view && $("#qv") && !SP.editing && !matchMedia("(max-width:760px)").matches) { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); openQuickView(t.dataset.view, t); }
  else if (t.id === "plantAdd" && plantCurrent) {
    addToCart(plantCurrent.id, Math.max(1, Math.min(maxQty(plantCurrent), parseInt($("#plantQty").value, 10) || 1)));
    toggleCart(true);
  }
  else if (t.dataset.step && $("#plantQty")) { const q = $("#plantQty"); q.value = Math.max(1, Math.min(plantCurrent ? maxQty(plantCurrent) : 20, (parseInt(q.value, 10) || 1) + +t.dataset.step)); }
  else if (t.dataset.qvpic !== undefined && qvProduct) qvProduct.show(+t.dataset.qvpic);
  else if (t.closest("[data-qvnav]") && qvProduct) { const n = qvProduct.images.length; qvProduct.show((qvProduct.cur + +t.closest("[data-qvnav]").dataset.qvnav + n) % n); }
  else if (t.dataset.plantpic !== undefined && plantCurrent) plantCurrent.show(+t.dataset.plantpic);
  else if (t.id === "qvAdd" && qvProduct) {
    addToCart(qvProduct.id, 1);
    const b = $("#qvAdd"); b.textContent = "Added ✓"; setTimeout(() => { if (qvProduct) b.textContent = addLabel(); }, 1400);
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
document.addEventListener("keydown", (e) => { if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && $("#qv") && $("#qv").classList.contains("on") && qvProduct && qvProduct.images.length > 1) { const n = qvProduct.images.length; qvProduct.show((qvProduct.cur + (e.key === "ArrowRight" ? 1 : -1) + n) % n); return; }
  if (e.key === "Escape") { if ($("#qv") && $("#qv").classList.contains("on")) closeQuickView(); else toggleCart(false); } });
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
SP.rerenderPlant = () => { applyPlantOverrides(); renderPlantPage(); };
SP.plantKey = () => (plantCurrent ? (plantCurrent.origKey || normKey(plantCurrent.name)) : "");
SP.plantImages = () => { const k = SP.plantKey(); const ov = SITE.plants && SITE.plants[k]; return ov && Array.isArray(ov.images) ? ov.images : (plantCurrent ? plantCurrent.images : []); };
SP.setPlantImages = (list) => { const k = SP.plantKey(); setPath(SITE, `plants.${k}.images`, list); if (plantCurrent) plantCurrent.images = list.map(safeUrl).filter(Boolean); SP.rerenderPlant(); };
const setMeta = (sel, attr, val) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
const backHref = () => { try { const r = JSON.parse(sessionStorage.getItem(RET_KEY) || "null"); if (r && r.from === "home") return "index.html#shop"; } catch (e) {} return "shop.html"; };
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
  const url = `https://spinanspiritus.com/plant.html?id=${encodeURIComponent(p.id)}`;
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
    <a class="back" id="backShop" href="${backHref()}" data-path="text.backToShop">${esc((SITE.text && SITE.text.backToShop) || "← Back to shop")}</a>
    <div class="plant-grid">
      <div class="plant-media">
        <div class="plant-main" id="plantMain"></div>
        <div class="plant-thumbs" id="plantThumbs"></div>
        ${SP.editing ? `<div class="plant-photo-edit" data-sort="plantimgs" data-drop="plant"><p class="edit-tip">Drag to reorder. Drop photos here or click +.</p>${pics.map((u, i) => `<div class="pe-item" data-i="${i}" draggable="true"><img src="${esc(variant(u, "thumb"))}" alt=""><button class="x" data-act="del-pimg" data-i="${i}" aria-label="Remove photo">✕</button></div>`).join("")}<button class="pe-add" data-act="add-pimg" aria-label="Add photos">+</button></div>` : ""}
      </div>
      <div class="plant-info">
        ${SP.editing ? `<div class="prod-edit"><h4>Edit this product</h4>
          <label>Name<input data-pf="name" value="${esc(p.name)}"></label>
          <label>Genus<input data-pf="genus" value="${esc(p.genus || "")}"></label>
          <div class="pf-row"><label>Price $<input data-pf="price" inputmode="decimal" value="${p.price ? p.price : ""}"></label><label>Sale price $<input data-pf="salePrice" inputmode="decimal" value="${p.salePrice ? p.salePrice : ""}"></label><label>In stock<input data-pf="stock" inputmode="numeric" value="${p.stock === null ? "" : p.stock}"></label></div>
          <label>Status<select data-pf="status">${[...new Set(["In Stock", "Sale", "Pre-Order", "Sold Out", p.status])].map((o) => `<option${o === p.status ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></label>
          <p class="edit-tip">These replace the spreadsheet values for this plant only. Clear a box to go back to the spreadsheet.</p></div>` : ""}
        <h1 class="plant-title">${esc(p.name)}</h1>
        ${bn ? `<span class="status ${bn[0]}">${bn[1]}</span>` : ""}
        <p class="plant-price">${priceHtml(p)}</p>
        <p class="plant-desc"${SP.editing ? ` data-multiline data-placeholder="Write a description…" data-path="plants.${p.origKey}.description"` : ""}>${esc(p.description || (SP.editing ? "" : "More details coming soon."))}</p>
        <dl class="specs">
          <div><dt>Availability</dt><dd>${esc(stockLine(p))}</dd></div>
          ${p.genus ? `<div><dt>Genus</dt><dd><i>${esc(p.genus)}</i></dd></div>` : ""}
          ${p.size ? `<div><dt>Size</dt><dd>${esc(p.size)}</dd></div>` : ""}
          <div><dt>Pickup</dt><dd>${upcomingEvents().length ? upcomingEvents().map((e) => `<b>${esc(e.name)}</b><br>${e.where ? mapLink(e) + "<br>" : ""}<span class="when">${esc(e.when)}</span>${exceptNote(e) ? `<br><small>${esc(exceptNote(e))}</small>` : ""}`).join("<br><br>") + "<br>No shipping." : "At our next event. No shipping."}</dd></div>
        </dl>
        <div class="buy">
          <div class="qty-box"><button type="button" data-step="-1" aria-label="Less">−</button><input id="plantQty" value="1" inputmode="numeric" aria-label="Quantity" max="${maxQty(p)}"><button type="button" data-step="1" aria-label="More">+</button></div>
          <button class="btn" id="plantAdd" ${isOut(p) || noPrice(p) ? "disabled" : ""}>${isOut(p) ? "Sold out" : noPrice(p) ? "Ask at the market" : `<span data-path="text.addToCart">${esc(addLabel())}</span>`}</button>
        </div>
        <p class="fine">Not every plant comes to every event. Reserve it, pick the event you'll attend, and we'll bring it. Pay in person at pickup.</p>
      </div>
    </div>
    ${related.length ? `<section class="related"><h2 data-path="text.relatedHeading">${esc((SITE.text && SITE.text.relatedHeading) || "You may also like")}</h2><div class="product-grid">${related.map(cardHtml).join("")}</div></section>` : ""}
  </div>`;
  const show = (k) => {
    $("#plantMain").innerHTML = (bn ? `<span class="banner ${bn[0]}">${bn[1]}</span>` : "") + (pics[k] ? `<img src="${esc(variant(pics[k], "web"))}" alt="${esc(p.name)} — photo ${k + 1}">` : `<div class="ph" data-slot="Photos coming soon">${CACTUS_SVG}</div>`);
    document.querySelectorAll("#plantThumbs button").forEach((b, j) => b.classList.toggle("on", j === k));
  };
  $("#plantThumbs").innerHTML = pics.length > 1 ? pics.map((u, k) => `<button data-plantpic="${k}" aria-label="Photo ${k + 1}"><img src="${esc(variant(u, "thumb"))}" alt=""></button>`).join("") : "";
  plantCurrent.show = show; show(0);
  const oldLd = document.getElementById("plantld"); if (oldLd) oldLd.remove();
  const ld = document.createElement("script");
  ld.type = "application/ld+json"; ld.id = "plantld";
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
// "Shop" links: on desktop they go to the shop section on the home page, on phones to the full shop page.
const shopLinks = () => {
  const desk = !matchMedia("(max-width:760px)").matches;
  document.querySelectorAll('[data-href-path="links.navShop"],[data-href-path="links.heroBtn1"]').forEach((a) => a.setAttribute("href", desk ? (isHome ? "#shop" : "index.html#shop") : "shop.html"));
};
matchMedia("(max-width:760px)").addEventListener("change", () => { shopLinks(); if (isHome && $("#productGrid") && products.length) renderProducts(); });
function initPage() {
  syncConfig();
  $("#year").textContent = new Date().getFullYear();
  renderAbout(); renderContactArea(); renderFaq(); renderBlocks();
  if ($("#collectionGrid")) renderCollection();
  applyPaths();
  shopLinks();
  renderCart();
}
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
const siteReady = loadSite();
siteReady.then(() => { initPage(); return loadInventory(); }).then((ok) => {
  if (!ok) { resolveReady(); return; }
  renderCart();
  if (document.body.dataset.page === "plant") renderPlantPage();
  else if ($("#productGrid")) {
    if (pendingRestore && !pendingRestore.plain) {
      Object.assign(state, { cat: pendingRestore.cat || "All", q: pendingRestore.q || "", avail: !!pendingRestore.avail, sort: pendingRestore.sort || "name" });
      if ($("#search")) $("#search").value = state.q;
      if ($("#onlyAvail")) $("#onlyAvail").checked = state.avail;
      if ($("#sort")) $("#sort").value = state.sort;
    }
    renderCats(); renderProducts(); addProductSchema();
    if (pendingRestore) requestAnimationFrame(() => { window.scrollTo({ top: pendingRestore.y, behavior: "instant" }); reveal(); });
  }
  if (isHome && !pendingRestore && location.hash.length > 1) {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    history.replaceState(null, "", location.pathname + location.search);
    requestAnimationFrame(() => { if (el) el.scrollIntoView({ behavior: "instant", block: "start" }); reveal(); });
  } else if (isHome && location.hash) history.replaceState(null, "", location.pathname + location.search);
  resolveReady();
});

// Gentle, eased scroll from wherever the visitor is (no jump). Instant if they prefer reduced motion.
function glideTo(el) {
  const cs = getComputedStyle(el), off = (parseFloat(cs.scrollMarginTop) || 0) + 76;
  const target = Math.max(0, Math.round(el.getBoundingClientRect().top + scrollY - off));
  const from = scrollY, dist = target - from;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(dist) < 4) { scrollTo(0, target); return; }
  const dur = Math.min(2000, 600 + Math.abs(dist) * 0.16), t0 = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (now) => { const t = Math.min(1, (now - t0) / dur); scrollTo(0, from + dist * ease(t)); if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// Home page: remember scroll position for refresh, and keep #section out of the address bar.
if (onHome) {
  let tick = null;
  addEventListener("scroll", () => { if (tick) return; tick = setTimeout(() => { tick = null; if (document.body.classList.contains("lock")) return; try { sessionStorage.setItem("sp-y", String(Math.round(scrollY))); } catch (e) {} }, 150); }, { passive: true });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]"); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const m = /^(?:index\.html)?#([\w-]+)$/.exec(a.getAttribute("href") || ""); if (!m) return;
    const el = document.getElementById(m[1]); if (!el) return;
    e.preventDefault(); glideTo(el);
    try { sessionStorage.setItem("sp-y", String(Math.round(scrollY))); } catch (err) {}
  });
}

// Visual editor: only for the owner. Visit edit.html once (sign in), then every page opens in edit mode until they exit.
SP.ready.then(() => {
  try {
    const q = new URLSearchParams(location.search);
    if (q.has("edit")) { sessionStorage.setItem("sp-edit", "1"); q.delete("edit"); history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "")); }
    if (sessionStorage.getItem("sp-edit") !== "1") return;
    if (!localStorage.getItem("sp-gh-token")) { sessionStorage.removeItem("sp-edit"); location.href = "edit.html"; return; }
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "edit.css"; document.head.appendChild(css);
    const js = document.createElement("script"); js.src = "edit.js"; document.body.appendChild(js);
  } catch (e) {}
});
