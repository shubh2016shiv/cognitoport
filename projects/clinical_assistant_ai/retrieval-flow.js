/* Guideline Retrieval — mounted ReactFlow LLD. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  question: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14", "M12 17h.01"],
  branch: ["M7 4v7a4 4 0 0 0 4 4h6", "M7 20v-5", "m14 12 3 3-3 3"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14", "m16 16 4.5 4.5"],
  database: ["M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3", "M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6", "M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"],
  skip: ["M5 5l14 14", "M19 5 5 19"],
  warn: ["M12 3 2 20h20z", "M12 9v5", "M12 17h.01"],
  tag: ["M3 12V4h8l10 10-8 8z", "M7.5 8.5h.01"],
  numbered: ["M10 6h11", "M10 12h11", "M10 18h11", "M4 6h1v4", "M4 10h2", "M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"],
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

/* One Milvus retrieval path with two non-blocking side outcomes. The narrow
   preparation lane is entered only when passages were found; empty and failed
   searches route around it because guideline retrieval never blocks chat. */
const LAYOUT = [
  { id: "L1", type: "lane", x: 20, y: 20, w: 1080, h: 178, title: "Question to retrieve guidelines for" },
  { id: "Q", type: "step", x: 290, y: 78, w: 520, h: 80, kind: "source", icon: "question", seq: "01", title: "Use the clinician's question as the search query", sub: "Only the current question is searched — not the previous conversation" },

  { id: "L2", type: "lane", x: 20, y: 228, w: 1080, h: 420, title: "Hybrid guideline search with Milvus", hint: "Milvus is the vector database" },
  { id: "MILVUS", type: "step", x: 290, y: 286, w: 520, h: 96, kind: "exact", icon: "database", seq: "02", title: "Run hybrid search in the Milvus vector database", sub: "Combine meaning and keyword matches, then return the most relevant guideline passages" },
  { id: "FOUND", type: "step", x: 290, y: 448, w: 520, h: 80, kind: "gate", icon: "branch", title: "Did Milvus return guideline passages?", sub: "Continue with passages, no matches, or a search error" },
  { id: "NONE", type: "step", x: 40, y: 440, w: 220, h: 96, kind: "similarity", icon: "skip", title: "No matches", sub: "Continue without guideline sources" },
  { id: "FAILED", type: "step", x: 840, y: 440, w: 240, h: 96, kind: "blocked", icon: "warn", title: "Search failed", sub: "Tell the model guidelines are unavailable and continue" },

  { id: "L3", type: "lane", x: 250, y: 678, w: 600, h: 400, title: "Prepare citation-ready guidelines" },
  { id: "NAME", type: "step", x: 290, y: 736, w: 520, h: 80, kind: "exact", icon: "tag", seq: "03", title: "Resolve each guideline's official title", sub: "Use the citation library; omit documents that have no registered title" },
  { id: "GROUP", type: "step", x: 290, y: 846, w: 520, h: 80, kind: "container", icon: "numbered", seq: "04", title: "Prepare numbered guideline sources", sub: "Group passages by guideline and assign one stable source number" },
  { id: "GO", type: "step", x: 290, y: 958, w: 520, h: 90, kind: "output", icon: "arrow", title: "Send citation-ready guidelines to prompt assembly", sub: "Wait for the parallel patient-context lane before building the prompt" },
];

const GREEN = "#2f7a4a";
const RED = "#a2453c";
const GREY = "#6c766f";

const EDGES = [
  ["q-milvus", "Q", "MILVUS", {}],
  ["milvus-found", "MILVUS", "FOUND", {}],
  ["found-none", "FOUND", "NONE", { sh: "source-left", th: "target-right", label: "No matches", color: GREY }],
  ["found-failed", "FOUND", "FAILED", { sh: "right", th: "left", label: "Error", color: RED }],
  ["found-name", "FOUND", "NAME", { label: "Passages", color: GREEN }],
  ["name-group", "NAME", "GROUP", {}],
  ["group-go", "GROUP", "GO", { color: GREEN }],
  ["none-go", "NONE", "GO", { th: "left", color: GREY }],
  ["failed-go", "FAILED", "GO", { th: "target-right", color: RED }],
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

function RetrievalFlow() {
  const onOpen = React.useCallback((domNode, nodeId) => {
    const detail = window.DIAGRAM_STAGES?.retrieval?.details?.[nodeId];
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
window.mountRetrievalReactFlow = function () {
  const container = document.getElementById("knowledgeReactFlow");
  if (!container) return;
  container.classList.add("rf-shell--knowledge", "rf-shell--retrieval");
  if (!root) root = createRoot(container);
  root.render(h(RetrievalFlow));
};
window.unmountRetrievalReactFlow = function () { if (!root) return; root.unmount(); root = null; };
