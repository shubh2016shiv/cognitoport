/* ============================================================
   Architecture Explorer — engine
   Level 1 System  -> Level 2 Stage  -> Level 3 Component
   Content lives in content.js. This file renders it.
   Vanilla JS, no build step.
   ============================================================ */

/* ============================================================
   DOM
   ============================================================ */

const el = (id) => document.getElementById(id);
const rail = el("rail");
const panel = el("panel");
const panelBody = el("panelBody");
const panelInner = el("panelInner");
const crumbs = el("crumbs");
const panelIndex = el("panelIndex");
const panelPrev = el("panelPrev");
const panelNext = el("panelNext");
const panelPrevLabel = el("panelPrevLabel");
const panelNextLabel = el("panelNextLabel");
const caption = el("caption");
const flowview = el("flowview");
const mapPrev = el("mapPrev");
const mapNext = el("mapNext");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const state = {
  stage: null,
  component: null,
  lastTrigger: null,
  mapIndex: -1,
  captionTimer: null,
};

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const stageName = (id) => STAGES[id]?.rail?.name || STAGES[id]?.foundation?.name || (id === "topology" ? "Topology" : id);

/* ============================================================
   Level 1 — build the map
   ============================================================ */

rail.innerHTML = RAIL_ORDER.map((id) => {
  const s = STAGES[id].rail;
  return `<button class="stage" type="button" role="listitem" data-stage="${id}">
    <span class="stage-art" aria-hidden="true"></span>
    <span class="stage-band" aria-hidden="true"><b>${s.index}</b><i>${esc(s.tag)}</i></span>
    <span class="stage-texture" aria-hidden="true"></span>
    <span class="stage-check" aria-hidden="true"></span>
    <span class="stage-mode-standalone" aria-hidden="true"></span>
    <span class="stage-top">
      <span class="stage-left"><span class="stage-mode-inline" aria-hidden="true"></span><b>${s.index}</b></span>
      <i>${esc(s.tag)}</i>
    </span>
    <span class="stage-copy">
      <span class="stage-name">${esc(s.name)}</span>
      <span class="stage-desc">${esc(s.desc)}</span>
    </span>
    <span class="stage-arrow" aria-hidden="true">›</span>
  </button>`;
}).join("");

/* ============================================================
   Rendering — level 2 and level 3
   ============================================================ */

function pushMarkup(questions) {
  if (!questions || !questions.length) return "";
  return `<details class="push">
    <summary>Push on this <small>${questions.length} question${questions.length > 1 ? "s" : ""}</small></summary>
    <div class="push-list">
      ${questions
        .map(
          (item, i) => `<div class="push-item">
            <span class="tag">Probe ${String(i + 1).padStart(2, "0")}</span>
            <p class="q">${esc(item.q)}</p>
            <p class="a">${esc(item.a)}</p>
          </div>`
        )
        .join("")}
    </div>
  </details>`;
}

function ladderMarkup(stage) {
  const nodes = stage.steps
    .map((step, i) => {
      const open = Boolean(step.component);
      const tag = open ? "button" : "div";
      const attrs = open
        ? `type="button" data-component="${step.component}"`
        : "";
      return `<${tag} class="node" data-kind="${step.kind}" ${attrs}>
        <span class="node-top"><b>${String(i + 1).padStart(2, "0")}</b><span class="k">${step.kind}</span></span>
        <h4>${esc(step.label)}</h4>
        <p>${esc(step.meta)}</p>
        ${open ? '<span class="go">Zoom in ↗</span>' : ""}
      </${tag}>`;
    })
    .join("");

  const loopBack = stage.loop
    ? `<div class="loop-return"><span aria-hidden="true">↻</span> Not accepted? The loop returns to 01 with the patched artifact.</div>`
    : "";

  const gate = stage.loop
    ? `<div class="exit-gate">
         <b>Exit requires all three</b>
         <span class="plus">·</span> Composite ≥ 0.95
         <span class="plus">+</span> Every tracked requirement resolved
         <span class="plus">+</span> Safety gate clears
       </div>`
    : "";

  const branches = stage.branches
    ? `<div class="branches">${stage.branches
        .map((b) => `<div class="branch ${b.type}">${esc(b.label)}</div>`)
        .join("")}</div>`
    : "";

  return `<div class="ladder${stage.loop ? " is-loop" : ""}">${nodes}${loopBack}</div>${gate}${branches}`;
}

