/* Private "Mark as shipped" page. The link in the order email carries a signed token in the part after #, which never goes to any server except
   when you press the button. Nothing is stored in the page. */
(function () {
  var form = document.getElementById("shipForm"), msg = document.getElementById("shipMsg"), who = document.getElementById("shipFor"), btn = document.getElementById("shipBtn");
  var m = /[#&]t=([A-Za-z0-9_.-]+)/.exec(location.hash || ""), token = m ? m[1] : "";
  function say(t, bad) { msg.textContent = t || ""; msg.className = "ship-msg" + (bad ? " bad" : ""); }
  function decode(t) { try { var p = t.split(".")[0].replace(/-/g, "+").replace(/_/g, "/"); return JSON.parse(decodeURIComponent(escape(atob(p)))); } catch (e) { return null; } }
  var d = token ? decode(token) : null;
  if (!d || !d.e) { say("This link is not valid. Open it again from the order email.", true); return; }
  who.textContent = "Order for " + String(d.n || "the customer") + (d.i ? ": " + String(d.i) : "");
  who.hidden = false; form.hidden = false;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var carrier = form.elements.carrier.value, tracking = form.elements.tracking.value.trim();
    if (!carrier || tracking.length < 6) { say("Choose the carrier and type the tracking number.", true); return; }
    btn.disabled = true; say("Sending…");
    fetch("/api/ship", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token, carrier: carrier, tracking: tracking }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.ok) { form.hidden = true; say("Done. The tracking email was sent to " + String(d.n || "the customer") + ". This order is marked shipped."); }
        else { btn.disabled = false; say((res.j && res.j.error) || "Something went wrong. Please try again.", true); }
      })
      .catch(function () { btn.disabled = false; say("No connection. Please try again.", true); });
  });
})();
