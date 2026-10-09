/* Patient Context Assembly — mounted ReactFlow LLD. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  ids: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M4 21a8 8 0 0 1 16 0"],
  record: ["M6 3h9l4 4v14H6z", "M15 3v4h4", "M10 13h6", "M13 10v6"],
  chat: ["M4 5h16v11H8l-4 4z", "M8 9h8", "M8 12h5"],
  documents: ["M8 6V3h11v14h-3", "M5 6h11v15H5z", "M8 11h5", "M8 15h5"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14", "m16 16 4.5 4.5"],
  loop: ["M20 7h-6a7 7 0 1 0 6 10", "m17 4 3 3-3 3"],
  branch: ["M7 4v7a4 4 0 0 0 4 4h6", "M7 20v-5", "m14 12 3 3-3 3"],
  stop: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "m6 6 12 12"],
  card: ["M3 6h18v12H3z", "M3 10h18", "M7 15h4"],
  arrow: ["M4 12h14", "m13 7 5 5-5 5"],
};

function Icon({ name }) {
  return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
    (ICONS[name] || ICONS.arrow).map((d, i) => h("path", { d, key: i }))
  );
}

const HANDLES = [
  h(Handle, { type: "target", position: Position.Left, id: "left", key: "tl", className: "rf-handle" }),
  h(Handle, { type: "target", position: Position.Top, id: "top", key: "tt", className: "rf-handle" }),
  h(Handle, { type: "target", position: Position.Right, id: "target-right", key: "tr", className: "rf-handle" }),
  h(Handle, { type: "source", position: Position.Right, id: "right", key: "sr", className: "rf-handle" }),
  h(Handle, { type: "source", position: Position.Bottom, id: "bottom", key: "sb", className: "rf-handle" }),
  h(Handle, { type: "source", position: Position.Left, id: "source-left", key: "sl", className: "rf-handle" }),
];

function StepNode({ data }) {
  return h("div", {
    className: `rf-node rf-node--${data.kind} is-clickable`, tabIndex: 0, role: "group",
    "aria-label": `${data.title}. Press Enter for details.`,
    onClick: (e) => data.onOpen?.(e.currentTarget, data.id),
    onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); data.onOpen?.(e.currentTarget, data.id); } },
  }, ...HANDLES,
    data.seq ? h("span", { className: "rf-node-sequence" }, data.seq) : null,
    h("div", { className: "rf-node-main" },
      h("span", { className: "rf-node-icon" }, h(Icon, { name: data.icon })),
      h("div", { className: "rf-node-copy" }, h("p", { className: "rf-node-title" }, data.title), h("p", { className: "rf-node-sub" }, data.sub))
    )
  );
}

function LaneNode({ data }) {
  return h("div", { className: "rf-lane" }, ...HANDLES,
    h("span", { className: "rf-lane-label" }, h("strong", null, data.title),
      data.hint ? h("span", { className: "rf-lane-annotation" }, ` — ${data.hint}`) : null)
  );
}

const NODE_TYPES = { step: StepNode, lane: LaneNode };

/* Four side-by-side columns show the independent fetches begin together.
   Conversation normalization belongs inside the history fetch; only the
   clinical-record cache miss needs a separate visible fallback. */
const LAYOUT = [
  { id: "L1", type: "lane", x: 20, y: 20, w: 1080, h: 466, title: "Load clinical evidence and patient context in parallel", hint: "all four inputs begin together" },
  { id: "IN", type: "step", x: 290, y: 78, w: 520, h: 80, kind: "source", icon: "ids", seq: "01", title: "Use the patient, clinician and question inputs", sub: "IDs select patient data and chat history; the question selects relevant guideline evidence" },
  { id: "CACHE", type: "step", x: 30, y: 210, w: 250, h: 112, kind: "handoff", icon: "record", seq: "02a", title: "Load the patient clinical record", sub: "Profile, labs, vitals, medications, conditions, allergies, notes and more — from Redis" },
  { id: "HIST", type: "step", x: 295, y: 210, w: 250, h: 112, kind: "handoff", icon: "chat", seq: "02b", title: "Fetch the last 10 chat turns", sub: "Redis first, MongoDB on a cache miss; keep complete question-answer pairs" },
  { id: "CARE", type: "step", x: 560, y: 210, w: 250, h: 112, kind: "handoff", icon: "documents", seq: "02c", title: "Load clinical recommendations and preventive care measures", sub: "Patient summary, recommendations, preventive care and quality measures" },
  { id: "GUIDE", type: "step", x: 825, y: 210, w: 250, h: 112, kind: "handoff", icon: "search", seq: "02d", title: "Retrieve relevant clinical guideline chunks", sub: "Hybrid Milvus search using the clinician's current question" },
  { id: "REFRESH", type: "step", x: 30, y: 356, w: 250, h: 96, kind: "similarity", icon: "loop", title: "Rebuild a missing clinical-record cache", sub: "Ask the record service to refresh Redis, then read it once more" },

  { id: "L2", type: "lane", x: 20, y: 516, w: 1080, h: 414, title: "Complete the patient context" },
  { id: "WAIT", type: "step", x: 290, y: 574, w: 520, h: 86, kind: "gate", icon: "branch", title: "Have all four parallel inputs completed?", sub: "The clinical record is required; empty chat, care content or guideline results are allowed" },
  { id: "STOP", type: "step", x: 40, y: 569, w: 220, h: 96, kind: "blocked", icon: "stop", title: "Required context failed", sub: "Stop before generating an answer" },
  { id: "COVER", type: "step", x: 290, y: 690, w: 520, h: 86, kind: "exact", icon: "card", seq: "03", title: "Load the patient's coverage and formulary plan", sub: "Add plan and formulary names to the record and citation sources" },
  { id: "GO", type: "step", x: 290, y: 806, w: 520, h: 90, kind: "output", icon: "arrow", title: "Send patient context and guideline evidence to prompt assembly", sub: "The four parallel inputs and coverage-plan details are now ready" },
];

