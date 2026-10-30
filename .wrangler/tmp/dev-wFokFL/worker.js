var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var DEFAULT_ORIGINS = ["https://spinanspiritus.com", "https://www.spinanspiritus.com", "https://sp-web.123workerdev.workers.dev"];
var MAX_BODY = 1e4;
var hits = /* @__PURE__ */ new Map();
var json = /* @__PURE__ */ __name((obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }), "json");
var clean = /* @__PURE__ */ __name((v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max), "clean");
var esc = /* @__PURE__ */ __name((s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]), "esc");
var money = /* @__PURE__ */ __name((n) => "$" + (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }), "money");
var isEmail = /* @__PURE__ */ __name((s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 120, "isEmail");
function limited(ip, kind, max, windowMs) {
  const now = Date.now(), key = kind + ":" + ip;
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return true;
  }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5e3) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return false;
}
__name(limited, "limited");
function parseCsv(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur || row.length) {
    row.push(cur);
    rows.push(row);
  }
  const head = (rows.shift() || []).map((h) => h.trim());
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}
__name(parseCsv, "parseCsv");
async function readAsset(env, request, path) {
  const res = await env.ASSETS.fetch(new Request(new URL(path, request.url).toString()));
  if (!res.ok) throw new Error("asset " + path + " " + res.status);
  return res;
}
__name(readAsset, "readAsset");
async function resend(env, path, payload) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 9e3);
  try {
    const r = await fetch((env.RESEND_API_URL || "https://api.resend.com") + path, {
      method: "POST",
      signal: ctl.signal,
      headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return r.ok;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
__name(resend, "resend");
var shell = /* @__PURE__ */ __name((title, inner) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#24231f"><h2 style="margin:0 0 14px;font-size:20px">${esc(title)}</h2>${inner}</div>`, "shell");
var block = /* @__PURE__ */ __name((label, html) => `<p style="margin:16px 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#a07d3c;font-weight:bold">${esc(label)}</p><div style="font-size:15px;line-height:1.5">${html}</div>`, "block");
async function handleOrder(request, env, body) {
  if (clean(body.website, 50)) return json({ ok: true, copy: false });
  const name = clean(body.name, 80), contact = clean(body.contact, 120), notes = clean(body.notes, 500), market = clean(body.market, 220);
  if (!name || !contact) return json({ error: "Please add your name and a phone or email." }, 400);
  const email = isEmail(contact) ? contact : "";
  if (!email && contact.replace(/\D/g, "").length < 7) return json({ error: "That doesn't look like a phone number or email." }, 400);
  if (!market) return json({ error: "Please choose which event you'll pick up at." }, 400);
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 25) return json({ error: "Your selection is empty." }, 400);
  let inv;
  try {
    inv = parseCsv(await (await readAsset(env, request, "/data/inventory.csv")).text());
  } catch (e) {
    return json({ error: "unavailable" }, 503);
  }
  const bySku = new Map(inv.map((r) => [r.sku, r]));
  const seen = /* @__PURE__ */ new Set(), lines = [];
  let total = 0;
  for (const it of body.items) {
    const id = clean(it && it.id, 100), qty = Math.floor(Number(it && it.qty));
    if (!id || seen.has(id) || !(qty >= 1 && qty <= 20)) return json({ error: "Something in your selection looks off. Please refresh and try again." }, 400);
    seen.add(id);
    const p = bySku.get(id);
    const stock = p && String(p.stock).trim() !== "" ? Number(p.stock) : null;
    const price = p ? /sale/i.test(p.status) && Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.price) ? Number(p.sale_price) : Number(p.price) : 0;
    if (!p || /sold/i.test(p.status) || stock === 0 || !(price > 0)) return json({ error: `${p ? p.name : "A plant"} isn't available right now. Please refresh the page.` }, 409);
    if (stock !== null && qty > stock) return json({ error: `We only have ${stock} of ${p.name}.` }, 409);
    lines.push({ name: p.name, qty, sub: price * qty });
    total += price * qty;
  }
  try {
    const site = await (await readAsset(env, request, "/data/site.json")).json();
    const names = (site.events || []).map((e) => String(e.name || "").toLowerCase()).filter(Boolean);
    if (names.length && !names.some((n) => market.toLowerCase().includes(n))) return json({ error: "Please choose one of the listed events." }, 400);
  } catch (e) {
  }
  const plantsText = lines.map((l) => `${l.qty} x ${l.name} - ${money(l.sub)}`).join("\n");
  const plantsHtml = lines.map((l) => `<div>${esc(l.qty)} \xD7 <b>${esc(l.name)}</b> \u2014 ${esc(money(l.sub))}</div>`).join("");
  const totalTxt = money(total);
  const ownerText = `NEW PLANT RESERVATION

1. PLANTS
${plantsText}

2. PICKUP EVENT
${market}

3. NAME
${name}

4. PHONE OR EMAIL
${contact}

5. TOTAL (pay at pickup)
${totalTxt}

6. NOTES
${notes || "-"}
`;
  const ownerHtml = shell("New plant reservation", block("1. Plants", plantsHtml) + block("2. Pickup event", esc(market)) + block("3. Name", esc(name)) + block("4. Phone or email", esc(contact)) + block("5. Total (pay at pickup)", `<b>${esc(totalTxt)}</b>`) + block("6. Notes", esc(notes || "-")));
  const okOwner = await resend(env, "/emails", { from: env.FROM_EMAIL, to: [env.OWNER_EMAIL], ...email ? { reply_to: email } : {}, subject: `Plant reservation: ${name} (${totalTxt})`, text: ownerText, html: ownerHtml });
  if (!okOwner) return json({ error: "send_failed" }, 502);
  let copy = false;
  if (email) {
    const text = `Hi ${name},

Thanks! We got your plant reservation.

PLANTS
${plantsText}

PICKUP EVENT
${market}

TOTAL (pay in person at pickup)
${totalTxt}

No payment is taken online and nothing ships. We'll message you to confirm. Questions? Just reply to this email.

\u2014 Spina & Spiritus (AZ Cactus Doctor)`;
    const html = shell("Reservation received", `<p style="font-size:15px;line-height:1.5">Hi ${esc(name)}, thanks! We got your plant reservation and we'll message you to confirm.</p>` + block("Your plants", plantsHtml) + block("Pickup event", esc(market)) + block("Total (pay in person at pickup)", `<b>${esc(totalTxt)}</b>`) + `<p style="margin-top:20px;font-size:13px;color:#5d594e">No payment is taken online and nothing ships. Questions? Just reply to this email.<br>\u2014 Spina &amp; Spiritus (AZ Cactus Doctor)</p>`);
    copy = await resend(env, "/emails", { from: env.FROM_EMAIL, to: [email], reply_to: env.OWNER_EMAIL, subject: "We got your plant reservation \u2014 Spina & Spiritus", text, html });
  }
  return json({ ok: true, copy });
}
__name(handleOrder, "handleOrder");
async function handleSignup(request, env, body) {
  if (clean(body.website, 50)) return json({ ok: true });
  const email = clean(body.email, 120).toLowerCase();
  if (!isEmail(email)) return json({ error: "Please enter a valid email address." }, 400);
  let stored = false;
  if (env.RESEND_AUDIENCE_ID) stored = await resend(env, `/audiences/${encodeURIComponent(env.RESEND_AUDIENCE_ID)}/contacts`, { email, unsubscribed: false });
  const told = await resend(env, "/emails", { from: env.FROM_EMAIL, to: [env.OWNER_EMAIL], subject: "New weekly-list signup: " + email, text: `New weekly inventory email signup:

${email}
${stored ? "\n(Added to your Resend audience.)" : ""}`, html: shell("New weekly-list signup", `<p style="font-size:16px"><b>${esc(email)}</b></p>${stored ? "<p>Added to your Resend audience.</p>" : ""}`) });
  if (!stored && !told) return json({ error: "send_failed" }, 502);
  return json({ ok: true });
}
__name(handleSignup, "handleSignup");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") return env.ASSETS.fetch(new Request(new URL("/index.html", request.url).toString(), request));
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const route = url.pathname === "/api/order" ? handleOrder : url.pathname === "/api/signup" ? handleSignup : null;
    if (!route) return json({ error: "not_found" }, 404);
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !env.OWNER_EMAIL) return json({ error: "not_configured" }, 503);
    const allowed = env.ALLOWED_ORIGINS ? String(env.ALLOWED_ORIGINS).split(",").map((s) => s.trim()) : DEFAULT_ORIGINS;
    const origin = request.headers.get("Origin") || "";
    if (!allowed.includes(origin)) return json({ error: "forbidden" }, 403);
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (limited(ip, url.pathname, url.pathname === "/api/order" ? 8 : 6, 10 * 60 * 1e3)) return json({ error: "Please wait a few minutes before sending again." }, 429);
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);
    let body;
    try {
      body = JSON.parse(raw);
    } catch (e) {
      return json({ error: "bad_request" }, 400);
    }
    if (!body || typeof body !== "object") return json({ error: "bad_request" }, 400);
    return route(request, env, body);
  }
};

// ../../../tmp/wr/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../tmp/wr/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-cxCj7j/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../tmp/wr/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-cxCj7j/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
