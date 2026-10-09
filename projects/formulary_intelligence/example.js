/* ============================================================
   Worked example — open/close for the overlay
   The landing page stays a one-screen hero + system map; the full
   essay lives here, one click away, same pattern as Full flow and
   Follow one request.
   ============================================================ */

(() => {
  const byId = (id) => document.getElementById(id);
  const view = byId("exampleview");
  const openBtn = byId("exampleBtn");
  if (!view || !openBtn) return;

  const closeBtn = byId("exampleClose");
  let returnFocus = null;

  function otherOverlayOpen() {
    return ["panel", "flowview"].some((id) => byId(id)?.classList.contains("is-open"));
  }

  function open(trigger) {
    returnFocus = trigger || document.activeElement;
    view.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    requestAnimationFrame(() => view.classList.add("is-open"));
    window.setTimeout(() => closeBtn.focus({ preventScroll: true }), 220);
  }

  function close() {
    view.classList.remove("is-open");
    view.setAttribute("aria-hidden", "true");
    if (!otherOverlayOpen()) document.body.classList.remove("is-locked");
    window.setTimeout(() => returnFocus?.focus?.({ preventScroll: true }), 220);
  }

  openBtn.addEventListener("click", () => open(openBtn));
  closeBtn.addEventListener("click", close);

  /* Capture phase, so Escape closes this overlay before app.js's
     document-level handler can act on the stage panel underneath. */
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" || !view.classList.contains("is-open")) return;
      event.preventDefault();
      event.stopPropagation();
      close();
    },
    true
  );

  if (new URLSearchParams(window.location.search).has("example")) open(openBtn);
})();
