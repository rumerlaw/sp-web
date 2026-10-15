(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const KEY = "sp-gh-token", REPO = "rumerlaw/sp-web";
  function show() {
    const on = !!localStorage.getItem(KEY);
    $("#signedOut").hidden = on; $("#signedIn").hidden = !on;
  }
  $("#go").addEventListener("click", async () => {
    const t = $("#tok").value.trim(); const err = $("#err"); err.textContent = "";
    if (!t) { err.textContent = "Please paste your key first."; return; }
    try {
      const r = await fetch("https://api.github.com/repos/" + REPO, { headers: { Authorization: "Bearer " + t, Accept: "application/vnd.github+json" } });
      if (r.status === 401) throw new Error("That key wasn't accepted. Check that you copied all of it.");
      if (!r.ok) throw new Error("This key can't see the site's repository. Re-create it and choose the sp-web repository.");
      const j = await r.json();
      if (!j.permissions || !j.permissions.push) throw new Error("This key can read the site but not change it. Set Contents to Read and write.");
      localStorage.setItem(KEY, t); $("#tok").value = "";
      sessionStorage.setItem("sp-edit", "1"); location.href = "index.html";
    } catch (e) { err.textContent = e.message || "Couldn't sign in. Check your internet connection."; }
  });
  $("#tok").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#go").click(); });
  $("#cont").addEventListener("click", () => { sessionStorage.setItem("sp-edit", "1"); location.href = "index.html"; });
  $("#out").addEventListener("click", () => { localStorage.removeItem(KEY); sessionStorage.removeItem("sp-edit"); show(); });
  show();
})();
