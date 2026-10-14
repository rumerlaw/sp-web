// Runs before first paint on the home page: if the visitor came back from a plant page via "Back to shop",
// keep the page hidden until app.js has restored their scroll position (avoids a jump from the top).
try { if (sessionStorage.getItem("sp-restore") === "1" && !document.body) document.documentElement.style.visibility = "hidden"; } catch (e) {}