function diagramStageMarkup(stageId) {
  const cfg = DIAGRAM_STAGES[stageId];
  const notes = cfg.notes
    .map(([head, body]) => `<article><span>${esc(head)}</span><p>${esc(body)}</p></article>`)
    .join("");
  /* React Flow ships its own zoom/pan/fit controls inside the canvas, so the
     hand-built Pan-toggle/zoom-chip row (built for the Mermaid + native-scroll
     setup) doesn't apply here — drag-to-pan never traps the wheel the way
     overflow:auto did, so there's nothing to toggle in the first place. */
  /* Every diagram stage (not just Knowledge) gets the viewport-level drawer:
     the canvas stays in the normal centred content column, and the
     explanation aside is relocated to document.body (see renderStageDiagram)
     so it can be position:fixed against the viewport instead of resizing or
     overlapping the diagram. */
  const diagramBody = cfg.engine === "reactflow"
    ? `<div class="knowledge-diagram-shell knowledge-diagram-shell--external" data-diagram-stage="${esc(stageId)}">
        <div class="knowledge-canvas-frame">
          <div class="rf-shell" id="knowledgeReactFlow" aria-live="polite"></div>
        </div>
        <aside class="knowledge-bubble" id="knowledgeBubble" aria-live="polite" hidden></aside>
      </div>`
    : `<div class="knowledge-diagram-shell" data-diagram-stage="${esc(stageId)}">
        <div class="knowledge-scroll" id="knowledgeScroll">
          <div class="knowledge-mermaid" id="knowledgeMermaid" aria-live="polite"></div>
        </div>
        <aside class="knowledge-bubble" id="knowledgeBubble" aria-live="polite" hidden></aside>
      </div>`;
  const flowActions = cfg.engine === "reactflow"
    ? `<p>Click any step to open its explanation. Drag to pan; use the controls in the corner to zoom.</p>`
    : `<div class="knowledge-flow-actions">
          <p>Hover or focus any step. Enable pan to drag and scroll inside the diagram — off by default so the page scrolls normally.</p>
          <span class="knowledge-zoom">
            <button class="chip chip-wide" id="kbPanToggle" type="button" aria-pressed="false">Pan: Off</button>
            <button class="chip" id="kbZoomOut" type="button" aria-label="Zoom out">−</button>
            <button class="chip chip-wide" id="kbFit" type="button">Fit</button>
            <button class="chip" id="kbZoomIn" type="button" aria-label="Zoom in">+</button>
          </span>
        </div>`;
  return `
    <section class="knowledge-intro">
      <div>
        <p class="eyebrow">${esc(cfg.eyebrow)}</p>
        <h2 id="panelTitle" tabindex="-1">${esc(cfg.title)}</h2>
      </div>
      <p>${esc(cfg.intro)}</p>
    </section>

    <section class="knowledge-explorer" aria-labelledby="knowledgeFlowTitle">
      <div class="knowledge-flow-head">
        <div>
          <p class="block-label">${esc(cfg.label)}</p>
          <h3 id="knowledgeFlowTitle">${esc(cfg.flowTitle)}</h3>
        </div>
        ${flowActions}
      </div>
      ${diagramBody}
      <p class="knowledge-rule">${cfg.rule}</p>
    </section>

    <details class="knowledge-details">
      <summary>How this is built <small>Technical details</small></summary>
      <div class="knowledge-details-grid">${notes}</div>
    </details>
  `;
}

let knowledgeRenderCount = 0;

/* Move a freshly painted stage's explanation aside out of the panel and onto
   document.body, tagged with which stage owns it. Mounting it outside
   .panel-inner matters: that container carries a scale/opacity zoom
   animation, and a transformed ancestor redefines the containing block for
   any position:fixed descendant, which would break the drawer's viewport
   anchoring. Body-level mounting keeps it a true viewport overlay. */
function externalizeKnowledgeBubble(stageId) {
  const shell = document.querySelector(".knowledge-diagram-shell--external[data-diagram-stage]");
  const bubble = shell?.querySelector(".knowledge-bubble");
  if (!bubble) return;
  bubble.classList.add("knowledge-bubble--external");
  bubble.dataset.ownerStage = stageId;
  document.body.appendChild(bubble);
  updateKnowledgeDrawerLayoutMode();
}

/* Stage navigation and panel close both discard the diagram markup the
   drawer was cloned from, but the drawer itself now lives on document.body
   and would otherwise survive as a stale, still-visible overlay. Call this
   any time the underlying stage/panel is about to change. */
function removeExternalKnowledgeBubbles() {
  document.querySelectorAll(".knowledge-bubble--external").forEach((node) => node.remove());
  activeKnowledgeBubbleNode = null;
  activeKnowledgeBubbleShell = null;
  activeKnowledgeBubbleElement = null;
}

/* The drawer's ~340-420px fixed width is only "otherwise-unused viewport
   space" when the centred content column actually leaves that much room to
   its right. A static CSS breakpoint can't know that — the column's own
   width and gutters already flex with viewport size — so this measures the
   real gap next to the stage's diagram and switches the drawer into the
   same bottom-sheet treatment narrow viewports use whenever it wouldn't
   fit without overlapping the diagram. Never changes the diagram itself. */
function updateKnowledgeDrawerLayoutMode() {
  const shell = document.querySelector(".knowledge-diagram-shell--external[data-diagram-stage]");
  const bubble = document.querySelector(".knowledge-bubble--external");
  if (!shell || !bubble) return;
  const MIN_DRAWER_WIDTH = 340;
  const INSET_AND_GAP = 22 + 18;
  const available = window.innerWidth - shell.getBoundingClientRect().right;
  bubble.classList.toggle("is-side-cramped", available < MIN_DRAWER_WIDTH + INSET_AND_GAP);
}

window.addEventListener("resize", () => updateKnowledgeDrawerLayoutMode());

function positionKnowledgeBubble(shell, bubble, node) {
  const nodeBox = node.getBoundingClientRect();
  const gap = 14;
  const inset = 12;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const panel = shell.closest(".panel");
  const panelHead = panel?.querySelector(".panel-head")?.getBoundingClientRect();
  const panelFoot = panel?.querySelector(".panel-foot")?.getBoundingClientRect();
  const topLimit = panelHead && panelHead.bottom > 0 ? Math.max(inset, panelHead.bottom + inset) : inset;
  const bottomLimit = panelFoot && panelFoot.top < viewportHeight
    ? Math.min(viewportHeight - inset, panelFoot.top - inset)
    : viewportHeight - inset;
  const availableHeight = Math.max(240, bottomLimit - topLimit);

  bubble.classList.add("is-viewport-popover");
  bubble.style.maxHeight = `${Math.min(availableHeight, viewportHeight * 0.72)}px`;
  const bubbleBox = bubble.getBoundingClientRect();
  const room = {
    right: viewportWidth - nodeBox.right - gap - inset,
    left: nodeBox.left - gap - inset,
    below: bottomLimit - nodeBox.bottom - gap,
    above: nodeBox.top - topLimit - gap,
  };

  let placement;
  if (room.right >= bubbleBox.width) placement = "right";
  else if (room.left >= bubbleBox.width) placement = "left";
  else if (room.below >= bubbleBox.height) placement = "below";
  else if (room.above >= bubbleBox.height) placement = "above";
  else placement = room.right >= room.left ? "right" : "left";

  let left;
  let top;
  if (placement === "right" || placement === "left") {
    left = placement === "right" ? nodeBox.right + gap : nodeBox.left - bubbleBox.width - gap;
    top = nodeBox.top + nodeBox.height / 2 - bubbleBox.height / 2;
  } else {
    left = nodeBox.left + nodeBox.width / 2 - bubbleBox.width / 2;
    top = placement === "below" ? nodeBox.bottom + gap : nodeBox.top - bubbleBox.height - gap;
  }

  left = Math.max(inset, Math.min(left, viewportWidth - bubbleBox.width - inset));
  top = Math.max(topLimit, Math.min(top, bottomLimit - bubbleBox.height));

  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
  bubble.dataset.placement = placement;
  const isScrollable = bubble.scrollHeight > bubble.clientHeight + 1;
  bubble.classList.toggle("is-scrollable", isScrollable);
  bubble.setAttribute("aria-label", `${bubble.querySelector("h4")?.textContent || "Component"} details.${isScrollable ? " Scroll for the complete explanation." : ""}`);
}

