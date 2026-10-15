/* Visual editor for the owner. Loaded only when signed in (see edit.html). Changes are saved straight to the
   GitHub repo as ONE commit; the site then redeploys by itself. */
(function () {
  "use strict";
  const SP = window.SP;
  const REPO = { owner: "rumerlaw", repo: "sp-web" };
  const TOKEN = localStorage.getItem("sp-gh-token");
  const $ = (s, r = document) => r.querySelector(s);
  let site = null, branch = "main", dirty = false, busy = false;

  /* ---------- GitHub ---------- */
  async function gh(path, opts = {}) {
    const r = await fetch("https://api.github.com" + path, {
      ...opts,
      headers: { Authorization: "Bearer " + TOKEN, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(opts.body ? { "Content-Type": "application/json" } : {}) },
    });
    if (r.status === 401) { const e = new Error("Your sign-in has expired. Please sign in again."); e.auth = true; throw e; }
    if (r.status === 403 || r.status === 404) throw new Error("GitHub says this sign-in can't edit the site (error " + r.status + "). Make sure the token has Contents: Read and write on the sp-web repository.");
    if (!r.ok) throw new Error("GitHub error " + r.status);
    return r.status === 204 ? null : r.json();
  }
  const rp = `/repos/${REPO.owner}/${REPO.repo}`;
  const b64 = (blob) => new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(String(f.result).split(",")[1]); f.onerror = rej; f.readAsDataURL(blob); });
  const utf8 = (s) => btoa(unescape(encodeURIComponent(s)));

  /* ---------- toolbar ---------- */
  const bar = document.createElement("div");
  bar.className = "ed-bar"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Site editor");
  bar.innerHTML = `<span class="ed-title">✎ Editing</span><span class="ed-msg" id="edMsg">Loading…</span><button class="ed-btn primary" id="edSave" disabled>Save changes</button><button class="ed-btn" id="edExit">Exit</button><button class="ed-btn quiet" id="edOut">Sign out</button>`;
  document.body.appendChild(bar);
  const msg = (t, kind) => { const m = $("#edMsg"); m.textContent = t; m.dataset.kind = kind || ""; };
  const markDirty = () => { if (!dirty) { dirty = true; $("#edSave").disabled = false; msg("You have unsaved changes", "warn"); } };

  /* ---------- load latest content ---------- */
  async function start() {
    try {
      const repo = await gh(rp);
      if (!repo.permissions || !repo.permissions.push) throw new Error("This sign-in can read the site but not change it. Create a token with Contents: Read and write.");
      branch = repo.default_branch || "main";
      let loaded = null;
      try {
        const f = await gh(`${rp}/contents/data/site.json?ref=${encodeURIComponent(branch)}`);
        loaded = JSON.parse(decodeURIComponent(escape(atob(f.content.replace(/\n/g, "")))));
      } catch (e) { if (e.auth) throw e; }
      site = Object.assign({ text: {}, images: {}, plants: {}, links: {}, align: {}, size: {}, hidden: {}, blocks: [], layout: [] }, loaded || SP.getSite());
      SP.setSite(site);
      SP.editing = true;
      document.body.classList.add("editing");
      SP.applyPlantOverrides();
      SP.renderAll();
      refresh();
      msg("Click any text to edit it. Click a photo to replace it. Drag ⠿ to reorder.", "");
    } catch (e) {
      msg(e.message, "bad");
      if (e.auth) { localStorage.removeItem("sp-gh-token"); setTimeout(() => (location.href = "edit.html"), 2500); }
    }
  }

  /* ---------- text editing ---------- */
  function refresh() {
    document.querySelectorAll("[data-path]").forEach((el) => {
      el.contentEditable = "true"; el.spellcheck = true; el.classList.add("ed-text");
      if (!el.title) el.title = "Click to edit";
    });
    document.querySelectorAll(".drag").forEach((h) => { const it = h.closest("[data-i]"); if (it) it.draggable = false; });
    document.querySelectorAll("[data-img]").forEach((el) => { el.classList.add("ed-img"); if (!el.title) el.title = "Click to replace this photo"; });
    chrome();
  }
  document.addEventListener("input", (e) => {
    const el = e.target.closest && e.target.closest("[data-path]");
    if (el && SP.editing) {
      const v = el.textContent.replace(/ /g, " ");
      SP.setPath(site, el.dataset.path, v.trim() === "" && !el.hasAttribute("data-multiline") ? "" : v);
      if (el.dataset.path === "contact.email") { const a = $("#contactEmail"); if (a) a.href = "mailto:" + v.trim(); }
      if (el.dataset.path === "contact.instagram") { const a = $("#contactInsta"); if (a) a.href = "https://instagram.com/" + encodeURIComponent(v.trim().replace(/^@/, "")); }
      SP.applyPaths(); markDirty();
      return;
    }
    const alt = e.target.closest && e.target.closest("[data-alt]");
    if (alt) { site.collection[+alt.dataset.alt].alt = alt.value; markDirty(); return; }
    const dt = e.target.closest && e.target.closest("[data-date]");
    if (dt) { site.events[+dt.dataset.date].date = dt.value; markDirty(); }
  });
  document.addEventListener("keydown", (e) => {
    const el = e.target.closest && e.target.closest("[data-path]");
    if (!el || e.key !== "Enter") return;
    e.preventDefault();
    if (el.hasAttribute("data-multiline")) document.execCommand("insertText", false, "\n"); else el.blur();
  });
  document.addEventListener("paste", (e) => {
    const el = e.target.closest && e.target.closest("[data-path]");
    if (!el) return;
    e.preventDefault();
    let t = (e.clipboardData || window.clipboardData).getData("text/plain");
    if (!el.hasAttribute("data-multiline")) t = t.replace(/\s*\n\s*/g, " ");
    document.execCommand("insertText", false, t);
  });
  document.addEventListener("click", (e) => { const a = e.target.closest && e.target.closest("a[data-path]"); if (a) e.preventDefault(); }, true);

  /* ---------- images (resized + cleaned in the browser: no hidden GPS/camera data) ---------- */
  async function toCanvas(file, max) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch (e) { throw new Error("That photo format isn't supported by this browser. Please use a JPG or PNG."); }
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
    return c;
  }
  const toBlob = (c, q) => new Promise((res) => c.toBlob(res, "image/jpeg", q));
  async function processFile(file) {
    if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) throw new Error(file.name + " isn't a photo.");
    if (file.size > 40e6) throw new Error(file.name + " is too large (over 40 MB).");
    const full = await toBlob(await toCanvas(file, 1400), 0.82);
    const thumb = await toBlob(await toCanvas(file, 480), 0.8);
    const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const path = "assets/uploads/" + name;
    SP.pending[path] = { url: URL.createObjectURL(full), full, thumb, thumbPath: "assets/uploads/thumb/" + name };
    return path;
  }
  async function processMany(files) {
    const out = [];
    for (const f of files) {
      try { msg("Preparing " + f.name + "…"); out.push(await processFile(f)); }
      catch (err) { msg(err.message, "bad"); }
    }
    return out;
  }
  function pick(multiple) {
    return new Promise((res) => {
      const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.multiple = !!multiple;
      i.onchange = () => res([...i.files]); i.click();
    });
  }

  /* ---------- lists: add / remove / reorder ---------- */
  const lists = {
    events: { get: () => site.events || (site.events = []), set: (a) => (site.events = a) },
    faq: { get: () => site.faq || (site.faq = []), set: (a) => (site.faq = a) },
    collection: { get: () => site.collection || (site.collection = []), set: (a) => (site.collection = a) },
    paragraphs: { get: () => { site.about = site.about || {}; return site.about.paragraphs || (site.about.paragraphs = []); }, set: (a) => (site.about.paragraphs = a) },
    plantimgs: { get: () => SP.plantImages().slice(), set: (a) => SP.setPlantImages(a) },
  };
  const getList = (key) => {
    if (key.startsWith("blockimgs:")) { const b = site.blocks[+key.split(":")[1]]; return { get: () => b.images || (b.images = []), set: (a) => (b.images = a) }; }
    return lists[key];
  };
  const rerender = () => { SP.renderAll(); refresh(); markDirty(); };
  async function addImages(listKey, files) {
    const paths = await processMany(files);
    if (!paths.length) return;
    if (listKey.startsWith("blockimgs:")) getList(listKey).get().push(...paths);
    else if (listKey === "collection") lists.collection.get().push(...paths.map((p) => ({ image: p, alt: "Plant from my personal collection" })));
    else if (listKey === "plantimgs") { lists.plantimgs.set(lists.plantimgs.get().concat(paths)); refresh(); markDirty(); msg("Photos added. Remember to save.", "warn"); return; }
    rerender(); msg("Photos added. Remember to save.", "warn");
  }
  document.addEventListener("click", async (e) => {
    const t = e.target.closest && e.target.closest("[data-act]");
    if (t && SP.editing) {
      const i = +t.dataset.i, act = t.dataset.act;
      const ask = (q) => window.confirm(q);
      if (act === "add-event") { lists.events.get().push({ name: "New event", where: "", when: "Date and time", date: "" }); rerender(); }
      else if (act === "del-event") { if (ask("Remove this event?")) { lists.events.get().splice(i, 1); rerender(); } }
      else if (act === "add-faq") { lists.faq.get().push({ q: "New question?", a: "Write the answer here." }); rerender(); }
      else if (act === "del-faq") { if (ask("Remove this question?")) { lists.faq.get().splice(i, 1); rerender(); } }
      else if (act === "add-para") { lists.paragraphs.get().push("New paragraph. Click to write."); rerender(); }
      else if (act === "del-para") { if (ask("Remove this paragraph?")) { lists.paragraphs.get().splice(i, 1); rerender(); } }
      else if (act === "del-coll") { if (ask("Remove this photo from the collection?")) { lists.collection.get().splice(i, 1); rerender(); } }
      else if (act === "add-coll") { const f = await pick(true); if (f.length) addImages("collection", f); }
      else if (act === "add-pimg") { const f = await pick(true); if (f.length) addImages("plantimgs", f); }
      else if (act === "sec-up" || act === "sec-down") { const o = SP.fullOrder(), k = o.indexOf(t.dataset.id), j = act === "sec-up" ? k - 1 : k + 1; if (k > -1 && j > -1 && j < o.length) { [o[k], o[j]] = [o[j], o[k]]; site.layout = o; rerender(); const el = SP.builtinEl(t.dataset.id) || document.getElementById(t.dataset.id); if (el) el.scrollIntoView({ block: "center" }); } }
      else if (act === "sec-hide") { site.hidden = site.hidden || {}; site.hidden[t.dataset.id] = !site.hidden[t.dataset.id]; rerender(); }
      else if (act === "sec-add") { openMenu(t); }
      else if (act === "sec-new") { newBlock(t.dataset.type, t.dataset.after); closeMenu(); }
      else if (act === "blk-del") { if (ask("Delete this whole section?")) { const k = site.blocks.findIndex((b) => b.id === t.dataset.id); if (k > -1) site.blocks.splice(k, 1); site.layout = (site.layout || []).filter((x) => x !== t.dataset.id); rerender(); } }
      else if (act === "blk-align") { site.blocks[+t.dataset.b].align = t.dataset.v; rerender(); }
      else if (act === "blk-add-btn") { const b = site.blocks[+t.dataset.b]; (b.buttons = b.buttons || []).push({ label: "New button", url: "#shop" }); rerender(); }
      else if (act === "blk-del-btn") { site.blocks[+t.dataset.b].buttons.splice(+t.dataset.j, 1); rerender(); }
      else if (act === "blk-del-img") { site.blocks[+t.dataset.b].images.splice(i, 1); rerender(); }
      else if (act === "blk-add-imgs") { const f = await pick(true); if (f.length) addImages("blockimgs:" + t.dataset.b, f); }
      else if (act === "del-pimg") { const l = lists.plantimgs.get(); l.splice(i, 1); lists.plantimgs.set(l); refresh(); markDirty(); }
      return;
    }
    const img = e.target.closest && e.target.closest("[data-img]");
    if (img && SP.editing && !e.target.closest("[data-act]")) {
      const f = await pick(false); if (!f.length) return;
      const [p] = await processMany(f); if (!p) return;
      SP.setPath(site, img.dataset.img, p); SP.renderAll(); refresh(); markDirty(); msg("Photo replaced. Remember to save.", "warn");
    }
  });

  /* drag: reorder (handles / photos) and drop files */
  let dragFrom = null;
  document.addEventListener("mousedown", (e) => {
    const h = e.target.closest && e.target.closest(".drag");
    if (h) { const it = h.closest("[data-i]"); if (it) it.draggable = true; }
    if (e.target.closest && e.target.closest(".ce-alt")) { const it = e.target.closest("[data-i]"); if (it) it.draggable = false; }
  });
  document.addEventListener("dragstart", (e) => {
    const it = e.target.closest && e.target.closest("[data-i][draggable='true']");
    const box = it && it.closest("[data-sort]");
    if (!it || !box) return;
    dragFrom = { key: box.dataset.sort, i: +it.dataset.i, el: it };
    e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "sp-reorder");
    setTimeout(() => it.classList.add("dragging"), 0);
  });
  document.addEventListener("dragend", () => { document.querySelectorAll(".dragging,.drop-over").forEach((n) => n.classList.remove("dragging", "drop-over")); if (dragFrom && dragFrom.el.classList.contains("drag-ready")) dragFrom.el.draggable = false; dragFrom = null; document.querySelectorAll(".drag").forEach((h) => { const it = h.closest("[data-i]"); if (it) it.draggable = false; }); });
  document.addEventListener("dragover", (e) => {
    const box = e.target.closest && (e.target.closest("[data-sort]") || e.target.closest("[data-drop]") || e.target.closest("[data-img]"));
    const hasFiles = e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files");
    if (!box || !(dragFrom || hasFiles)) return;
    e.preventDefault(); e.dataTransfer.dropEffect = dragFrom ? "move" : "copy";
    document.querySelectorAll(".drop-over").forEach((n) => n.classList.remove("drop-over"));
    const it = e.target.closest("[data-i]"); (dragFrom && it ? it : box).classList.add("drop-over");
  });
  document.addEventListener("drop", async (e) => {
    const files = e.dataTransfer && [...e.dataTransfer.files].filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
    document.querySelectorAll(".drop-over").forEach((n) => n.classList.remove("drop-over"));
    if (files && files.length) {
      const imgT = e.target.closest("[data-img]");
      const dropT = e.target.closest("[data-drop]");
      if (imgT) { e.preventDefault(); const [p] = await processMany([files[0]]); if (p) { SP.setPath(site, imgT.dataset.img, p); SP.renderAll(); refresh(); markDirty(); msg("Photo replaced. Remember to save.", "warn"); } }
      else if (dropT) { e.preventDefault(); const dk = dropT.dataset.drop; addImages(dk === "plant" ? "plantimgs" : dk.startsWith("blockgallery:") ? "blockimgs:" + dk.split(":")[1] : "collection", files); }
      return;
    }
    if (!dragFrom) return;
    const box = e.target.closest("[data-sort]");
    if (!box || box.dataset.sort !== dragFrom.key) { dragFrom = null; return; }
    e.preventDefault();
    const target = e.target.closest("[data-i]");
    const l = getList(dragFrom.key); const arr = l.get();
    let to = target && box.contains(target) ? +target.dataset.i : arr.length - 1;
    const [moved] = arr.splice(dragFrom.i, 1); arr.splice(to, 0, moved);
    l.set(arr); dragFrom = null;
    if (dragFrom === null && box.dataset.sort !== "plantimgs") rerender(); else { refresh(); markDirty(); }
  });
  // keep the browser from opening a photo dropped outside a drop area
  window.addEventListener("dragover", (e) => { if (e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files")) e.preventDefault(); });
  window.addEventListener("drop", (e) => { if (e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files")) e.preventDefault(); });


  /* ---------- sections: toolbars, add menu, new blocks ---------- */
  const NAMES = { hero: "Top banner", about: "About", collection: "Collection photos", shop: "Shop", events: "Events", faq: "Questions" };
  function chrome() {
    document.querySelectorAll(".sec-bar,.add-between").forEach((n) => n.remove());
    if (document.body.dataset.page) return;
    const order = SP.fullOrder();
    order.forEach((id, idx) => {
      const el = SP.builtinEl(id) || document.getElementById(id); if (!el) return;
      el.classList.add("ed-sec");
      const hidden = !!(site.hidden && site.hidden[id]);
      const bi = site.blocks ? site.blocks.findIndex((b) => b.id === id) : -1, b = bi > -1 ? site.blocks[bi] : null;
      let h = `<span class="sb-name">${NAMES[id] || "Your section"}</span><button data-act="sec-up" data-id="${id}" ${idx === 0 ? "disabled" : ""} title="Move up">▲</button><button data-act="sec-down" data-id="${id}" ${idx === order.length - 1 ? "disabled" : ""} title="Move down">▼</button><button data-act="sec-hide" data-id="${id}">${hidden ? "Show" : "Hide"}</button>`;
      if (b) {
        const al = b.align || "center";
        h += `<select data-bf="layout" data-b="${bi}" title="Layout"><option value="text"${b.layout === "text" ? " selected" : ""}>Text only</option><option value="photo-left"${b.layout === "photo-left" ? " selected" : ""}>Photo left</option><option value="photo-right"${b.layout === "photo-right" ? " selected" : ""}>Photo right</option><option value="photo-top"${b.layout === "photo-top" ? " selected" : ""}>Photo on top</option><option value="gallery"${b.layout === "gallery" ? " selected" : ""}>Photo gallery</option></select>`;
        h += ["left", "center", "right"].map((v) => `<button data-act="blk-align" data-b="${bi}" data-v="${v}" class="${al === v ? "on" : ""}" title="Align ${v}">${v === "left" ? "⇤" : v === "center" ? "↔" : "⇥"}</button>`).join("");
        h += `<select data-bf="bg" data-b="${bi}" title="Background"><option value="light"${(b.bg || "light") === "light" ? " selected" : ""}>White</option><option value="cream"${b.bg === "cream" ? " selected" : ""}>Cream</option><option value="green"${b.bg === "green" ? " selected" : ""}>Green</option></select>`;
        h += `<button class="danger" data-act="blk-del" data-id="${id}" title="Delete section">✕</button>`;
      }
      const bar = document.createElement("div"); bar.className = "sec-bar"; bar.innerHTML = h; el.prepend(bar);
      const add = document.createElement("div"); add.className = "add-between"; add.innerHTML = `<button data-act="sec-add" data-after="${id}">+ Add a section here</button>`; el.after(add);
    });
  }
  let menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function openMenu(btn) {
    closeMenu();
    const r = btn.getBoundingClientRect(), after = btn.dataset.after;
    menu = document.createElement("div"); menu.className = "ed-menu";
    menu.innerHTML = [["text", "Text", "A heading and some words"], ["photoLeft", "Photo + text", "Photo on the left"], ["photoRight", "Text + photo", "Photo on the right"], ["gallery", "Photo gallery", "A grid of photos you can add and reorder"], ["buttons", "Buttons", "A row of buttons that link anywhere"]].map(([t, n, d]) => `<button data-act="sec-new" data-type="${t}" data-after="${after}">${n}<small>${d}</small></button>`).join("");
    document.body.appendChild(menu);
    menu.style.left = Math.max(8, Math.min(innerWidth - 260, r.left + r.width / 2 - 120)) + "px";
    menu.style.top = Math.max(8, Math.min(innerHeight - menu.offsetHeight - 90, r.top - 20)) + "px";
  }
  document.addEventListener("mousedown", (e) => { if (menu && !e.target.closest(".ed-menu") && !e.target.closest('[data-act="sec-add"]')) closeMenu(); });
  function newBlock(type, after) {
    const presets = {
      text: { layout: "text", title: "New heading", body: "Write something here.", buttons: [] },
      photoLeft: { layout: "photo-left", title: "New heading", body: "Write something here.", align: "left", buttons: [] },
      photoRight: { layout: "photo-right", title: "New heading", body: "Write something here.", align: "left", buttons: [] },
      gallery: { layout: "gallery", title: "Photos", body: "", images: [], buttons: [] },
      buttons: { layout: "text", title: "", body: "", buttons: [{ label: "Button", url: "#shop" }] },
    };
    const id = "c-" + Math.random().toString(36).slice(2, 8);
    site.blocks = site.blocks || [];
    site.blocks.push(Object.assign({ id, align: "center", bg: "light" }, presets[type] || presets.text));
    const order = SP.fullOrder().filter((x) => x !== id); const k = order.indexOf(after);
    order.splice(k < 0 ? order.length : k + 1, 0, id); site.layout = order;
    rerender();
    const el = document.getElementById(id); if (el) el.scrollIntoView({ block: "center" });
  }
  document.addEventListener("change", (e) => {
    const bf = e.target.closest && e.target.closest("[data-bf]");
    if (bf) { site.blocks[+bf.dataset.b][bf.dataset.bf] = bf.value; rerender(); return; }
    const pf = e.target.closest && e.target.closest("[data-pf]");
    if (pf) {
      const key = SP.plantKey(), f = pf.dataset.pf, v = pf.value.trim();
      if (["price", "salePrice"].includes(f) && v !== "" && isNaN(parseFloat(v.replace(/[^0-9.]/g, "")))) { msg("Please type a number for the price.", "bad"); return; }
      if (f === "stock" && v !== "" && isNaN(parseInt(v, 10))) { msg("Please type a whole number for the stock.", "bad"); return; }
      const ov = (site.plants[key] = site.plants[key] || {});
      if (v === "") delete ov[f]; else ov[f] = ["price", "salePrice"].includes(f) ? v.replace(/[^0-9.]/g, "") : v;
      markDirty(); msg("Product updated. Remember to save.", "warn");
      clearTimeout(pfTimer); pfTimer = setTimeout(pfRefresh, 900);
    }
  });
  let pfTimer = null;
  function pfRefresh() {
    const ae = document.activeElement;
    if (ae && ae.closest && ae.closest(".prod-edit") && ae.tagName === "INPUT") return;   // still typing: refresh when they leave the box
    SP.rerenderPlant(); refresh();
  }
  document.addEventListener("focusout", (e) => {
    if (e.target.closest && e.target.closest(".prod-edit") && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".prod-edit"))) { clearTimeout(pfTimer); pfTimer = setTimeout(pfRefresh, 150); }
  });

  /* ---------- floating format bar: size, alignment, link ---------- */
  const fmt = document.createElement("div");
  fmt.className = "ed-fmt"; fmt.hidden = true;
  fmt.innerHTML = `<button data-f="size-" title="Smaller text">A−</button><button data-f="size+" title="Bigger text">A+</button><span class="sep"></span><button data-f="left" title="Align left">⇤</button><button data-f="center" title="Center">↔</button><button data-f="right" title="Align right">⇥</button><button data-f="reset" title="Undo size and alignment">↺</button><span class="fl" hidden><span class="sep"></span><input type="text" placeholder="Link to… (#shop, https://…)" list="edLinks" aria-label="Button link"></span><datalist id="edLinks"><option value="#shop"><option value="#about"><option value="#collection"><option value="#events"><option value="#contact"><option value="#faq"><option value="faq.html"><option value="mailto:"><option value="https://instagram.com/azcactusdoctor"></datalist>`;
  document.body.appendChild(fmt);
  let cur = null;
  function place() {
    if (!cur) return;
    const r = cur.getBoundingClientRect(); fmt.hidden = false;
    const w = fmt.offsetWidth, h = fmt.offsetHeight;
    let top = r.top - h - 8; if (top < 84) top = Math.min(innerHeight - h - 80, r.bottom + 8);
    fmt.style.top = Math.max(84, top) + "px"; fmt.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left)) + "px";
  }
  function syncFmt() {
    const p = cur.dataset.path, al = (site.align || {})[p];
    fmt.querySelectorAll("[data-f=left],[data-f=center],[data-f=right]").forEach((b) => b.classList.toggle("on", b.dataset.f === al));
    const hp = cur.dataset.hrefPath, fl = fmt.querySelector(".fl"); fl.hidden = !hp;
    if (hp) fmt.querySelector("input").value = SP.getPath(site, hp) || cur.getAttribute("href") || "";
  }
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest && e.target.closest("[data-path]");
    if (el && SP.editing) { cur = el; syncFmt(); place(); }
    else if (!(e.target.closest && e.target.closest(".ed-fmt"))) { cur = null; fmt.hidden = true; }
  });
  document.addEventListener("focusout", (e) => { if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".ed-fmt")) return; setTimeout(() => { if (!document.activeElement || !document.activeElement.closest || (!document.activeElement.closest("[data-path]") && !document.activeElement.closest(".ed-fmt"))) { cur = null; fmt.hidden = true; } }, 120); });
  window.addEventListener("scroll", place, { passive: true }); window.addEventListener("resize", place);
  fmt.addEventListener("mousedown", (e) => { if (e.target.tagName !== "INPUT") e.preventDefault(); });
  fmt.addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]"); if (!b || !cur) return;
    const p = cur.dataset.path; site.align = site.align || {}; site.size = site.size || {};
    const f = b.dataset.f;
    if (f === "left" || f === "center" || f === "right") site.align[p] = site.align[p] === f ? undefined : f;
    else if (f === "size+" || f === "size-") { const v = Math.round(((site.size[p] || 1) + (f === "size+" ? 0.1 : -0.1)) * 10) / 10; site.size[p] = Math.min(2.5, Math.max(0.6, v)); }
    else if (f === "reset") { delete site.align[p]; delete site.size[p]; }
    if (site.align[p] === undefined) delete site.align[p];
    SP.applyPaths(); syncFmt(); place(); markDirty();
  });
  fmt.querySelector("input").addEventListener("input", (e) => {
    if (!cur || !cur.dataset.hrefPath) return;
    SP.setPath(site, cur.dataset.hrefPath, e.target.value.trim());
    SP.applyPaths(); markDirty();
  });
  // clicking a button/link while editing must edit it, not press it
  document.addEventListener("click", (e) => {
    if (!SP.editing) return;
    const t = e.target.closest && e.target.closest("[data-path]");
    if (t && t.closest("a,button")) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* ---------- save: one atomic commit ---------- */
  async function save() {
    if (busy) return; busy = true; $("#edSave").disabled = true; msg("Saving…");
    try {
      const json = JSON.stringify(site, null, 1) + "\n";
      const files = [{ path: "data/site.json", blob: { content: json, encoding: "utf-8" } }];
      for (const [path, p] of Object.entries(SP.pending)) {
        if (!json.includes(path)) continue;
        files.push({ path, blob: { content: await b64(p.full), encoding: "base64" } });
        files.push({ path: p.thumbPath, blob: { content: await b64(p.thumb), encoding: "base64" } });
      }
      for (let attempt = 0; attempt < 2; attempt++) {
        const ref = await gh(`${rp}/git/ref/heads/${encodeURIComponent(branch)}`);
        const parent = await gh(`${rp}/git/commits/${ref.object.sha}`);
        const entries = [];
        for (const f of files) {
          const b = await gh(`${rp}/git/blobs`, { method: "POST", body: JSON.stringify(f.blob) });
          entries.push({ path: f.path, mode: "100644", type: "blob", sha: b.sha });
        }
        const tree = await gh(`${rp}/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: parent.tree.sha, tree: entries }) });
        const commit = await gh(`${rp}/git/commits`, { method: "POST", body: JSON.stringify({ message: "Edit site content (visual editor)", tree: tree.sha, parents: [ref.object.sha] }) });
        try { await gh(`${rp}/git/refs/heads/${encodeURIComponent(branch)}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) }); break; }
        catch (e) { if (attempt === 1) throw e; }
      }
      dirty = false; msg("Saved ✓ Your changes will be live in about a minute.", "ok");
    } catch (e) {
      $("#edSave").disabled = false; msg("Couldn't save: " + e.message, "bad");
      if (e.auth) localStorage.removeItem("sp-gh-token");
    }
    busy = false;
  }

  $("#edSave").addEventListener("click", save);
  $("#edExit").addEventListener("click", () => { if (dirty && !confirm("You have unsaved changes. Leave without saving?")) return; dirty = false; sessionStorage.removeItem("sp-edit"); location.reload(); });
  $("#edOut").addEventListener("click", () => { if (dirty && !confirm("You have unsaved changes. Sign out without saving?")) return; dirty = false; localStorage.removeItem("sp-gh-token"); sessionStorage.removeItem("sp-edit"); location.href = "index.html"; });
  window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  document.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (dirty) save(); } });

  start();
})();
