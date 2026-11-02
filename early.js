// Runs before first paint on the home page: if the visitor came back from a plant page via "Back to shop",
// keep the page hidden until app.js has restored their scroll position (avoids a jump from the top).
try { if (sessionStorage.getItem("sp-restore") === "1" && !document.body) document.documentElement.style.opacity = "0"; } catch (e) {}

// Spina (plants, green) / Spiritus (candles & tarot, dark mystic) theme. Same site; the choice is remembered on this device.
(function () {
  var root = document.documentElement, KEY = "sp-realm";
  function get() { if (!/(^\/$|\/index\.html$)/.test(location.pathname)) return "spina"; try { var q = /[?&]realm=(spina|spiritus)/.exec(location.search); if (q) { localStorage.setItem(KEY, q[1]); return q[1]; } return localStorage.getItem(KEY) === "spiritus" ? "spiritus" : "spina"; } catch (e) { return "spina"; } }
  function set(r) {
    root.setAttribute("data-realm", r);
    try { localStorage.setItem(KEY, r); } catch (e) {}
    var b = document.querySelectorAll("[data-realm-btn]");
    for (var i = 0; i < b.length; i++) { var on = b[i].getAttribute("data-realm-btn") === r; b[i].classList.toggle("on", on); b[i].setAttribute("aria-pressed", on ? "true" : "false"); }
  }
  set(get());
  document.addEventListener("DOMContentLoaded", function () { set(root.getAttribute("data-realm") || "spina"); });
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-realm-btn]") : null;
    if (!t) return;
    e.preventDefault(); set(t.getAttribute("data-realm-btn")); document.dispatchEvent(new Event("realmchange"));
    if (document.querySelector(".hero")) window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