let knowledgeBubbleTimer = null;
let knowledgeBubbleHideTimer = null;
let activeKnowledgeBubbleNode = null;
let activeKnowledgeBubbleShell = null;
let activeKnowledgeBubbleElement = null;
let knowledgeBubblePositionFrame = null;

function repositionActiveKnowledgeBubble() {
  if (knowledgeBubblePositionFrame) return;
  knowledgeBubblePositionFrame = requestAnimationFrame(() => {
    knowledgeBubblePositionFrame = null;
    if (activeKnowledgeBubbleShell?.classList.contains("is-drawer-open")) return;
    if (!activeKnowledgeBubbleNode?.isConnected || !activeKnowledgeBubbleElement?.classList.contains("is-open")) return;
    positionKnowledgeBubble(activeKnowledgeBubbleShell, activeKnowledgeBubbleElement, activeKnowledgeBubbleNode);
  });
}

window.addEventListener("resize", repositionActiveKnowledgeBubble);
window.addEventListener("scroll", repositionActiveKnowledgeBubble, true);

function closeKnowledgeBubble(shell, bubble, node = activeKnowledgeBubbleNode, options = {}) {
  const { restoreFocus = true } = options;
  if (node) {
    node.classList.remove("is-active");
    node.setAttribute("aria-expanded", "false");
  }
  if (!bubble) return;
  shell?.classList.add("is-drawer-closing");
  shell?.classList.remove("is-drawer-open");
  bubble.classList.remove("is-open");
  bubble.classList.remove("is-viewport-popover", "is-scrollable");
  activeKnowledgeBubbleNode = null;
  activeKnowledgeBubbleShell = null;
  activeKnowledgeBubbleElement = null;
  window.setTimeout(() => {
    if (!bubble.classList.contains("is-open")) {
      bubble.hidden = true;
      shell?.classList.remove("is-drawer-closing");
    }
  }, reduceMotion.matches ? 0 : 360);
  /* The drawer is a fixed viewport overlay with its own CSS-defined
     position, not something derived from the diagram's pan/zoom, so closing
     it never touches the canvas viewport. */
  if (restoreFocus && node?.isConnected) node.focus({ preventScroll: true });
}

