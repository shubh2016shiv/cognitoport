/* ============================================================
   Coverage (a.k.a. "knowledge") stage — React Flow low-level design
   ============================================================
   Registers window.mountKnowledgeReactFlow / unmountKnowledgeReactFlow,
   the contract app.js already polls for whenever a stage's
   DIAGRAM_STAGES entry has engine: "reactflow" (see renderStageDiagram
   in app.js). Content lives in content.js (DIAGRAM_STAGES.coverage.details)
   so this diagram and the Mermaid diagrams it stands beside always show
   the same fact-checked copy from one source, never a forked duplicate.

   No class, function, or variable name from the codebase appears in any
   node here — only the business-level record fields (formulary identifier,
   plan name, payer, effective date) a first-time reader already recognises.

   Node/lane classes (.rf-node, .rf-lane, the --source/--handoff/--gate/
   --blocked/--container/--output kind modifiers) and the .rf-shell--knowledge
   sizing overrides already exist in styles.css — this module only supplies
   nodeTypes that render into those classes, plus this stage's own layout.
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;

/* ---------- icons: plain geometric glyphs ---------- */
const ICONS = {
  package: ["m4 7 8-4 8 4-8 4z", "M4 7v10l8 4 8-4V7", "M12 11v10"],
  search:  ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14", "m16 16 4.5 4.5"],
  shield:  ["M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z", "m9 12 2 2 4-5"],
  ban:     ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "m6 6 12 12"],
  warn:    ["M12 3 2 20h20z", "M12 9v5", "M12 17h.01"],
  branch:  ["M7 4v7a4 4 0 0 0 4 4h6", "M7 20v-5", "m14 12 3 3-3 3"],
  brain:   ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6", "M12 3v6", "M12 15v6", "M3 12h6", "M15 12h6", "M6 6l3 3", "M15 15l3 3", "M18 6l-3 3", "M9 15l-3 3"],
  arrow:   ["M4 12h14", "m13 7 5 5-5 5"],
};

function Icon({ name }) {
  const d = ICONS[name] || ICONS.package;
  return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
    d.map((p, i) => h("path", { d: p, key: i }))
  );
}

const HANDLES = [
  h(Handle, { type: "target", position: Position.Left, id: "left", key: "hl", className: "rf-handle" }),
  h(Handle, { type: "target", position: Position.Top, id: "top", key: "ht", className: "rf-handle" }),
  h(Handle, { type: "source", position: Position.Right, id: "right", key: "hr", className: "rf-handle" }),
  h(Handle, { type: "source", position: Position.Bottom, id: "bottom", key: "hb", className: "rf-handle" }),
];

/* ---------- node renderers ---------- */

function StepNode({ data }) {
  return h("div", {
      className: `rf-node rf-node--${data.kind}${data.clickable === false ? "" : " is-clickable"}`,
      tabIndex: data.clickable === false ? -1 : 0,
      role: data.clickable === false ? undefined : "group",
      "aria-label": data.clickable === false ? undefined : `${data.title}. Press Enter for details.`,
      onClick: data.clickable === false ? undefined : (e) => data.onOpen?.(e.currentTarget, data.id),
      onKeyDown: data.clickable === false ? undefined : (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); data.onOpen?.(e.currentTarget, data.id); }
      },
    },
    ...HANDLES,
    data.seq ? h("span", { className: "rf-node-sequence", key: "seq" }, data.seq) : null,
    h("div", { className: "rf-node-main", key: "main" },
      data.icon ? h("span", { className: "rf-node-icon" }, h(Icon, { name: data.icon })) : null,
      h("div", { className: "rf-node-copy" },
        h("p", { className: "rf-node-title" }, data.title),
        data.sub ? h("p", { className: "rf-node-sub" }, data.sub) : null
      )
    )
  );
}

