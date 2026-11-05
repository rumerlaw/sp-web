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
  orderEndpoint: "https://formspree.io/f/mwllnnyv",
  // Optional: a separate Formspree/Web3Forms form just for the "new arrivals" email signups.
  // If blank, signups go to the orderEndpoint above (or open an email draft).
  signupEndpoint: "https://formspree.io/f/xjyyeelo",
  web3formsKey: "",
  // CONFIRMATION EMAIL TO THE CUSTOMER (optional, free): create an account at https://www.emailjs.com, connect the Gmail account,
  // make one email template, then paste the three values here. Leave blank to skip.
  emailjsServiceId: "service_oriwt2f",
  emailjsTemplateId: "template_0dvcfsc",
  emailjsPublicKey: "eGqlr6RqYGhoxZgt0",

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
// An event dated within the next 7 days is "happening this week": it is highlighted and listed first.
const daysUntil = (ev) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ev.date || ""); if (!m) return null; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((new Date(+m[1], +m[2] - 1, +m[3]) - t) / 86400000); };
const happeningThisWeek = (ev) => { const d = daysUntil(ev); return d !== null && d >= 0 && d <= 6; };
const upcomingEvents = () => {
  const all = (typeof SP !== "undefined" && SP.editing) ? CONFIG.events : (() => { const today = new Date().toISOString().slice(0, 10); return CONFIG.events.filter((ev) => !ev.date || ev.date >= today); })();
  const realm = document.documentElement.getAttribute("data-realm") === "spiritus" ? "spiritus" : "spina";
  const mine = (typeof SP !== "undefined" && SP.editing) ? all : all.filter((e) => (e.realm || "spina") === "both" || (e.realm || "spina") === realm);   // each event belongs to one side, or to both
  return [...mine.filter(happeningThisWeek), ...mine.filter((e) => !happeningThisWeek(e))];
};
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
const safeUrl = (u) => { u = String(u || "").trim(); return /^(https:\/\/|assets\/|\.\/assets\/)/i.test(u) && !/[<>"']/.test(u) && !/(^|\/)\.\.(\/|$)/.test(u) ? u : ""; };
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
const saveReturn = () => { try { sessionStorage.setItem(RET_KEY, JSON.stringify({ from: isShop ? "shop" : "home", y: Math.round(document.body.classList.contains("lock") ? lockY : window.scrollY), cat: state.cat, q: state.q, avail: state.avail, sort: state.sort })); } catch (e) {} };

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
// Plants are picked up at the plant markets; once a candle is in the cart every listed event can be used.
function pickupEvents() {
  const today = new Date().toISOString().slice(0, 10), hasCandle = cart.some((c) => /^(candle|book)-/.test(String(c.id))), hasPlant = cart.some((c) => !/^(candle|book)-/.test(String(c.id)));
  // plants go to plant events, candles to spirit events, a mixed cart only to events both sides attend
  return CONFIG.events.filter((e) => { const r = e.realm || "spina"; return (!e.date || e.date >= today) && (!hasPlant || r === "spina" || r === "both") && (!hasCandle || r === "spiritus" || r === "both"); });
}
function renderMarketSelect() {
  const sel = $("#marketSelect"); if (!sel) return;
  const keep = sel.value;
  // The list shows just the event name (so it fits on a phone); the full name + time is shown under the box once chosen.
  sel.innerHTML = `<option value="">Choose an event…</option>` + pickupEvents().map((e) => `<option value="${esc(eventLabel(e))}">${esc(e.name)}</option>`).join("");
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
document.addEventListener("realmchange", () => { if ($("#marketList")) renderContactArea(); });
// Search engines can show dated events (like the Sonoran market) in results: describe them in structured data.
function renderEventLd(list) {
  const old = document.getElementById("eventld"); if (old) old.remove();
  const evs = list.filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date || "")).map((e) => {
    const t = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(e.when || ""); let start = e.date;
    if (t) { let h = +t[1] % 12 + (/pm/i.test(t[3]) ? 12 : 0); start = `${e.date}T${String(h).padStart(2, "0")}:${t[2] || "00"}:00-07:00`; }   // Arizona stays on MST all year
    const o = { "@type": "Event", name: e.name, startDate: start, eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: String(e.where || e.name).split(",")[0], address: { "@type": "PostalAddress", streetAddress: e.where || "", addressLocality: "Phoenix", addressRegion: "AZ", addressCountry: "US" } },
      organizer: { "@type": "Organization", name: "Spina & Spiritus", url: "https://spinanspiritus.com/" }, description: `${e.name}. Find Spina & Spiritus (AZ Cactus Doctor) here with rare cacti and succulents.` };
    if (safeUrl(e.url)) o.offers = { "@type": "Offer", url: safeUrl(e.url), price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" };
    return o;
  });
  if (!evs.length) return;
  const sc = document.createElement("script"); sc.type = "application/ld+json"; sc.id = "eventld";
  sc.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": evs });
  document.head.appendChild(sc);
}
function renderContactArea() {
  renderMarketSelect();
  if (!$("#contactEmail")) return;
  $("#contactEmail").textContent = CONFIG.email;
  $("#contactEmail").href = "mailto:" + CONFIG.email;
  $("#contactEmail").setAttribute("data-path", "contact.email");
  const ci = $("#contactInsta"); if (ci) ci.href = CONFIG.instagramUrl;
  const it = $("#contactInstaText"); if (it) { it.textContent = CONFIG.instagram; it.setAttribute("data-path", "contact.instagram"); }
  const ev = upcomingEvents();
  renderEventLd(ev);
  if (SP.editing) {
    $("#marketList").setAttribute("data-sort", "events");
    $("#marketList").innerHTML = ev.map((e, i) => `<li class="ev-edit" data-i="${i}" draggable="true">${dragHandle}<b${editAttrs("events." + i + ".name")}>${esc(e.name)}</b><span${editAttrs("events." + i + ".where")}>${esc(e.where || "")}</span><span class="when"${editAttrs("events." + i + ".when")}>${esc(e.when)}</span><span class="evx"${editAttrs("events." + i + ".except")} data-ph="Not on dates (2026-11-07, …)">${esc(e.except || "")}</span><span class="evx"${editAttrs("events." + i + ".url")} data-ph="Ticket link (https://…)">${esc(e.url || "")}</span><label class="evdate">Hide after <input type="date" data-date="${i}" value="${esc(e.date || "")}"></label><button class="x" data-act="del-event" data-i="${i}" aria-label="Remove event">✕</button></li>`).join("") + `<li class="add-row"><button class="addbtn" data-act="add-event">+ Add an event</button></li>`;
  } else {
    $("#marketList").removeAttribute("data-sort");
    $("#marketList").innerHTML = ev.length ? ev.map((e) => `<li${happeningThisWeek(e) ? ' class="this-week"' : ""}>${happeningThisWeek(e) ? `<span class="ev-week">Happening this week</span>` : ""}<b>${esc(e.name)}</b><span class="ev-side${e.realm === "both" ? " both" : ""}">${e.realm === "both" ? "Spina + Spiritus" : e.realm === "spiritus" ? "Spiritus · Sonoran Mystic Tarot" : "Spina · AZ Cactus Doctor"}</span>${e.where ? `<span>${mapLink(e)}</span>` : ""}<span class="when">${esc(e.when)}</span>${exceptNote(e) ? `<span class="exnote">${esc(exceptNote(e))}</span>` : ""}${ticketLink(e)}${e.where ? `<div class="ev-map"><iframe title="Map to ${esc(e.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(e.where)}&output=embed"></iframe></div>` : ""}</li>`).join("") : `<li><span>New dates will be posted soon.</span></li>`;
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
const SECTION_IDS = ["hero", "spiritus", "book", "spiritBio", "about", "collection", "shop", "events", "faq", "follow", "reviews"];
const builtinEl = (id) => ({ hero: document.querySelector(".hero"), spiritus: $("#spiritus"), book: $("#book"), spiritBio: $("#spiritBio"), about: $("#about"), collection: $("#collection"), shop: $("#shop"), events: $("#events"), faq: $("#faq"), follow: $("#follow"), reviews: $("#reviews") })[id];
function fullOrder() {
  const blocks = SITE.blocks || [], seen = new Set(), out = [];
  const ok = (id) => (SECTION_IDS.includes(id) ? !!builtinEl(id) : blocks.some((b) => b.id === id));
  (SITE.layout || []).forEach((id) => { if (!seen.has(id) && ok(id)) { seen.add(id); out.push(id); } });
  SECTION_IDS.forEach((id) => { if (!seen.has(id) && ok(id)) { seen.add(id); out.push(id); } });
  blocks.forEach((b) => { if (!seen.has(b.id)) { seen.add(b.id); out.push(b.id); } });
  return out;
}
function blockHtml(b, i) {
  const ed = SP.editing, P = (f) => `blocks.${i}.${f}`, layout = ["text", "photo-left", "photo-right", "photo-top", "gallery"].includes(b.layout) ? b.layout : "text", align = ["left", "center", "right"].includes(b.align) ? b.align : "center";
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
if (document.body.dataset.page === "thanks") { cart = []; try { localStorage.removeItem("sp-cart"); } catch (e) {} }   // payment finished: empty the cart
// Back from Stripe: let our server confirm the payment with Stripe so the plants stay reserved (the server asks Stripe itself; it does not trust this page).
if (document.body.dataset.page === "thanks") {
  const sid = new URLSearchParams(location.search).get("s");
  if (sid && /^cs_(live|test)_[A-Za-z0-9]+$/.test(sid)) fetch("/api/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sid }) }).catch(() => {});
  try { history.replaceState(null, "", location.pathname); } catch (e) {}   // keep the payment reference out of the address bar and history
}

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
      shipSize: p.ship_size || "",
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
// Sold-out plants are hidden from the shop (the owner still sees them while editing; a direct plant link still works).
const listed = (p) => SP.editing || !isOut(p);
const isSale = (p) => /sale/i.test(p.status) && p.salePrice > 0 && p.salePrice < p.price;
const now = (p) => (isSale(p) ? p.salePrice : p.price);
const noPrice = (p) => now(p) <= 0;
const priceHtml = (p) => (noPrice(p) ? "Ask for price" : isSale(p) ? `<s>${money(p.price)}</s> ${money(p.salePrice)}` : money(p.price));
const banner = (p) => (isOut(p) ? ["out", "Sold out"] : isSale(p) ? ["sale", "Sale"] : isPre(p) ? ["pre", "Pre-order"] : null);
const isPre = (p) => /pre/i.test(p.status);
const isLow = (p) => /low/i.test(p.status) || (p.stock !== null && p.stock > 0 && p.stock <= 3);
const maxQty = (p) => (p.stock === null ? 20 : Math.max(1, Math.min(20, p.stock)));
const stockLine = (p) => (isOut(p) ? "Currently sold out" : (isPre(p) ? "Available for pre-order" : isSale(p) ? "On sale" : "In stock") + (p.stock === null ? "" : ` — ${p.stock} available`));
// The intention candles (Spiritus side) are not in the plant inventory: one product per scent, price from data/site.json.
const candleProducts = () => { const c = SITE.candles; if (!c || !(Number(c.price) > 0)) return []; return (c.scents || []).map((n) => ({ id: "candle-" + String(n).toLowerCase().replace(/[^a-z]/g, ""), name: n + " Intention Candle", genus: "Candle", category: "Candles", price: Number(c.price), salePrice: 0, stock: null, status: "In Stock", size: "", shipSize: "", description: ((c.descriptions || {})[String(n).toLowerCase().replace(/[^a-z]/g, "")] || ""), images: ["assets/spiritus/candle-table.webp"], isCandle: true })); };
const bookProducts = () => ((SITE.books || []).filter((b) => Number(b.price) > 0).map((b) => ({ id: b.id, name: b.name, genus: "Book", category: "Books", price: Number(b.price), salePrice: 0, stock: null, status: "In Stock", size: "", shipSize: "", description: "", images: [], isBook: true })));
const findProduct = (id) => products.find((x) => x.id === id) || candleProducts().find((x) => x.id === id) || bookProducts().find((x) => x.id === id);
function addToCart(id, qty) {
  const p = findProduct(id); if (!p) return;
  if (noPrice(p) || isOut(p)) return;
  const row = cart.find((c) => c.id === id);
  if (row) row.qty = Math.min(row.qty + qty, maxQty(p)); else cart.push({ id, qty: Math.min(qty, maxQty(p)) });
  saveCart();
}

function renderCats() {
  if (!$("#catList")) return;   // home page shows only a short preview, no catalog sidebar
  const counts = {};
  products.filter(listed).forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
  const cats = ["All", ...Object.keys(counts).sort()];
  $("#catList").innerHTML = cats
    .map((c) => `<li><button class="${c === state.cat ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}<small>${c === "All" ? products.filter(listed).length : counts[c]}</small></button></li>`)
    .join("");
}

function renderProducts() {
  let list = products.filter((p) =>
    listed(p) &&
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
  if (QUICK) list.sort((x, y) => (y.images.length > 0) - (x.images.length > 0));   // plants with photos first (stable within each group)
  const grid = $("#productGrid");
  const preview = isHome && matchMedia("(max-width:760px)").matches;   // phones: short preview on the home page; desktop: the full shop
  grid.toggleAttribute("data-preview", preview);
  if (preview) {   // home page: 9 in-stock plants (with photos first); the rest is on shop.html
    const ok = products.filter((p) => !isOut(p) && !noPrice(p));
    list = [...ok.filter((p) => p.images.length), ...ok.filter((p) => !p.images.length)].slice(0, 9);
  }
  grid.innerHTML = list.length ? list.map(cardHtml).join("") : `<p class="empty">No plants match your selection.</p>`;
}
const plantSlug = (id) => String(id).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
// In-stock plants have their own real page (plants/<name>.html, built by scripts/build_plants.py); anything else uses the generic page.
const pageUrl = (p) => (p.isCandle ? "index.html?realm=spiritus#spiritus" : isOut(p) ? `plant.html?id=${encodeURIComponent(p.id)}` : `plants/${plantSlug(p.id)}.html`);
const QUICK = true;   // quick "+ Add" button on every plant card; plants with photos are listed first
// Descriptive picture text for screen readers and search: name, plant family, what it is.
// The plant page's Shipping line: the flat fee for this plant (from data/site.json) plus the bare-root note.
function shipLine(p) {
  const sh = SITE.shipping || {}, cls = sh.classes || {}, k = cls[p.shipSize] !== undefined ? p.shipSize : (sh.defaultClass || "medium");
  const fee = sh.enabled && cls[k] !== undefined ? "$" + cls[k] + " flat for this plant, plus $" + (sh.extraPlant ?? 5) + " for each extra plant in the same box. " : "";
  return fee + "Shipped plants arrive bare-root, with no pot; plants picked up at an event come in their pots. Not shipped to California or Hawaii.";
}
function altFor(p) { return `${p.name}${p.genus && !new RegExp("^" + p.genus, "i").test(p.name) ? " (" + p.genus + ")" : ""}, ${p.isBook ? "book" : p.isCandle ? "candle" : "cactus or succulent"} from Spina & Spiritus, Phoenix AZ`; }
function cardHtml(p) {
  const bn = banner(p), badge = bn ? `<span class="banner ${bn[0]}">${bn[1]}</span>` : "";
  const img = p.images[0] ? `<img src="${esc(variant(p.images[0], "thumb"))}" alt="${esc(altFor(p))}" loading="lazy" decoding="async">` : `<div class="ph" data-slot="Photo coming soon">${CACTUS_SVG}</div>`;
  return `<article class="card">
    <a class="card-hit" href="${esc(pageUrl(p))}" data-view="${esc(p.id)}" aria-label="${esc(p.name)}, ${esc(money(now(p)))}">
      <span class="thumb">${badge}${img}<span class="peek">Quick view</span></span>
      <span class="body"><span class="name">${esc(p.name)}</span><span class="price">${priceHtml(p)}</span></span>
    </a>${QUICK && !isOut(p) && !noPrice(p) ? `<button type="button" class="quick-add" data-quick="${esc(p.id)}" aria-label="Add ${esc(p.name)} to your order">+ Add</button>` : ""}</article>`;
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
    $("#qvMain").innerHTML = pics[k] ? `<img src="${esc(variant(pics[k], "web"))}" alt="${esc(altFor(p))}${pics.length > 1 ? " — photo " + (k + 1) + " of " + pics.length : ""}">` : `<div class="ph" data-slot="Photos coming soon">${CACTUS_SVG}</div>`;
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
  if (qvOpener) qvOpener.focus({ preventScroll: true }); qvProduct = null;
}

/* ---------- CART ---------- */
function saveCart() { try { localStorage.setItem("sp-cart", JSON.stringify(cart)); } catch (e) {} renderCart(); }
// The cart lives in the visitor's own browser, so treat it as untrusted: keep only real plants, whole numbers, and never more than we have.
function cleanCart() {
  if (!products.length) return;
  const seen = new Set(), clean = [];
  (Array.isArray(cart) ? cart : []).forEach((c) => {
    if (!c || typeof c.id !== "string" || seen.has(c.id)) return;
    const p = findProduct(c.id); if (!p || isOut(p) || noPrice(p)) return;
    const q = Math.floor(Number(c.qty)); seen.add(c.id);
    clean.push({ id: c.id, qty: Number.isFinite(q) && q > 0 ? Math.min(q, maxQty(p)) : 1 });
  });
  if (JSON.stringify(clean) !== JSON.stringify(cart)) { cart = clean; try { localStorage.setItem("sp-cart", JSON.stringify(cart)); } catch (e) {} }
}
function renderCart() {
  cleanCart();
  const items = cart.map((c) => ({ ...c, p: findProduct(c.id) })).filter((c) => c.p);
  const count = items.reduce((s, c) => s + c.qty, 0);
  $("#cartCount").textContent = count; $("#cartCount").classList.toggle("on", count > 0);
  $("#cartItems").innerHTML = items.length
    ? items.map((c) => `<div class="cart-item">
        <h5>${esc(c.p.name)}</h5><span>${money(now(c.p) * c.qty)}</span>
        <div class="qty"><button data-dec="${esc(c.id)}">−</button>${c.qty}<button data-inc="${esc(c.id)}">+</button></div>
        <button class="rm" data-rm="${esc(c.id)}">Remove</button></div>`).join("")
    : `<div class="cart-empty"><p>Your selection is empty.</p><p class="cart-empty-links"><a href="shop.html">Browse the plants</a><a href="index.html?realm=spiritus#spiritus">Candles &amp; books</a></p></div>`;
  updateTotal(items);
  renderMarketSelect();
  $("#checkout").disabled = !items.length;
}
// Freeze the page behind the cart / quick view so scrolling inside them never moves the page underneath (also works on iPhone).
let lockCount = 0, lockY = 0;
function lockPage(on) {
  if (on) {
    if (lockCount++ === 0) { lockY = window.scrollY; document.body.style.top = -lockY + "px"; document.body.classList.add("lock"); }
  } else if (lockCount > 0 && --lockCount === 0) {
    const root = document.documentElement, prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";   // the page uses smooth scrolling for links; restoring the position must be instant, not an animation from the top
    document.body.classList.remove("lock"); document.body.style.top = ""; window.scrollTo(0, lockY);
    root.style.scrollBehavior = prev;
  }
}
// Optional: email the customer a copy of their reservation (EmailJS, sent from your Gmail). Skipped unless it is set up in CONFIG.
async function sendCustomerCopy(d, lines, notes) {
  if (!CONFIG.emailjsServiceId || !CONFIG.emailjsTemplateId || !CONFIG.emailjsPublicKey || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact)) return;
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id: CONFIG.emailjsServiceId, template_id: CONFIG.emailjsTemplateId, user_id: CONFIG.emailjsPublicKey,
        template_params: { to_email: d.contact, customer_name: d.name, plants: lines, pickup_event: d.market, total: d.total, notes: notes || "-", shop_email: CONFIG.email } }),
    });
    if (!res.ok) { const why = (await res.text().catch(() => "")).slice(0, 160); throw new Error(res.status + " " + why); }
    const fine = $("#orderDone .od-fine"); if (fine) fine.insertAdjacentHTML("beforebegin", `<p class="od-copy">We've also emailed a copy to ${esc(d.contact)}.</p>`);
  } catch (err) {
    // The order itself was already sent; the copy is a bonus. Say so, and show the reason (small) so it can be fixed.
    console.warn("Confirmation email failed:", err);
    const fine = $("#orderDone .od-fine"); if (fine) fine.insertAdjacentHTML("beforebegin", `<p class="od-copy bad">We couldn't email you a copy, but your reservation was received.<br><small>${esc(String(err.message || err).slice(0, 170))}</small></p>`);
  }
}
// Confirmation screen shown right inside the checkout after a reservation is sent.
function showOrderDone(d) {
  const cartEl = $("#cart"); if (!cartEl) return;
  let box = $("#orderDone");
  if (!box) { box = document.createElement("div"); box.id = "orderDone"; box.className = "order-done"; box.setAttribute("role", "status"); cartEl.appendChild(box); }
  const where = String(d.market || "").split(" — ");
  box.innerHTML = `<div class="od-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
    <h3>Order received</h3>
    <p class="od-lead">Thank you, ${esc(d.name)}! We'll have your order ready at the event below and message you at <b>${esc(d.contact)}</b> to confirm.</p>
    <div class="od-card">
      <p class="od-label">Your order</p>
      <ul>${d.items.map((i) => `<li><span>${esc(i.qty)} × ${esc(i.name)}</span><span>${money(i.price)}</span></li>`).join("")}</ul>
      <p class="od-total"><span>Total (pay in person at pickup)</span><b>${esc(d.total)}</b></p>
      <p class="od-label">Pickup</p>
      <p class="od-event">${esc(where[0])}${where[1] ? `<br><span>${esc(where.slice(1).join(" — "))}</span>` : ""}</p>
    </div>
    <p class="od-fine">Nothing was charged. You pay in person at pickup. If anything changes we'll message you.</p>
    <button type="button" class="btn full" id="orderDoneClose">Continue shopping</button>`;
  box.hidden = false; box.scrollTop = 0;
  const btn = $("#orderDoneClose"); btn.onclick = () => toggleCart(false); btn.focus();
}
function hideOrderDone() { const b = $("#orderDone"); if (b) b.hidden = true; }
let cartLocked = false;
function toggleCart(on) {
  $("#cart").classList.toggle("on", on);
  $("#scrim").classList.toggle("on", on);
  $("#cart").setAttribute("aria-hidden", String(!on));
  if (!on) setTimeout(hideOrderDone, 450);   // after the drawer has slid away
  if (on !== cartLocked) { cartLocked = !!on; lockPage(!!on); }
}
function cartLines() {
  return cart.map((c) => ({ ...c, p: findProduct(c.id) })).filter((c) => c.p);
}
// Our own mail service (worker.js, /api/...). If it isn't set up yet, or is down, we quietly fall back to the Formspree form.
async function postApi(path, body) {
  try {
    const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(window.__cf ? { ...body, cf: window.__cf } : body) });
    if (window.turnstile && window.__cfId !== undefined) { window.__cf = ""; try { window.turnstile.reset(window.__cfId); } catch (e) {} }   // each check can be used once
    if (r.status === 404 || r.status === 405 || r.status >= 500) return { fallback: true };
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch (err) { return { fallback: true }; }
}
// Online payment (Stripe) is offered only when the Worker says it's set up.
let onlinePay = false;
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
function shipCfg() { const c = SITE.shipping; return c && c.enabled && onlinePay ? c : null; }
function shipFee() {
  const c = shipCfg(); if (!c) return 0;
  const cls = c.classes || { small: 10, medium: 15, large: 20 }, rank = ["small", "medium", "large"];
  let top = 0, count = 0;
  for (const l of cartLines()) {
    if (l.p.isCandle || l.p.isBook) continue;   // candles ship free; books have their own flat fee (below)
    const k = rank.includes(l.p.shipSize) ? l.p.shipSize : (c.defaultClass || "medium");
    top = Math.max(top, Math.max(0, rank.indexOf(k))); count += l.qty;
  }
  let fee = count ? Number(cls[rank[top]] || 0) + Number(c.extraPlant || 0) * (count - 1) : 0;
  if (cartLines().some((l) => l.p.isBook) && c.bookFlat !== null && c.bookFlat !== undefined) fee += Number(c.bookFlat) || 0;   // one flat fee per order that has books
  return fee;
}
const booksNeedFee = () => { const c = shipCfg(); return !!c && cartLines().some((l) => l.p.isBook) && (c.bookFlat === null || c.bookFlat === undefined); };
function payMode() { const r = document.querySelector('input[name="pay"]:checked'); return r ? r.value : "pickup"; }
function cartSub(items) { return (items || cartLines()).reduce((s, c) => s + now(c.p) * c.qty, 0); }
function updateTotal(items) {
  const sub = cartSub(items), mode = payMode(), ship = mode === "ship" && shipCfg();
  const t = $("#cartTotal"); if (!t) return;
  t.textContent = money(sub + (ship ? shipFee() : 0));
  const l = $("#totalLabel"); if (l) l.textContent = ship ? "Total with shipping" : "Total (pay at pickup)";
  renderCheckoutHelp();
  const n = $("#shipNote"); if (n) n.textContent = sub > 0 ? (shipFee() > 0 ? `pay online, shipping ${money(shipFee())}` : "pay online, free shipping") : "pay online, shipping added at checkout";
}
function applyPayMode() {
  const mode = payMode(), ship = mode === "ship";
  const sf = $("#shipFields"); if (sf) sf.hidden = !ship;
  const ms = $("#marketSelect"); if (ms) { ms.closest("label").hidden = ship; const pk = $("#marketPicked"); if (pk) pk.hidden = ship || !ms.value; }
  const b = $("#checkout"); if (b) b.textContent = mode === "pickup" ? "Reserve for pickup" : "Continue to secure payment";
  updateTotal();
}
function setupShipping() {
  const so = $("#shipOpt"), sel = $("#shipState");
  if (so) so.hidden = !shipCfg();
  if (sel && !sel.options.length) { const ex = ((SITE.shipping || {}).excludedStates || []); sel.innerHTML = `<option value="">State…</option>` + STATES.filter((x) => !ex.includes(x)).map((x) => `<option>${x}</option>`).join(""); }
  try { const o = JSON.parse(localStorage.getItem("sp-details") || "null"); if (o && sel && o.state && [...sel.options].some((x) => x.value === o.state || x.text === o.state) && !sel.value) sel.value = o.state; } catch (err) {}
  if (!shipCfg()) { const r = document.querySelector('input[name="pay"][value="pickup"]'); if (r && payMode() === "ship") r.checked = true; }
  applyPayMode();
}
// Cloudflare Turnstile: a quiet human check that guards the order and signup forms. Only switched on once its keys are added in Cloudflare.
function loadTurnstile(siteKey) {
  if (window.__cfLoading) return; window.__cfLoading = true;
  const box = document.createElement("div"); box.id = "cfBox"; box.className = "cf-box"; document.body.appendChild(box);
  window.__cfReady = () => { try { window.__cfId = window.turnstile.render("#cfBox", { sitekey: siteKey, appearance: "interaction-only", callback: (t) => { window.__cf = t; }, "expired-callback": () => { window.__cf = ""; }, "error-callback": () => { window.__cf = ""; } }); } catch (e) {} };
  const s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__cfReady"; s.async = true; s.defer = true; document.head.appendChild(s);
}
async function loadPayConfig() {
  try {
    const r = await fetch("/api/pay-config", { cache: "no-store" });
    if (!r.ok) return;
    const cfg = await r.json();
    onlinePay = !!cfg.online;
    const box = $("#payChoice"); if (box) box.hidden = !onlinePay;
    setupShipping();
    if (cfg.turnstile && /^[0-9A-Za-z_-]{10,60}$/.test(cfg.turnstile)) loadTurnstile(cfg.turnstile);
  } catch (e) {}
}
document.addEventListener("change", (e) => { if (e.target && e.target.name === "pay") applyPayMode(); });
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
  const shipping = payMode() === "ship" && shipCfg();
  const market = shipping ? "Shipping" : String(f.get("market") || "");
  if (!market) return say("Please choose which event you'll pick up at.", true);
  if (shipping && booksNeedFee()) return say("Shipping for books isn't set up yet. Please choose pickup at an event.", true);
  const address = shipping ? { line1: String(f.get("addr1") || "").trim(), city: String(f.get("city") || "").trim(), state: String(f.get("state") || ""), zip: String(f.get("zip") || "").trim() } : null;
  if (address && (!address.line1 || !address.city || !address.state || !/^\d{5}(-\d{4})?$/.test(address.zip))) return say("Please fill in your full shipping address.", true);
  const notes = String(f.get("notes") || "").trim().slice(0, 500);
  if (!name || !contact) return say("Please add your name and a phone or email.", true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && contact.replace(/\D/g, "").length < 7) return say("That doesn't look like a phone number or email.", true);
  let last = 0; try { last = +localStorage.getItem("sp-last") || 0; } catch (err) {}
  if (Date.now() - last < 30000) return say("Please wait a moment before sending again.", true);

  const total = money(items.reduce((t, c) => t + now(c.p) * c.qty, 0));
  const lines = items.map((c) => `${c.qty} x ${c.p.name} - ${money(now(c.p) * c.qty)}`).join("\n");
  const summary = `NEW PICKUP RESERVATION\n\nCustomer: ${name}\nContact: ${contact}\nPICKUP EVENT: ${market}\n\nPlease bring these to the event:\n${lines}\n\nTotal: ${total} (pay in person at pickup)\n\nNotes: ${notes || "-"}`;

  const payOnline = (shipping || String(f.get("pay") || "pickup") === "online") && onlinePay;
  btn.disabled = true; say(payOnline ? "Taking you to secure payment…" : "Sending…");
  const api = await postApi("/api/order", { items: items.map((c) => ({ id: c.id, qty: c.qty })), name, contact, market, notes, website: "", back: location.pathname + location.search, realm: document.documentElement.getAttribute("data-realm") === "spiritus" ? "spiritus" : "spina", pay: shipping ? "ship" : payOnline ? "online" : "pickup", ...(address ? { address } : {}) });
  if (payOnline) {   // Stripe's own secure page takes the payment; we come back to thanks.html afterwards
    if (api.ok && api.data && /^https:\/\/checkout\.stripe\.com\//.test(api.data.checkoutUrl || "")) { try { if (onHome) saveReturn(); sessionStorage.setItem("sp-restore", "1"); } catch (e) {} location.href = api.data.checkoutUrl; return; }   // Back from Stripe lands exactly where they were
    say(api.data && api.data.error ? api.data.error : "Online payment isn't available right now. Please choose pay at pickup.", true); btn.disabled = false; return;
  }
  if (api.ok) {
    try { localStorage.setItem("sp-last", String(Date.now())); } catch (err) {}
    const done = { items: items.map((c) => ({ name: c.p.name, qty: c.qty, price: now(c.p) * c.qty })), total, market, name, contact };
    cart = []; saveCart(); form.reset(); say("");
    showOrderDone(done);
    if (api.data && api.data.held) { const fine0 = $("#orderDone .od-fine"); if (fine0) fine0.insertAdjacentHTML("beforebegin", `<p class="od-copy">We're holding these for you for up to ${Math.max(1, Math.min(30, Number(api.data.holdDays) || 7))} days.</p>`); }
    if (api.data && api.data.copy) { const fine = $("#orderDone .od-fine"); if (fine) fine.insertAdjacentHTML("beforebegin", `<p class="od-copy">We've also emailed a copy to ${esc(contact)}.</p>`); }
    btn.disabled = !cartLines().length;
    return;
  }
  if (!api.fallback) { say((api.data && api.data.error) || "Couldn't send that. Please try again.", true); btn.disabled = false; return; }   // e.g. out of stock, slow down
  btn.disabled = false;
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
        // Field order = the order they appear in your email: plants, pickup event, then the customer's details.
        _subject: `Plant reservation: ${name} (${total})`,
        "1. Plants": lines,
        "2. Pickup event": market,
        "3. Name": name,
        "4. Phone or email": contact,
        "5. Total (pay at pickup)": total,
        "6. Notes": notes || "-",
        email: /@/.test(contact) ? contact : undefined,
      }),
    });
    if (!res.ok) throw new Error(res.status);
    try { localStorage.setItem("sp-last", String(Date.now())); } catch (err) {}
    const done = { items: items.map((c) => ({ name: c.p.name, qty: c.qty, price: now(c.p) * c.qty })), total, market, name, contact };
    cart = []; saveCart(); form.reset(); say("");
    showOrderDone(done);
    sendCustomerCopy(done, lines, notes);
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
  const planta = e.target.closest('a[href^="plant.html"], a[href^="plants/"]');
  if (planta && onHome) saveReturn();
  const t = e.target.closest("button, a");
  if (!t) return;
  if (t.dataset.cat) { state.cat = t.dataset.cat; renderCats(); renderProducts(); if ($("#filters")) $("#filters").classList.remove("on"); }
  else if (t.id === "backShop") { try { if (sessionStorage.getItem(RET_KEY)) sessionStorage.setItem("sp-restore", "1"); } catch (err) {} }
  else if (t.dataset.view && $("#qv") && !SP.editing && !matchMedia("(max-width:760px)").matches) { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); openQuickView(t.dataset.view, t); }
  else if (t.id === "plantAdd" && plantCurrent) {
    addToCart(plantCurrent.id, Math.max(1, Math.min(maxQty(plantCurrent), parseInt($("#plantQty").value, 10) || 1)));
    addedToast(plantCurrent.name);
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
    saveCart(); addedToast((findProduct(t.dataset.id) || {}).name);
  }
  else if (t.dataset.quick) { addToCart(t.dataset.quick, 1); addedToast((findProduct(t.dataset.quick) || {}).name); }
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
  const apiRes = await postApi("/api/signup", { email, website: "" });
  if (apiRes.ok) { try { localStorage.setItem("sp-signup", String(Date.now())); } catch (err) {} form.reset(); say("You're on the list. We'll email you each week when we update the inventory."); return; }
  if (!apiRes.fallback) { say((apiRes.data && apiRes.data.error) || "Couldn't sign you up just now. Please try again.", true); return; }
  const endpoint = CONFIG.signupEndpoint || CONFIG.orderEndpoint;
  if (!endpoint) { location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Add me to the weekly inventory update list")}&body=${encodeURIComponent("Please email me each week when the inventory is updated.\n\n" + email)}`; return; }
  btn.disabled = true; say("Sending…");
  try {
    const res = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: CONFIG.web3formsKey || undefined, _subject: "Weekly inventory email signup: " + email, subject: "Weekly inventory email signup: " + email, from_name: "Spina & Spiritus website", email, type: "new-arrivals-signup", message: "Please add " + email + " to the weekly inventory update list." }),
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
  const id = document.body.dataset.plantId || new URLSearchParams(location.search).get("id");
  const p = products.find((x) => x.id === id);
  if (!p) {
    setMeta('meta[name="robots"]', "content", "noindex");
    root.innerHTML = `<div class="wrap narrow center"><p class="eyebrow">Not found</p><h1 class="plant-title">That plant isn't available</h1><p class="sub">It may have sold or moved. Browse everything currently available.</p><p><a class="btn" id="backShop" href="index.html#shop">Back to the shop</a></p></div>`;
    return;
  }
  plantCurrent = p;
  const url = `https://spinanspiritus.com/plants/${plantSlug(p.id)}.html`;
  const desc = (p.description && !/^placeholder/i.test(p.description) ? p.description : `${p.name} — ${p.category}. Reserve online and we'll bring it to your next Arizona farmers market.`).slice(0, 300);
  if (!document.body.dataset.static) {   // the generic page (plant.html?id=…): point search engines at the real page
    document.title = `${p.name} for Sale in Phoenix, AZ | Spina & Spiritus`;
    setMeta('meta[name="description"]', "content", desc);
    setMeta('link[rel="canonical"]', "href", url);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:title"]', "content", `${p.name} · Spina & Spiritus`);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[name="robots"]', "content", "noindex, follow");
  }
  const pics = p.images, bn = banner(p);
  const related = [...products.filter((x) => listed(x) && x.id !== p.id && x.category === p.category), ...products.filter((x) => listed(x) && x.id !== p.id && x.category !== p.category)].slice(0, 4);
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
        <div class="buy-box">
        <div class="buy">
          <div class="qty-box"><button type="button" data-step="-1" aria-label="Less">−</button><input id="plantQty" value="1" inputmode="numeric" aria-label="Quantity" max="${maxQty(p)}"><button type="button" data-step="1" aria-label="More">+</button></div>
          <button class="btn" id="plantAdd" ${isOut(p) || noPrice(p) ? "disabled" : ""}>${isOut(p) ? "Sold out" : noPrice(p) ? "Ask at the market" : `<span data-path="text.addToCart">${esc(addLabel())}</span>`}</button>
        </div>
        <p class="buy-note"><span>Pick it up at an event (free) or have it shipped bare-root, no pot</span><span>Secure checkout</span></p>        </div>
        <p class="plant-desc"${SP.editing ? ` data-multiline data-placeholder="Write a description…" data-path="plants.${p.origKey}.description"` : ""}>${esc(p.description || (SP.editing ? "" : "More details coming soon."))}</p>
        <dl class="specs">
          <div><dt>Availability</dt><dd>${esc(stockLine(p))}</dd></div>
          ${p.genus ? `<div><dt>Genus</dt><dd>${products.filter((x) => x.genus === p.genus && !isOut(x)).length >= 2 ? `<a href="genus/${plantSlug(p.genus)}.html"><i>${esc(p.genus)}</i></a>` : `<i>${esc(p.genus)}</i>`}</dd></div>` : ""}
          ${p.size ? `<div><dt>Size</dt><dd>${esc(p.size)}</dd></div>` : ""}
          ${((SITE.care || {}).genus || {})[p.genus] ? `<div><dt>Care</dt><dd>${esc(SITE.care.genus[p.genus])}</dd></div>` : ""}
          <div><dt>Pickup</dt><dd>${upcomingEvents().length ? upcomingEvents().map((e) => `<b>${esc(e.name)}</b><br>${e.where ? mapLink(e) + "<br>" : ""}<span class="when">${esc(e.when)}</span>${exceptNote(e) ? `<br><small>${esc(exceptNote(e))}</small>` : ""}`).join("<br><br>") : "At our next event."}</dd></div>
          <div><dt>Shipping</dt><dd>${shipLine(p)}</dd></div>
        </dl>

      </div>
    </div>
    ${related.length ? `<section class="related"><h2 data-path="text.relatedHeading">${esc((SITE.text && SITE.text.relatedHeading) || "You may also like")}</h2><div class="product-grid">${related.map(cardHtml).join("")}</div></section>` : ""}
  </div>`;
  const show = (k) => {
    $("#plantMain").innerHTML = (bn ? `<span class="banner ${bn[0]}">${bn[1]}</span>` : "") + (pics[k] ? `<img src="${esc(variant(pics[k], "web"))}" alt="${esc(altFor(p))}${pics.length > 1 ? " — photo " + (k + 1) + " of " + pics.length : ""}">` : `<div class="ph" data-slot="Photos coming soon">${CACTUS_SVG}</div>`);
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
  loadPayConfig();
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

// The visual editor was removed. Wipe any leftover editor sign-in from browsers that used it.
try { localStorage.removeItem("sp-gh-token"); sessionStorage.removeItem("sp-edit"); } catch (e) {}

// Spiritus side: the intention candle (photo switcher + scent dropdown).
(function () {
  const SCENTS = {
    essence: ["Essence", "Bright and uplifting. A fragrance for renewal, balance and a clear head."],
    awakening: ["Awakening", "Fresh and energizing. Notes to spark inspiration, awareness and new beginnings."],
    abundance: ["Abundance", "Warm and welcoming. A blend for gratitude, prosperity and good flow."],
    meditation: ["Meditation", "Calm and quiet. An aroma for reflection, mindfulness and spiritual practice."],
    frankincense: ["Frankincense", "Rich, grounding and timeless. A sacred scent for prayer, meditation and inner connection."],
    passion: ["Passion", "Vibrant and captivating. A fragrance for creativity, confidence and heartfelt expression."],
  };
  function init() {
    const box = document.getElementById("candleScents"), txt = document.getElementById("candleScentText");
    if (!box || !txt) return;
    let current = "essence";
    const show = () => { const s = SCENTS[current]; if (s) { txt.innerHTML = "<b></b> <span></span>"; txt.firstChild.textContent = s[0] + "."; txt.lastChild.textContent = s[1]; } };
    box.querySelectorAll(".scent-btn").forEach((b) => b.addEventListener("click", () => {
      current = b.getAttribute("data-scent");
      box.querySelectorAll(".scent-btn").forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", on ? "true" : "false"); });
      show();
    })); show();
    const add = document.getElementById("candleAdd");
    if (add) add.addEventListener("click", () => { addToCart("candle-" + current, 1); add.textContent = "Added. Add another?"; setTimeout(() => { add.textContent = "Add to cart"; }, 2200); addedToast(SCENTS[current][0] + " Intention Candle"); });
    const main = document.getElementById("candleMain");
    document.querySelectorAll(".candle-thumbs button").forEach((b) => b.addEventListener("click", () => {
      main.src = b.getAttribute("data-src"); main.alt = b.getAttribute("data-alt");
      document.querySelectorAll(".candle-thumbs button").forEach((x) => x.classList.toggle("on", x === b));
    }));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

// On phones, open Instagram profiles in the Instagram app (where the visitor is already signed in) so there is no login wall;
// if the app is not installed we fall back to the normal web page after a moment.
document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("a[data-ig]");
  if (!a || !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
  e.preventDefault();
  const web = a.href, user = encodeURIComponent(a.getAttribute("data-ig"));
  let left = false; const onHide = () => { left = true; };
  document.addEventListener("visibilitychange", onHide, { once: true }); addEventListener("pagehide", onHide, { once: true });
  location.href = "instagram://user?username=" + user;
  setTimeout(() => { if (!left && !document.hidden) window.open(web, "_blank", "noopener"); }, 1400);
});

// The Spina & Spiritus logo in the header: on the home page it scrolls to the very top; from other pages it opens the home page at the top.
document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("a.brand");
  if (!a || !document.querySelector(".hero")) return;
  e.preventDefault();
  try { sessionStorage.setItem("sp-y", "0"); } catch (err) {}
  history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Spiritus side: front / back cover switcher for each book.
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest(".book-thumbs button");
  if (!b) return;
  const g = b.closest(".book-gallery"), main = g && g.querySelector(".book-main"); if (!main) return;
  main.src = b.getAttribute("data-src"); main.alt = b.getAttribute("data-alt");
  g.querySelectorAll(".book-thumbs button").forEach((x) => x.classList.toggle("on", x === b));
});

// Spiritus side: Add to cart for the books.
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest("[data-add-spirit]");
  if (!b) return;
  if (!findProduct(b.getAttribute("data-add-spirit"))) { const t0 = b.textContent; b.textContent = "Price coming soon"; setTimeout(() => { b.textContent = t0; }, 2200); return; }   // a book without a price yet
  addToCart(b.getAttribute("data-add-spirit"), 1);
  const t = b.textContent; b.textContent = "Added. Add another?"; setTimeout(() => { b.textContent = t; }, 2200);
  addedToast((findProduct(b.getAttribute("data-add-spirit")) || {}).name);
});

// Book price lines: show the real price from data/site.json (so the page and the cart can never disagree).
function fillBookPrices() {
  document.querySelectorAll("[data-book-price]").forEach((el) => {
    const p = findProduct(el.getAttribute("data-book-price")), b = el.querySelector("b");
    if (p && b) b.textContent = money(p.price);
  });
}
siteReady.then(fillBookPrices);

// ---- Checkout help: breakdown, plain-language notes, and no surprises ----
function cartMix() { const L = cartLines(); return { plants: L.some((l) => !l.p.isCandle && !l.p.isBook), candles: L.some((l) => l.p.isCandle), books: L.some((l) => l.p.isBook), n: L.length }; }
function renderCheckoutHelp() {
  const form = $("#orderForm"); if (!form) return;
  restoreDetails(); renderCheckoutSteps();
  const m = cartMix(), mode = payMode(), shipping = mode === "ship" && shipCfg(), sub = cartSub();
  // 1) the legend says what the choice is really about
  const lg = $("#payChoice legend"); if (lg && lg.textContent !== "How would you like to get your order?") lg.textContent = "How would you like to get your order?";
  // 2) books can't ship until a flat fee is set: say so, and keep that choice from being picked
  const radio = document.querySelector('input[name="pay"][value="ship"]'), needFee = booksNeedFee();
  if (radio) { radio.disabled = needFee; const opt = radio.closest("label"); if (opt) opt.classList.toggle("is-off", needFee); }
  if (needFee && mode === "ship") { const p = document.querySelector('input[name="pay"][value="pickup"]'); if (p) { p.checked = true; applyPayMode(); return; } }
  // 3) price breakdown
  let box = $("#cartLines");
  if (!box) { box = document.createElement("div"); box.id = "cartLines"; box.className = "cart-lines"; const tot = form.querySelector(".cart-total"); if (tot) tot.before(box); }
  if (!m.n) { box.innerHTML = ""; } else {
    const fee = shipping ? shipFee() : 0;
    const est = !shipping && shipCfg() && !needFee ? `<div class="est"><span>If shipped to you</span><span>${shipFee() > 0 ? "+" + money(shipFee()) : "Free shipping"}</span></div>` : "";
    box.innerHTML = `<div><span>Subtotal</span><span>${money(sub)}</span></div>` +
      (shipping ? `<div><span>Shipping</span><span>${fee > 0 ? money(fee) : "Free"}</span></div>` : `<div><span>Pickup at an event</span><span>Free</span></div>`) + est;
  }
  // 4) one clear note about what happens next
  let note = $("#cartNote");
  if (!note) { note = document.createElement("p"); note.id = "cartNote"; note.className = "cart-note"; const msg = $("#formMsg"); if (msg) msg.before(note); }
  const parts = [];
  if (!m.n) parts.push("");
  else if (shipping) {
    parts.push("You'll pay on Stripe's secure page with any major card, Apple Pay or Google Pay. We never see your card details.");
    if (m.plants) parts.push("Plants ship bare-root (no pot).");
    if (m.candles && !m.plants && !m.books) parts.push("Candles ship free.");
    else if (m.books) parts.push("Books ship for one flat fee per order.");
    parts.push("We ship across the US except California and Hawaii. We'll message you when your order ships.");
  } else {
    parts.push("Nothing is charged now. You pay in person at the event (cash or card), and we'll message you to confirm.");
    if (needFee) parts.push("Books can be picked up at an event for now. Shipping for books is coming soon.");
    else if (document.querySelector('input[name="pay"][value="ship"]') && !(radio && radio.closest("label").hidden)) parts.push("Prefer it delivered? Choose Ship to me above.");
  }
  note.textContent = parts.join(" "); note.hidden = !m.n;
  // 5) the fine print matches the cart (no plant talk for a candle-only order)
  const fine = form.querySelector(".fine");
  if (fine) fine.textContent = (shipping ? "We'll pack your order and message you when it ships. " : (m.plants ? "We don't bring every plant to every event, so your reservation tells us what to pack. We'll message you to confirm. " : "We'll message you to confirm. ")) + "We only use your details to arrange your order.";
}

// ---- "Added to your order" confirmation: small and out of the way, instead of covering the page with the whole drawer ----
let toastTimer = 0;
function addedToast(name) {
  let t = $("#addedToast");
  if (!t) { t = document.createElement("div"); t.id = "addedToast"; t.className = "added-toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); document.body.appendChild(t); }
  const n = cart.reduce((s, c) => s + c.qty, 0), sub = money(cartSub());
  t.innerHTML = `<span class="at-check" aria-hidden="true">✓</span><span class="at-text"><b></b><small>${n} ${n === 1 ? "item" : "items"} · ${sub}</small></span><button type="button" class="at-view" data-toast="cart">View order</button><button type="button" class="at-x" data-toast="close" aria-label="Dismiss">×</button>`;
  t.querySelector("b").textContent = (name ? name + " " : "") + "added";
  t.classList.add("on"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("on"), 5000);
  const bag = $("#cartOpen"); if (bag) { bag.classList.remove("pulse"); void bag.offsetWidth; bag.classList.add("pulse"); }
}
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest("[data-toast]"); if (!b) return;
  const t = $("#addedToast"); if (t) t.classList.remove("on");
  if (b.dataset.toast === "cart") toggleCart(true);
});

// ---- Checkout progress: 1 Order, 2 Your details, 3 Pay ----
function renderCheckoutSteps() {
  const form = $("#orderForm"); if (!form) return;
  let ol = $("#checkoutSteps");
  if (!ol) { ol = document.createElement("ol"); ol.id = "checkoutSteps"; ol.className = "co-steps"; ol.setAttribute("aria-label", "Checkout steps"); form.prepend(ol); }
  const has = cartLines().length > 0, f = new FormData(form), mode = payMode();
  const detailsDone = String(f.get("name") || "").trim() && String(f.get("contact") || "").trim() && (mode === "ship" ? String(f.get("addr1") || "").trim() && String(f.get("city") || "").trim() && f.get("state") && String(f.get("zip") || "").trim() : String(f.get("market") || ""));
  const cls = (done, now) => (done ? "done" : now ? "now" : "");
  const s1 = has, s2 = has && detailsDone;
  ol.innerHTML = `<li class="${cls(s1, !s1)}"><i>${s1 ? "✓" : "1"}</i><span>Order</span></li><li class="${cls(s2, s1 && !s2)}"><i>${s2 ? "✓" : "2"}</i><span>Details</span></li><li class="${cls(false, s2)}"><i>3</i><span>${mode === "pickup" ? "Pickup" : "Pay"}</span></li>`;
}
document.addEventListener("input", (e) => { if (e.target.closest && e.target.closest("#orderForm")) { renderCheckoutSteps(); saveDetails(); } });
document.addEventListener("change", (e) => { if (e.target.closest && e.target.closest("#orderForm")) { renderCheckoutSteps(); saveDetails(); } });

// ---- Remember my details on this device (browser storage only; never sent anywhere until you check out) ----
const DET_KEY = "sp-details", DET_FIELDS = ["name", "contact", "addr1", "city", "state", "zip"];
function saveDetails() {
  const form = $("#orderForm"); if (!form) return;
  try {
    const keep = form.querySelector("#rememberMe"); if (keep && !keep.checked) { localStorage.removeItem(DET_KEY); return; }
    const o = {}; DET_FIELDS.forEach((k) => { const el = form.elements[k]; if (el && el.value) o[k] = String(el.value).slice(0, 120); });
    localStorage.setItem(DET_KEY, JSON.stringify(o));
  } catch (err) {}
}
function restoreDetails() {
  const form = $("#orderForm"); if (!form || form.dataset.restored) return;
  form.dataset.restored = "1";
  if (!form.querySelector("#rememberMe")) {
    const lab = document.createElement("label"); lab.className = "remember"; lab.innerHTML = `<input type="checkbox" id="rememberMe" checked> <span>Remember my details on this device</span>`;
    const msg = $("#formMsg"); (msg || form.lastElementChild).before(lab);
  }
  try {
    const o = JSON.parse(localStorage.getItem(DET_KEY) || "null"); if (!o || typeof o !== "object") return;
    DET_FIELDS.forEach((k) => { const el = form.elements[k]; if (el && !el.value && typeof o[k] === "string") el.value = o[k]; });
  } catch (err) {}
}

// About page: the two jump buttons glide to the bio; everything else jumps instantly (smooth-scrolling the whole long home page lagged).
document.addEventListener("click", (e) => {
  const l = e.target.closest && e.target.closest(".about-jump a"); if (!l) return;
  const t = document.querySelector(l.getAttribute("href")); if (!t) return;
  e.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ---- Gentle fade-in as sections scroll into view ----
// Only things that start BELOW the first screen are hidden, and only after the page has loaded, so nothing flashes or stays hidden if JavaScript or the observer fails.
(function () {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const SEL = ".section, .trust, .bcard, .review-row, .rcard, .footer .signup";
  function start() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("rv-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0 });
    document.querySelectorAll(SEL).forEach((el) => {
      if (el.closest(".cart,.qv-wrap") || el.dataset.rv) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.top < innerHeight * 0.9 || SP.editing) return;   // already on screen (or hidden for now): leave it alone
      el.dataset.rv = "1"; el.classList.add("rv"); io.observe(el);
    });
    setTimeout(() => document.querySelectorAll(".rv:not(.rv-in)").forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add("rv-in"); }), 1500);
  }
  let st = 0;   // safety net: once scrolling stops, anything on screen that is still hidden is shown (e.g. after a link jumps far down the page)
  addEventListener("scroll", () => { clearTimeout(st); st = setTimeout(() => document.querySelectorAll(".rv:not(.rv-in)").forEach((el) => { const r = el.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) el.classList.add("rv-in"); }), 180); }, { passive: true });
  addEventListener("load", () => setTimeout(start, 400));
  document.addEventListener("realmchange", () => setTimeout(start, 300));
})();

// Books that come in two formats (paperback / hardcover): choosing one changes the price shown and what Add to cart adds.
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest(".fmt-btn"); if (!b) return;
  const box = b.closest(".bcard, .book-info"); if (!box) return;
  box.querySelectorAll(".fmt-btn").forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", on ? "true" : "false"); });
  const id = b.dataset.fmt;
  const pr = box.querySelector("[data-book-price]"); if (pr) { pr.setAttribute("data-book-price", id); const t = pr.matches("b, span") ? pr : pr.querySelector("b"); if (t) t.textContent = b.dataset.price; }
  const fm = box.querySelector(".bcard-format"); if (fm) fm.textContent = b.dataset.label;
  const add = box.querySelector("[data-add-spirit]"); if (add) add.setAttribute("data-add-spirit", id);
});