function showKnowledgeBubble(node, detail, options = {}) {
  const shell = node.closest(".knowledge-diagram-shell");
  const bubble = shell?.classList.contains("knowledge-diagram-shell--external")
    ? document.querySelector(`.knowledge-bubble--external[data-owner-stage="${shell.dataset.diagramStage}"]`)
    : shell?.querySelector(".knowledge-bubble");
  if (!shell || !bubble) return;

  if (activeKnowledgeBubbleNode === node && shell.classList.contains("is-drawer-open")) {
    closeKnowledgeBubble(shell, bubble, node, { restoreFocus: false });
    return;
  }

  window.clearTimeout(knowledgeBubbleTimer);
  window.clearTimeout(knowledgeBubbleHideTimer);
  const openBubble = () => {
    if (!node.isConnected) return;
    const insight = detail.why || detail.example || "";
    const insightLabel = detail.insightLabel || "Why It Matters";
    const sections = Array.isArray(detail.sections)
      ? detail.sections.map((section) => `
          <section class="knowledge-bubble-section">
            <h5>${esc(section.title)}</h5>
            ${section.body ? `<p>${esc(section.body)}</p>` : ""}
            ${Array.isArray(section.items) ? `<ul>${section.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}
            ${section.code ? `<pre class="knowledge-json"><code>${esc(section.code)}</code></pre>` : ""}
          </section>
        `).join("")
      : "";

    shell.querySelectorAll('[aria-expanded="true"]').forEach((item) => item.setAttribute("aria-expanded", "false"));
    shell.querySelectorAll(".is-active").forEach((item) => item.classList.remove("is-active"));
    node.classList.add("is-active");
    node.setAttribute("aria-expanded", "true");
    node.setAttribute("aria-controls", bubble.id || "knowledgeBubble");
    const wasAlreadyOpen = bubble.classList.contains("is-open");
    activeKnowledgeBubbleNode = node;
    activeKnowledgeBubbleShell = shell;
    activeKnowledgeBubbleElement = bubble;
    bubble.innerHTML = `
      <header class="knowledge-bubble-head">
        <div>
          <span>${esc(detail.eyebrow)}</span>
          <h4>${esc(detail.title)}</h4>
        </div>
        <button class="knowledge-drawer-close" type="button" aria-label="Close explanation">×</button>
      </header>
      <p>${esc(detail.body)}</p>
      ${sections}
      ${insight ? `<p class="knowledge-bubble-label">${esc(insightLabel)}</p><p class="knowledge-bubble-example">${esc(insight)}</p>` : ""}
    `;
    bubble.classList.remove("is-viewport-popover", "is-scrollable");
    bubble.removeAttribute("style");
    bubble.hidden = false;
    bubble.tabIndex = -1;
    bubble.setAttribute("role", "region");
    bubble.setAttribute("aria-label", `${detail.title || "Component"} details`);
    shell.classList.remove("is-drawer-closing");
    shell.classList.add("is-drawer-open");
    bubble.querySelector(".knowledge-drawer-close")?.addEventListener("click", () => closeKnowledgeBubble(shell, bubble, node));
    bubble.scrollTop = 0;
    if (wasAlreadyOpen) {
      /* Drawer is already on screen: swap content with a brief fade instead
         of replaying the slide-in transform (that stays reserved for the
         closed-to-open transition). */
      bubble.classList.remove("is-content-swap");
      void bubble.offsetWidth;
      bubble.classList.add("is-content-swap");
    } else {
      requestAnimationFrame(() => {
        bubble.classList.add("is-open");
      });
    }
  };

  openBubble();
}

function hideKnowledgeBubble(node) {
  /* Explanations are click-controlled drawers. Pointer departure must not
     dismiss reading content. The close button and Escape key own dismissal. */
}

/* Zoom/pan for the knowledge diagram. The main flow view has its own copy of
   this because it lives in a separate overlay with its own lifecycle; this one
   is rebuilt every time the stage is opened, so it re-wires on each render. */
const KB_MIN_SCALE = 0.4;
const KB_MAX_SCALE = 2.4;
let kbScale = 1;

function kbSetZoom(scale) {
  const canvas = el("knowledgeMermaid");
  if (!canvas) return;
  kbScale = Math.max(KB_MIN_SCALE, Math.min(KB_MAX_SCALE, scale));
  canvas.style.transform = `scale(${kbScale})`;
}

/* Fit the diagram to the visible area on both axes, then centre it
   horizontally. Measured from the SVG's real bounding box rather than its
   declared width, because Mermaid's declared width includes padding the
   layout does not actually use. */
function kbFit() {
  const scroll = el("knowledgeScroll");
  const canvas = el("knowledgeMermaid");
  const svgEl = canvas?.querySelector("svg");
  if (!scroll || !svgEl) return;

  let box = null;
  try {
    box = svgEl.getBBox();
  } catch {
    /* getBBox throws if the SVG is not laid out yet; fall back to attributes */
  }
  const naturalW = box?.width || svgEl.viewBox?.baseVal?.width || 0;
  const naturalH = box?.height || svgEl.viewBox?.baseVal?.height || 0;
  const availW = scroll.clientWidth - 48;
  const availH = scroll.clientHeight - 32;
  if (!naturalW || !naturalH) return;

  kbSetZoom(Math.min(availW / naturalW, availH / naturalH, 1));
  window.requestAnimationFrame(() => {
    scroll.scrollLeft = Math.max(0, (scroll.scrollWidth - scroll.clientWidth) / 2);
    scroll.scrollTop = 0;
  });
}

/* Pan is opt-in. The scroll container's own overflow is what steals the
   wheel gesture from the page (a browser hands wheel events to the nearest
   scrollable ancestor under the cursor, independent of any JS listener) — so
   the fix has to be `overflow: hidden` by default, not just skipping our own
   drag handler. The "pan-active" class flips that on click. Off, the diagram
   is inert content the page scrolls straight through; on, it behaves like the
   old always-draggable canvas. */
let kbPanActive = false;

function kbSetPanActive(active) {
  const scroll = el("knowledgeScroll");
  const toggle = el("kbPanToggle");
  if (!scroll || !toggle) return;
  kbPanActive = active;
  scroll.classList.toggle("pan-active", active);
  toggle.setAttribute("aria-pressed", String(active));
  toggle.textContent = active ? "Pan: On" : "Pan: Off";
  /* Turning pan off while scrolled/zoomed would leave content clipped by the
     new overflow:hidden in whatever position it happened to be in. Snapping
     back to a clean fit makes "off" a predictable, resting state every time. */
  if (!active) kbFit();
}

function wireKnowledgeViewport() {
  const scroll = el("knowledgeScroll");
  if (!scroll) return;

  /* Each stage switch rebuilds this markup from scratch, always starting at
     "Pan: Off" — reset the flag to match, or a pan left on in one diagram
     would silently carry into the next with a mismatched button label. */
  kbPanActive = false;

  el("kbPanToggle")?.addEventListener("click", () => kbSetPanActive(!kbPanActive));
  el("kbZoomIn")?.addEventListener("click", () => kbSetZoom(kbScale + 0.2));
  el("kbZoomOut")?.addEventListener("click", () => kbSetZoom(kbScale - 0.2));
  el("kbFit")?.addEventListener("click", kbFit);

  /* Drag to pan — only once the toggle is on. Ignore drags starting on a
     node either way, so hover detail still works. */
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  scroll.addEventListener("pointerdown", (event) => {
    if (!kbPanActive || event.target.closest("g.node")) return;
    dragging = true;
    scroll.classList.add("is-panning");
    startX = event.clientX;
    startY = event.clientY;
    startLeft = scroll.scrollLeft;
    startTop = scroll.scrollTop;
    scroll.setPointerCapture(event.pointerId);
  });
  scroll.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    scroll.scrollLeft = startLeft - (event.clientX - startX);
    scroll.scrollTop = startTop - (event.clientY - startY);
  });
  const endDrag = () => {
    dragging = false;
    scroll.classList.remove("is-panning");
  };
  scroll.addEventListener("pointerup", endDrag);
  scroll.addEventListener("pointercancel", endDrag);

  /* Ctrl/Cmd + wheel zooms regardless of pan state — it's an explicit
     modifier gesture that never conflicts with plain-wheel page scrolling,
     so there's no reason to gate it behind the toggle. */
  scroll.addEventListener("wheel", (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    kbSetZoom(kbScale + (event.deltaY < 0 ? 0.12 : -0.12));
  }, { passive: false });
}

async function renderStageDiagram(stageId) {
  const cfg = DIAGRAM_STAGES[stageId];
  if (!cfg) return;

  if (cfg.engine === "reactflow") {
    /* Relocate this stage's explanation aside to document.body before any
       node can be clicked, so it is a real viewport-level drawer (fixed
       position, immune to the panel's own transform/animation) rather than
       a node-relative element inside the canvas shell. Stale asides from a
       previously open stage are already cleared by paint()/closePanel(). */
    externalizeKnowledgeBubble(stageId);

    /* knowledge-flow.js / context-flow.js each register their own mount
       function on window once their module has loaded. On a slow connection
       the CDN import might not have resolved yet by the time this stage
       opens first, so this is polled briefly rather than assumed present. */
    const mountFnName = cfg.reactFlowMount || "mountKnowledgeReactFlow";
    const tryMount = () => {
      const mountFn = window[mountFnName];
      if (typeof mountFn === "function") {
        mountFn(stageId);
        return true;
      }
      return false;
    };
    if (!tryMount()) {
      let attempts = 0;
      const poll = window.setInterval(() => {
        attempts += 1;
        if (tryMount() || attempts > 40) window.clearInterval(poll); // ~10s ceiling
      }, 250);
    }
    return;
  }

  const container = el("knowledgeMermaid");
  if (!container || typeof mermaid === "undefined") return;

  try {
    flowInit();
    const renderId = `stageFlowSvg${++knowledgeRenderCount}`;
    const { svg } = await mermaid.render(renderId, cfg.source);
    if (!container.isConnected || state.stage !== stageId) return;
    container.innerHTML = svg;

    Object.entries(cfg.details).forEach(([id, detail]) => {
      const node = container.querySelector(`g.node[id*="-${id}-"]`);
      if (!node) return;
      node.classList.add("knowledge-detail-trigger");
      node.setAttribute("tabindex", "0");
      node.setAttribute("role", "group");
      node.setAttribute("aria-label", `${detail.title}. ${detail.body}`);
      node.addEventListener("click", () => showKnowledgeBubble(node, detail, { immediate: true }));
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showKnowledgeBubble(node, detail, { immediate: true });
        }
      });
    });

    wireKnowledgeViewport();
    kbFit();
  } catch (error) {
    container.innerHTML = `<p class="knowledge-render-error">This diagram could not be drawn. ${esc(error.message || error)}</p>`;
  }
}

function stageMarkup(id) {
  if (DIAGRAM_STAGES[id]) return diagramStageMarkup(id);
  const s = STAGES[id];
  return `
    <section class="p-intro">
      <div>
        <p class="eyebrow">${esc(s.eyebrow)}</p>
        <h2 id="panelTitle" tabindex="-1">${esc(s.title)}</h2>
      </div>
      <p class="sum">${esc(s.summary)}</p>
    </section>

    <section class="p-work">
      <div>
        <p class="block-label">The mechanism</p>
        ${ladderMarkup(s)}
      </div>
      <aside class="p-notes">
        <div class="note">
          <p class="block-label">Design decision</p>
          <h3>${esc(s.decisionHead)}</h3>
          <p>${esc(s.decisionBody)}</p>
        </div>
        <div class="talk">
          <p class="block-label">Talk track</p>
          <p>${esc(s.talk)}</p>
        </div>
      </aside>
    </section>

    <section class="judgment" data-quiet>
      <div class="judgment-head">
        <h3>The judgment call</h3>
        <p>What this design controls, and what it costs.</p>
      </div>
      <div class="judgment-grid">
        <section>
          <p class="eyebrow">Failure controlled</p>
          <p>${esc(s.failure)}</p>
        </section>
        <section>
          <p class="eyebrow">Trade-off accepted</p>
          <p>${esc(s.tradeoff)}</p>
        </section>
      </div>
    </section>

    ${pushMarkup(s.questions)}
  `;
}

function componentMarkup(stageId, componentId) {
  const c = COMPONENTS[stageId][componentId];
  const reviewers = c.reviewers
    ? `<details class="reviewers">
        <summary>Open the ensemble <small>All seven reviewers</small></summary>
        <div class="reviewer-list">
          ${c.reviewers
            .map(
              (r, i) => `<article class="reviewer" data-mode="${r.mode}">
                <span class="num">${String(i + 1).padStart(2, "0")}</span>
                <div>
                  <span class="mode">${r.mode === "model" ? "Model judgment" : "No model needed"}</span>
                  <h4>${esc(r.name)}</h4>
                  <p>${esc(r.body)}</p>
                </div>
              </article>`
            )
            .join("")}
        </div>
      </details>`
    : "";

  return `
    <section class="p-intro">
      <div>
        <p class="eyebrow">${esc(c.eyebrow)}</p>
        <h2 id="panelTitle" tabindex="-1">${esc(c.title)}</h2>
      </div>
      <p class="sum">${esc(c.reveal)}</p>
    </section>

    <p class="block-label spaced">The contract</p>
    <section class="contract">
      <article><span>Owns</span><p>${esc(c.owns)}</p></article>
      <article class="no"><span>Forbidden from</span><p>${esc(c.forbidden)}</p></article>
      <article><span>Receives</span><p>${esc(c.receives)}</p></article>
      <article class="check"><span>Output validated by</span><p>${esc(c.validated)}</p></article>
    </section>

    ${reviewers}

    <section class="wrong" data-quiet>
      <span>Passes every check — still wrong</span>
      <p>${esc(c.wrong)}</p>
    </section>

    ${pushMarkup(c.questions)}
  `;
}

function crumbMarkup(stageId, componentId) {
  const parts = [`<button type="button" data-crumb="system">System</button>`, `<span>/</span>`];
  if (componentId) {
    parts.push(`<button type="button" data-crumb="stage">${esc(stageName(stageId))}</button>`);
    parts.push(`<span>/</span>`);
    parts.push(`<b>${esc(COMPONENTS[stageId][componentId].title)}</b>`);
  } else {
    parts.push(`<b>${esc(stageName(stageId))}</b>`);
  }
  return parts.join("");
}

/* ============================================================
   Quiet mode — the interface changes register
   ============================================================ */

let quietObserver = null;
const quietVisible = new Map();

function watchQuietSections() {
  if (quietObserver) quietObserver.disconnect();
  quietVisible.clear();

  quietObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const root = entry.rootBounds;
        if (!root) return;
        // Enough of the judgment text is on screen for the register to shift.
        const enough = Math.min(entry.boundingClientRect.height * 0.55, root.height * 0.34);
        quietVisible.set(entry.target, entry.isIntersecting && entry.intersectionRect.height >= enough);
      });
      setQuiet([...quietVisible.values()].some(Boolean));
    },
    { root: panelBody, threshold: [0, 0.15, 0.3, 0.5, 0.75, 1] }
  );

  panelInner.querySelectorAll("[data-quiet]").forEach((node) => quietObserver.observe(node));
}

function setQuiet(on) {
  document.body.classList.toggle("is-quiet", on);
  panel.classList.toggle("is-quiet", on);
}

/* ============================================================
   Captions — narrate the motion itself
   ============================================================ */

function showCaption(text) {
  if (!text) return;
  window.clearTimeout(state.captionTimer);
  caption.textContent = text;
  caption.classList.remove("is-on");
  const show = () => caption.classList.add("is-on");
  if (reduceMotion.matches) show();
  else requestAnimationFrame(() => requestAnimationFrame(show));
  state.captionTimer = window.setTimeout(() => caption.classList.remove("is-on"), reduceMotion.matches ? 3200 : 2100);
}

function hideCaption() {
  window.clearTimeout(state.captionTimer);
  caption.classList.remove("is-on");
}

function setOrigin(trigger) {
  const rect = trigger?.getBoundingClientRect?.();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight * 0.42;
  panel.style.setProperty("--origin-x", `${x}px`);
  panel.style.setProperty("--origin-y", `${y}px`);
}

/* ============================================================
   URL + history
   ============================================================ */

function writeUrl(stage, component, mode = "push") {
  const url = new URL(window.location.href);
  url.hash = "";
  if (stage) url.searchParams.set("stage", stage);
  else url.searchParams.delete("stage");
  if (stage && component) url.searchParams.set("component", component);
  else url.searchParams.delete("component");
  history[mode === "replace" ? "replaceState" : "pushState"]({ stage: stage || null, component: component || null }, "", url);
}

/* ============================================================
   Panel control
   ============================================================ */

/**
 * Repaint the panel. When `originEl` is given, the new level grows out of the
 * element that was clicked — the same zoom gesture as System → Stage, applied
 * one level deeper.
 */
function paint(html, originEl, moveFocus = true) {
  let origin = null;
  if (originEl && panel.classList.contains("is-open")) {
    const node = originEl.getBoundingClientRect();
    const box = panelBody.getBoundingClientRect();
    origin = { x: node.left + node.width / 2 - box.left, y: node.top + node.height / 2 - box.top };
  }

  /* Tear down any mounted React root before its container is discarded —
     panelInner.innerHTML below replaces the DOM out from under React without
     going through its own unmount, which otherwise leaks the root and can
     throw on the next render. No-ops when nothing is mounted. */
  window.unmountKnowledgeReactFlow?.();
  window.unmountExtractionReactFlow?.();
  window.unmountClassificationReactFlow?.();
  window.unmountRetrievalReactFlow?.();
  window.unmountSelectionReactFlow?.();
  window.unmountSynthesisReactFlow?.();
  window.unmountGovernanceReactFlow?.();
  window.unmountContextReactFlow?.();
  window.unmountPlanReactFlow?.();
  window.unmountExecuteReactFlow?.();
  window.unmountCritiqueReactFlow?.();
  window.unmountEvaluationReactFlow?.();
  window.unmountOutputReactFlow?.();
  /* The explanation drawer for the outgoing stage lives on document.body,
     outside panelInner, so replacing panelInner's markup below would leave
     it behind as a stale, still-visible overlay. */
  removeExternalKnowledgeBubbles();
  panelInner.innerHTML = html;
  panelInner.classList.toggle("zoom-from", Boolean(origin));
  if (origin) {
    panelInner.style.setProperty("--zx", `${origin.x}px`);
    panelInner.style.setProperty("--zy", `${origin.y}px`);
  }
  panelInner.style.animation = "none";
  void panelInner.offsetWidth;
  panelInner.style.animation = "";
  panelBody.scrollTop = 0;
  setQuiet(false);
  watchQuietSections();
  panelInner.querySelectorAll("[data-component]").forEach((node) => {
    node.addEventListener("click", () => openComponent(state.stage, node.dataset.component, node));
  });
  // Focus follows the zoom when the level changes; stepping between siblings
  // leaves focus on the control the presenter is already using.
  if (moveFocus) window.setTimeout(() => el("panelTitle")?.focus({ preventScroll: true }), 60);
}

function renderStage(id, originEl, moveFocus) {
  state.stage = id;
  state.component = null;
  paint(stageMarkup(id), originEl, moveFocus);
  if (DIAGRAM_STAGES[id]) renderStageDiagram(id);
  crumbs.innerHTML = crumbMarkup(id, null);

  const i = RAIL_ORDER.indexOf(id);
  if (i >= 0) highlightStage(i);
  panelIndex.textContent =
    i >= 0
      ? `Stage ${String(i + 1).padStart(2, "0")} / 07`
      : STAGES[id].foundation
        ? "Shared foundation"
        : "Architecture decision";
  panelPrevLabel.textContent = "Previous stage";
  panelNextLabel.textContent = i === RAIL_ORDER.length - 1 ? "End of flow" : "Next stage";
  panelPrev.disabled = i <= 0;
  panelNext.disabled = i < 0 || i >= RAIL_ORDER.length - 1;
}

function renderComponent(stageId, componentId, originEl, moveFocus) {
  state.stage = stageId;
  state.component = componentId;
  paint(componentMarkup(stageId, componentId), originEl, moveFocus);
  crumbs.innerHTML = crumbMarkup(stageId, componentId);

  const ids = Object.keys(COMPONENTS[stageId]);
  const i = ids.indexOf(componentId);
  panelIndex.textContent = `Component ${String(i + 1).padStart(2, "0")} / ${String(ids.length).padStart(2, "0")}`;
  panelPrevLabel.textContent = "Previous component";
  panelNextLabel.textContent = i >= ids.length - 1 ? "End of stage" : "Next component";
  panelPrev.disabled = i <= 0;
  panelNext.disabled = i >= ids.length - 1;
}

function showPanel() {
  if (panel.classList.contains("is-open")) return;
  panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-locked");
  requestAnimationFrame(() => panel.classList.add("is-open"));
}

function openStage(id, trigger, opts = {}) {
  if (!STAGES[id]) return;
  if (trigger) state.lastTrigger = trigger;
  setOrigin(trigger);
  renderStage(id);
  showPanel();
  if (opts.history !== false) writeUrl(id, null, opts.replace ? "replace" : "push");
  if (opts.caption !== false) showCaption(STAGES[id].reveal);
}

function openComponent(stageId, componentId, trigger, opts = {}) {
  if (!COMPONENTS[stageId]?.[componentId]) return;
  setOrigin(trigger);
  renderComponent(stageId, componentId, trigger);
  showPanel();
  if (opts.history !== false) writeUrl(stageId, componentId, opts.replace ? "replace" : "push");
  if (opts.caption !== false) showCaption(COMPONENTS[stageId][componentId].reveal);
}

function backOneLevel() {
  if (state.component) {
    const stageId = state.stage;
    renderStage(stageId);
    writeUrl(stageId, null);
    showCaption(STAGES[stageId].reveal);
    return;
  }
  closePanel();
}

function closePanel({ history: useHistory = true, restoreFocus = true } = {}) {
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-locked", "is-quiet");
  panel.classList.remove("is-quiet");
  state.component = null;
  hideCaption();
  removeExternalKnowledgeBubbles();
  if (useHistory) writeUrl(null, null);
  if (restoreFocus) window.setTimeout(() => state.lastTrigger?.focus?.({ preventScroll: true }), 320);
}

function zoomOutToSystem() {
  showCaption("Every local decision returns to one bounded system.");
  panel.style.setProperty("--origin-x", "50%");
  panel.style.setProperty("--origin-y", "42%");
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-locked", "is-quiet");
  panel.classList.remove("is-quiet");
  state.component = null;
  removeExternalKnowledgeBubbles();
  writeUrl(null, null);

  window.setTimeout(() => {
    el("overview").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    const heroTitle = el("heroTitle");
    heroTitle.classList.add("is-landed");
    window.setTimeout(() => heroTitle.focus({ preventScroll: true }), 420);
    window.setTimeout(() => heroTitle.classList.remove("is-landed"), 2600);
  }, reduceMotion.matches ? 0 : 380);
}

function step(direction) {
  if (state.component) {
    const ids = Object.keys(COMPONENTS[state.stage]);
    const next = ids[ids.indexOf(state.component) + direction];
    if (!next) return;
    renderComponent(state.stage, next, null, false);
    writeUrl(state.stage, next);
    showCaption(COMPONENTS[state.stage][next].reveal);
    return;
  }
  const i = RAIL_ORDER.indexOf(state.stage);
  const next = RAIL_ORDER[i + direction];
  if (i < 0 || !next) return;
  renderStage(next, null, false);
  writeUrl(next, null);
  showCaption(STAGES[next].reveal);
}

/* ============================================================
   Map stepper — prev/next move a highlight across the rail, the
   same visual emphasis as a hover. Opening still requires an
   actual click on the card; the buttons never open anything.
   ============================================================ */

function updateMapNav() {
  mapPrev.disabled = state.mapIndex <= 0;
  mapNext.disabled = state.mapIndex >= RAIL_ORDER.length - 1;
}

function highlightStage(index) {
  state.mapIndex = index;
  const id = RAIL_ORDER[index];
  rail.querySelectorAll(".stage").forEach((card) => card.classList.toggle("is-active", card.dataset.stage === id));
  updateMapNav();
}

function stepMap(direction) {
  const next = Math.max(0, Math.min(RAIL_ORDER.length - 1, state.mapIndex + direction));
  highlightStage(next);
}

/* ============================================================
   Full flow — horizontal React Flow canvas
   The implementation lives in full-flow.js. app.js owns only the overlay
   lifecycle so the full HLD remains isolated from the stage detail panels.
   ============================================================ */

function mountFullFlowWhenReady(attempt = 0) {
  if (!flowview.classList.contains("is-open")) return;
  if (typeof window.mountFullFlowReactFlow === "function") {
    window.mountFullFlowReactFlow();
    return;
  }
  if (attempt < 20) window.setTimeout(() => mountFullFlowWhenReady(attempt + 1), 50);
}

async function openFlow() {
  state.lastTrigger = document.activeElement;
  flowview.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-locked");
  requestAnimationFrame(() => {
    flowview.classList.add("is-open");
    mountFullFlowWhenReady();
  });
  window.setTimeout(() => el("flowClose").focus({ preventScroll: true }), 220);
}

function closeFlow() {
  flowview.classList.remove("is-open");
  flowview.setAttribute("aria-hidden", "true");
  window.unmountFullFlowReactFlow?.();
  if (!panel.classList.contains("is-open")) {
    document.body.classList.remove("is-locked");
  }
  window.setTimeout(() => state.lastTrigger?.focus?.({ preventScroll: true }), 220);
}


/* ============================================================
   Wiring
   ============================================================ */

document.addEventListener("click", (event) => {
  const stageBtn = event.target.closest("[data-stage]");
  if (stageBtn) {
    openStage(stageBtn.dataset.stage, stageBtn);
    return;
  }
  const openBtn = event.target.closest("[data-open-stage]");
  if (openBtn) {
    openStage(openBtn.dataset.openStage, openBtn);
  }
});

crumbs.addEventListener("click", (event) => {
  const crumb = event.target.closest("[data-crumb]");
  if (!crumb) return;
  if (crumb.dataset.crumb === "system") closePanel();
  if (crumb.dataset.crumb === "stage") backOneLevel();
});

el("flowBtn").addEventListener("click", openFlow);
el("flowClose").addEventListener("click", closeFlow);

el("panelClose").addEventListener("click", () => closePanel());
el("panelOut").addEventListener("click", zoomOutToSystem);
panelPrev.addEventListener("click", () => step(-1));
panelNext.addEventListener("click", () => step(1));

mapPrev.addEventListener("click", () => stepMap(-1));
mapNext.addEventListener("click", () => stepMap(1));

el("presentBtn").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    /* fullscreen is optional and can be blocked by browser policy */
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    /* The explanation drawer owns the first Escape press: closing it must
       not also back the whole stage panel out, which is what happened when
       only the drawer's own (rarely-focused) keydown handler caught this. */
    if (activeKnowledgeBubbleElement?.classList.contains("is-open")) {
      closeKnowledgeBubble(activeKnowledgeBubbleShell, activeKnowledgeBubbleElement, activeKnowledgeBubbleNode);
      return;
    }
    if (flowview.classList.contains("is-open")) return closeFlow();
    if (panel.classList.contains("is-open")) return backOneLevel();
    return;
  }

  if (panel.classList.contains("is-open")) {
    if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
    return;
  }

  if (flowview.classList.contains("is-open")) return;
  if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;

  if (event.key === "ArrowRight" && state.mapIndex < RAIL_ORDER.length - 1) { event.preventDefault(); stepMap(1); }
  if (event.key === "ArrowLeft" && state.mapIndex > 0) { event.preventDefault(); stepMap(-1); }
});

/* ---------- deep links + back/forward ---------- */

function syncFromUrl() {
  const params = new URLSearchParams(location.search);
  const stage = params.get("stage");
  const component = params.get("component");

  if (!stage || !STAGES[stage]) {
    if (panel.classList.contains("is-open")) closePanel({ history: false, restoreFocus: false });
    return;
  }

  setOrigin(rail.querySelector(`[data-stage="${stage}"]`));
  if (component && COMPONENTS[stage]?.[component]) renderComponent(stage, component);
  else renderStage(stage);
  showPanel();
}

/* ============================================================
   Hero stat reveal — numbers count up while their bars grow
   ============================================================ */

/* easeOutCubic: moves fast immediately, then settles gently onto the final
   figure. Linear counting reads mechanical, and easeOutQuint spends too long
   crawling the last few digits. */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function runStatCounters(scope) {
  const cells = scope.querySelectorAll(".stat-number[data-count]");
  cells.forEach((numberEl, index) => {
    const target = Number(numberEl.dataset.count);
    const digits = numberEl.querySelector(".stat-count");
    if (!digits || !Number.isFinite(target)) return;

    /* Matches the per-cell --stat-delay stagger in CSS, so each number and
       its bar move as one object rather than two loosely related things. */
    const startAt = performance.now() + index * 90;
    const duration = 620;

    const tick = (now) => {
      const progress = Math.min(1, Math.max(0, (now - startAt) / duration));
      digits.textContent = String(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function initStatReveal() {
  const stats = document.querySelector(".hero-stats");
  if (!stats) return;

  const showFinalValues = () => {
    stats.querySelectorAll(".stat-number[data-count]").forEach((numberEl) => {
      const digits = numberEl.querySelector(".stat-count");
      if (digits) digits.textContent = numberEl.dataset.count;
    });
  };

  /* Reduced motion: the figures still have to be readable, so land on them
     immediately rather than animating or leaving them at zero. */
  if (reduceMotion.matches) {
    stats.classList.add("stats-live");
    showFinalValues();
    return;
  }

  const reveal = () => {
    stats.classList.add("stats-live");
    runStatCounters(stats);
  };

  if (!("IntersectionObserver" in window)) {
    reveal();
    return;
  }

  /* Fires once. These sit above the fold so it normally runs straight away,
     but the observer also covers a deep link that lands mid-page. */
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      reveal();
    },
    { threshold: 0.3 }
  );
  observer.observe(stats);
}

initStatReveal();

/* Exposed for knowledge-flow.js (a separate ES module, so it can't see this
   file's top-level consts directly). Reusing DIAGRAM_STAGES[stageId].details
   and the existing hover-bubble functions means the React Flow pilot shows
   exactly the same fact-checked copy as every Mermaid diagram, from the same
   single source, rather than a forked duplicate that can drift out of sync. */
window.DIAGRAM_STAGES = DIAGRAM_STAGES;
window.showKnowledgeBubble = showKnowledgeBubble;
window.hideKnowledgeBubble = hideKnowledgeBubble;

window.addEventListener("popstate", syncFromUrl);
history.replaceState({ stage: null, component: null }, "", window.location.href);
syncFromUrl();