function ExplainerNode({ data }) {
  return h("div", {
      className: "rf-node rf-node--explainer is-clickable",
      tabIndex: 0, role: "group", "aria-label": `${data.title}. Press Enter for details.`,
      onClick: (e) => data.onOpen?.(e.currentTarget, data.id),
      onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); data.onOpen?.(e.currentTarget, data.id); } },
    },
    ...HANDLES,
    h("div", { className: "rf-node-main", key: "main" },
      data.icon ? h("span", { className: "rf-node-icon" }, h(Icon, { name: data.icon })) : null,
      h("div", { className: "rf-node-copy" },
        h("p", { className: "rf-explainer-title" }, data.title),
        data.sub ? h("p", { className: "rf-explainer-lines" }, data.sub) : null
      )
    )
  );
}

function LaneNode({ data }) {
  return h("div", { className: "rf-lane" },
    ...HANDLES,
    h("span", { className: "rf-lane-label" }, h("strong", null, data.title), data.hint ? h("span", { className: "rf-lane-annotation" }, ` — ${data.hint}`) : null)
  );
}

const NODE_TYPES = { step: StepNode, explainer: ExplainerNode, lane: LaneNode };

/* ---------- layout: coordinates in one shared canvas space ---------- */

const W = 1100;

const LAYOUT = [
  { id: "LANE_RESOLVE", type: "lane", x: 20, y: 20, w: 1060, h: 380,
    title: "Resolve patient coverage", hint: "one patient, one bounded lookup" },
  { id: "PATIENT", type: "step", x: 280, y: 60, w: 540, h: 78, kind: "source", icon: "package", seq: "01",
    title: "Patient ID", sub: "The only input required to resolve this patient's coverage." },
  { id: "LOOKUP", type: "step", x: 280, y: 166, w: 540, h: 86, kind: "handoff", icon: "search", seq: "02",
    title: "Request the patient's coverage plan", sub: "Ask the benefits system for the active formulary attached to this Patient ID." },
  { id: "RETRY", type: "step", x: 280, y: 280, w: 540, h: 82, kind: "gate", icon: "loop", seq: "03",
    title: "Bounded retry for temporary failures", sub: "Retry only transient lookup failures, and stop when the retry limit is reached." },

  { id: "LANE_OUTCOMES", type: "lane", x: 20, y: 420, w: 1060, h: 300,
    title: "Resolve the lookup outcome", hint: "exactly one branch continues" },
  { id: "ACTIVE", type: "step", x: 44, y: 470, w: 320, h: 220, kind: "output", icon: "shield",
    title: "Active formulary found", sub: "Coverage lookup succeeds and returns the patient's active formulary identifier and plan context." },
  { id: "NONE", type: "step", x: 390, y: 470, w: 320, h: 220, kind: "container", icon: "package",
    title: "No formulary available", sub: "The lookup succeeds, but no active formulary is attached to the patient." },
  { id: "FAILED", type: "step", x: 736, y: 470, w: 320, h: 220, kind: "blocked", icon: "warn",
    title: "Coverage lookup failed", sub: "The lookup still fails after bounded retry; preserve the failure without inventing coverage." },

  { id: "LANE_DECIDE", type: "lane", x: 20, y: 750, w: 1060, h: 300,
    title: "Normalize and decide", hint: "all outcomes meet at one gate" },
  { id: "NORMALIZE", type: "explainer", x: 170, y: 800, w: 760, h: 90, kind: "engine", icon: "brain",
    title: "Normalize the coverage result", sub: "Produce one consistent coverage result shape from the success, absence, or failure branch." },
  { id: "GATE", type: "step", x: 170, y: 920, w: 760, h: 90, kind: "gate", icon: "branch",
    title: "Is a formulary identifier present?", sub: "This single decision controls whether formulary enrichment can continue." },

  { id: "LANE_HANDOFF", type: "lane", x: 20, y: 1080, w: 1060, h: 210,
    title: "Choose the handoff" },
  { id: "STOP", type: "step", x: 44, y: 1130, w: 496, h: 130, kind: "blocked", icon: "ban",
    title: "No → stop formulary enrichment", sub: "Return the normalized result without drug-class lookup, retrieval, or selection." },
  { id: "GO", type: "step", x: 560, y: 1130, w: 496, h: 130, kind: "output", icon: "arrow",
    title: "Yes → carry plan context forward", sub: "Pass the formulary identifier and coverage context to the next phase." },
];