const GREEN = "#2f7a4a";
const RED = "#a2453c";
const GREY = "#6c766f";

const EDGES = [
  ["in-cache", "IN", "CACHE", {}],
  ["in-hist", "IN", "HIST", {}],
  ["in-care", "IN", "CARE", {}],
  ["in-guide", "IN", "GUIDE", {}],
  ["cache-refresh", "CACHE", "REFRESH", { color: GREY }],
  ["refresh-wait", "REFRESH", "WAIT", {}],
  ["hist-wait", "HIST", "WAIT", {}],
  ["care-wait", "CARE", "WAIT", { th: "target-right" }],
  ["guide-wait", "GUIDE", "WAIT", { th: "target-right" }],
  ["wait-stop", "WAIT", "STOP", { sh: "source-left", th: "target-right", label: "No", color: RED }],
  ["wait-cover", "WAIT", "COVER", { label: "Yes", color: GREEN }],
  ["cover-go", "COVER", "GO", { color: GREEN }],
];

function buildElements(onOpen) {
  const nodes = LAYOUT.map((n) => ({
    id: n.id, type: n.type, position: { x: n.x, y: n.y }, style: { width: n.w, height: n.h },
    data: { ...n, onOpen }, draggable: false, selectable: false, focusable: n.type !== "lane", zIndex: n.type === "lane" ? 0 : 3,
  }));
  const edges = EDGES.map(([id, source, target, o]) => ({
    id, source, target, sourceHandle: o.sh || "bottom", targetHandle: o.th || "top", type: "smoothstep", label: o.label,
    labelStyle: { fill: "#3f4a45", fontSize: 11, fontWeight: 700 }, labelBgStyle: { fill: "#f4f1e9", fillOpacity: 0.96 },
    labelBgPadding: [7, 4], labelBgBorderRadius: 7,
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: o.color || "#879087" },
    style: { stroke: o.color || "#9aa198", strokeWidth: 1.6 }, zIndex: 4,
  }));
  return { nodes, edges };
}

function ContextFlow() {
  const onOpen = React.useCallback((domNode, nodeId) => {
    const detail = window.DIAGRAM_STAGES?.context?.details?.[nodeId];
    if (!detail || !domNode) return;
    window.showKnowledgeBubble?.(domNode.closest(".react-flow__node") || domNode, detail, { immediate: true });
  }, []);
  const { nodes, edges } = React.useMemo(() => buildElements(onOpen), [onOpen]);
  return h(ReactFlow, {
    nodes, edges, nodeTypes: NODE_TYPES, fitView: true, fitViewOptions: { padding: 0.035 }, minZoom: 0.3, maxZoom: 1.4,
    nodesDraggable: false, nodesConnectable: false, elementsSelectable: false, zoomOnScroll: true, zoomOnDoubleClick: false,
    proOptions: { hideAttribution: false },
  }, h(Background, { gap: 22, size: 1, color: "rgba(16,22,20,.08)" }), h(Controls, { showInteractive: false }));
}

let root = null;
window.mountContextReactFlow = function () {
  const container = document.getElementById("knowledgeReactFlow");
  if (!container) return;
  /* Not rf-shell--context: that class carries an inherited card layout that
     would make these cards look different from stages 01 and 02. */
  container.classList.add("rf-shell--knowledge", "rf-shell--patient");
  if (!root) root = createRoot(container);
  root.render(h(ContextFlow));
};
window.unmountContextReactFlow = function () { if (!root) return; root.unmount(); root = null; };