const EDGES = [
  ["e-patient-lookup", "PATIENT", "LOOKUP", { sh: "bottom", th: "top" }],
  ["e-lookup-retry", "LOOKUP", "RETRY", { sh: "bottom", th: "top" }],
  ["e-retry-active", "RETRY", "ACTIVE", { sh: "bottom", th: "top", label: "found" }],
  ["e-retry-none", "RETRY", "NONE", { sh: "bottom", th: "top", label: "not available" }],
  ["e-retry-failed", "RETRY", "FAILED", { sh: "bottom", th: "top", label: "failed" }],
  ["e-active-normalize", "ACTIVE", "NORMALIZE", { sh: "bottom", th: "top" }],
  ["e-none-normalize", "NONE", "NORMALIZE", { sh: "bottom", th: "top" }],
  ["e-failed-normalize", "FAILED", "NORMALIZE", { sh: "bottom", th: "top" }],
  ["e-normalize-gate", "NORMALIZE", "GATE", { sh: "bottom", th: "top" }],
  ["e-gate-stop", "GATE", "STOP", { sh: "bottom", th: "top", label: "No" }],
  ["e-gate-go", "GATE", "GO", { sh: "bottom", th: "top", label: "Yes" }],
];

function buildElements(onOpen) {
  const nodes = LAYOUT.map((n) => ({
    id: n.id,
    type: n.type,
    position: { x: n.x, y: n.y },
    style: { width: n.w, height: n.h },
    data: { ...n, onOpen, clickable: n.type !== "lane" },
    draggable: false,
    selectable: false,
    focusable: n.type !== "lane",
    zIndex: n.type === "lane" ? 0 : 2,
  }));

  const edges = EDGES.map(([id, source, target, opt]) => ({
    id, source, target,
    sourceHandle: opt.sh || "right",
    targetHandle: opt.th || "left",
    type: "smoothstep",
    label: opt.label,
    labelStyle: { fill: "#3f4a45", fontSize: 11, fontWeight: 700 },
    labelBgStyle: { fill: "#f4f1e9", fillOpacity: 0.95 },
    labelBgPadding: [7, 4],
    labelBgBorderRadius: 7,
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: "#8a8478" },
    style: { stroke: "#a3a99e", strokeWidth: 1.6 },
    zIndex: 1,
  }));

  return { nodes, edges };
}

function CoverageFlow() {
  const onOpen = React.useCallback((domNode, nodeId) => {
    const cfg = window.DIAGRAM_STAGES?.coverage;
    const detail = cfg?.details?.[nodeId];
    if (!detail || !domNode) return;
    const reactFlowNode = domNode.closest(".react-flow__node") || domNode;
    window.showKnowledgeBubble?.(reactFlowNode, detail, { immediate: true });
  }, []);

  const { nodes, edges } = React.useMemo(() => buildElements(onOpen), [onOpen]);

  return h(ReactFlow, {
    nodes, edges, nodeTypes: NODE_TYPES,
    fitView: true, fitViewOptions: { padding: 0.05 },
    minZoom: 0.3, maxZoom: 1.3,
    nodesDraggable: false, nodesConnectable: false, elementsSelectable: false,
    panOnScroll: false, zoomOnScroll: true, zoomOnDoubleClick: false,
    proOptions: { hideAttribution: false },
  },
    h(Background, { gap: 22, size: 1, color: "rgba(16,22,20,.08)" })
  );
}

let root = null;

window.mountKnowledgeReactFlow = function mountKnowledgeReactFlow() {
  const container = document.getElementById("knowledgeReactFlow");
  if (!container) return;
  container.classList.add("rf-shell--knowledge");
  if (!root) root = createRoot(container);
  root.render(h(CoverageFlow));
};

window.unmountKnowledgeReactFlow = function unmountKnowledgeReactFlow() {
  if (!root) return;
  root.unmount();
  root = null;
};
