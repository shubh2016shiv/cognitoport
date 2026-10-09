/* Relevant Drug Selection — mounted ReactFlow low-level design. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  candidates: ["M7 7h10v4H7z", "M7 15h10v4H7z", "M12 11v4"],
  branch: ["M7 4v7a4 4 0 0 0 4 4h6", "M7 20v-5", "m14 12 3 3-3 3"],
  empty: ["M5 12h14"],
  prompt: ["M5 4h14v16H5z", "M8 8h8", "M8 12h8", "M8 16h5"],
  batch: ["M4 5h7v6H4z", "M13 5h7v6h-7z", "M4 15h7v4H4z", "M13 15h7v4h-7z"],
  parallel: ["M12 4v5", "M12 9 5 5", "M12 9l-5 5", "M17 14v6", "M7 14v6"],
  filter: ["M4 6h16", "M7 12h10", "M10 18h4"],
  closed: ["M5 5h14v14H5z", "M8 9h8", "M8 13h8"],
  model: ["M12 3v4", "M12 17v4", "M3 12h4", "M17 12h4", "m5.6-5.4 2.8 2.8", "m13.6 13.6 2.8 2.8", "m18.4 5.6-2.8 2.8", "m8.4 15.6-2.8 2.8"],
  keep: ["M20 6 9 17l-5-5"],
  merge: ["M6 4v5l6 5", "M18 4v5l-6 5", "M12 14v6"],
  arrow: ["M4 12h14", "m13 7 5 5-5 5"],
};
function Icon({ name }) { return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }, (ICONS[name] || ICONS.candidates).map((d, i) => h("path", { d, key: i }))); }
const HANDLES = [
  h(Handle, { type: "target", position: Position.Left, id: "left", key: "tl", className: "rf-handle" }),
  h(Handle, { type: "target", position: Position.Top, id: "top", key: "tt", className: "rf-handle" }),
  h(Handle, { type: "target", position: Position.Right, id: "target-right", key: "tr", className: "rf-handle" }),
  h(Handle, { type: "source", position: Position.Right, id: "right", key: "sr", className: "rf-handle" }),
  h(Handle, { type: "source", position: Position.Bottom, id: "bottom", key: "sb", className: "rf-handle" }),
  h(Handle, { type: "source", position: Position.Left, id: "source-left", key: "sl", className: "rf-handle" }),
];
function StepNode({ data }) { return h("div", { className: `rf-node rf-node--${data.kind} is-clickable`, tabIndex: 0, role: "group", "aria-label": `${data.title}. Press Enter for details.`, onClick: e => data.onOpen?.(e.currentTarget, data.id), onKeyDown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); data.onOpen?.(e.currentTarget, data.id); } } }, ...HANDLES, data.seq ? h("span", { className: "rf-node-sequence" }, data.seq) : null, h("div", { className: "rf-node-main" }, h("span", { className: "rf-node-icon" }, h(Icon, { name: data.icon })), h("div", { className: "rf-node-copy" }, h("p", { className: "rf-node-title" }, data.title), h("p", { className: "rf-node-sub" }, data.sub)))); }
function LaneNode({ data }) { return h("div", { className: "rf-lane" }, ...HANDLES, h("span", { className: "rf-lane-label" }, h("strong", null, data.title), h("span", { className: "rf-lane-annotation" }, ` — ${data.hint}`))); }
const NODE_TYPES = { step: StepNode, lane: LaneNode };

const LAYOUT = [
  { id: "L1", type: "lane", x: 20, y: 20, w: 1260, h: 365, title: "Prepare selection", hint: "start only when retrieved candidate sets are available" },
  { id: "INPUT", type: "step", x: 350, y: 70, w: 600, h: 86, kind: "source", icon: "candidates", seq: "01", title: "Retrieved candidates for each action", sub: "Action identifier, action name, drug class, and covered candidate drugs arrive together." },
  { id: "HAS", type: "step", x: 350, y: 185, w: 600, h: 84, kind: "gate", icon: "branch", title: "Are any actions available?", sub: "Empty input avoids prompt resolution and model selection." },
  { id: "EMPTY", type: "step", x: 985, y: 176, w: 260, h: 102, kind: "similarity", icon: "empty", title: "No → return an empty selection list", sub: "There is no selection work to carry forward." },
  { id: "PROMPT", type: "step", x: 350, y: 300, w: 600, h: 70, kind: "handoff", icon: "prompt", seq: "02", title: "Request the drug-selection prompt", sub: "Resolve the versioned instructions for selecting from covered candidates." },

  { id: "L2", type: "lane", x: 20, y: 405, w: 1260, h: 790, title: "Select relevant covered drugs", hint: "each batch is independent and the model receives a closed candidate set" },
  { id: "BATCH", type: "step", x: 350, y: 455, w: 600, h: 76, kind: "exact", icon: "batch", seq: "03", title: "Split actions into balanced batches", sub: "The configured selection path creates up to two batches." },
  { id: "PARALLEL", type: "step", x: 350, y: 555, w: 600, h: 76, kind: "exact", icon: "parallel", title: "Process the batches concurrently", sub: "A slow or failed batch does not prevent another batch from completing." },
  { id: "FILTER", type: "step", x: 350, y: 655, w: 600, h: 82, kind: "similarity", icon: "filter", title: "Remove actions without a class or candidates", sub: "Skipped actions are traced and are not sent into selection." },
  { id: "CLOSED", type: "step", x: 350, y: 765, w: 600, h: 82, kind: "handoff", icon: "closed", title: "Format the remaining candidates as a closed set", sub: "The prompt contains the action context and only its retrieved covered drugs." },
  { id: "MODEL", type: "step", x: 350, y: 875, w: 600, h: 84, kind: "container", icon: "model", seq: "04", title: "Ask the model to select the relevant drugs", sub: "One structured model call handles each prepared batch." },
  { id: "VALID", type: "step", x: 350, y: 985, w: 600, h: 84, kind: "gate", icon: "branch", title: "Was a valid batch result returned?", sub: "Unexpected output and model exceptions fail soft for this batch." },
  { id: "FAILED", type: "step", x: 985, y: 976, w: 260, h: 102, kind: "blocked", icon: "empty", title: "No → return no selections for this batch", sub: "Other batches can still contribute successful results." },
  { id: "KEEP", type: "step", x: 350, y: 1090, w: 600, h: 82, kind: "output", icon: "keep", title: "Yes → keep the selected drugs with the action identifier", sub: "The identifier preserves which recommendation action owns the selection." },

  { id: "L3", type: "lane", x: 20, y: 1215, w: 1260, h: 285, title: "Merge and hand off", hint: "successful batches form the selection result; failed batches contribute nothing" },
  { id: "MERGE", type: "step", x: 350, y: 1265, w: 600, h: 80, kind: "exact", icon: "merge", title: "Merge completed batch results", sub: "Flatten successful selections as batches finish; ordering is not used as a join key." },
  { id: "GO", type: "step", x: 260, y: 1380, w: 780, h: 94, kind: "output", icon: "arrow", title: "Carry selected drugs to Final Recommendation Generation", sub: "The next phase assembles the action-to-formulary result for persistence." },
];
const EDGES = [
  ["input-has", "INPUT", "HAS", { sh: "bottom", th: "top" }],
  ["has-no", "HAS", "EMPTY", { sh: "right", th: "left", label: "No", color: "#6c766f" }],
  ["has-yes", "HAS", "PROMPT", { sh: "bottom", th: "top", label: "Yes", color: "#2f7a4a" }],
  ["prompt-batch", "PROMPT", "BATCH", { sh: "bottom", th: "top" }],
  ["batch-parallel", "BATCH", "PARALLEL", { sh: "bottom", th: "top" }],
  ["parallel-filter", "PARALLEL", "FILTER", { sh: "bottom", th: "top" }],
  ["filter-closed", "FILTER", "CLOSED", { sh: "bottom", th: "top" }],
  ["closed-model", "CLOSED", "MODEL", { sh: "bottom", th: "top" }],
  ["model-valid", "MODEL", "VALID", { sh: "bottom", th: "top" }],
  ["valid-no", "VALID", "FAILED", { sh: "right", th: "left", label: "No", color: "#a2453c" }],
  ["valid-yes", "VALID", "KEEP", { sh: "bottom", th: "top", label: "Yes", color: "#2f7a4a" }],
  ["failed-merge", "FAILED", "MERGE", { sh: "bottom", th: "target-right", color: "#a2453c" }],
  ["keep-merge", "KEEP", "MERGE", { sh: "bottom", th: "top", color: "#2f7a4a" }],
  ["merge-go", "MERGE", "GO", { sh: "bottom", th: "top", color: "#2f7a4a" }],
];
function buildElements(onOpen) { const nodes = LAYOUT.map(n => ({ id: n.id, type: n.type, position: { x: n.x, y: n.y }, style: { width: n.w, height: n.h }, data: { ...n, onOpen }, draggable: false, selectable: false, focusable: n.type !== "lane", zIndex: n.type === "lane" ? 0 : 3 })); const edges = EDGES.map(([id, source, target, o]) => ({ id, source, target, sourceHandle: o.sh || "bottom", targetHandle: o.th || "top", type: "smoothstep", label: o.label, labelStyle: { fill: "#3f4a45", fontSize: 11, fontWeight: 700 }, labelBgStyle: { fill: "#f4f1e9", fillOpacity: .96 }, labelBgPadding: [7, 4], labelBgBorderRadius: 7, markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: o.color || "#879087" }, style: { stroke: o.color || "#9aa198", strokeWidth: 1.6 }, zIndex: 4 })); return { nodes, edges }; }
function SelectionFlow() { const onOpen = React.useCallback((domNode, nodeId) => { const detail = window.DIAGRAM_STAGES?.selection?.details?.[nodeId]; if (!detail || !domNode) return; window.showKnowledgeBubble?.(domNode.closest(".react-flow__node") || domNode, detail, { immediate: true }); }, []); const { nodes, edges } = React.useMemo(() => buildElements(onOpen), [onOpen]); return h(ReactFlow, { nodes, edges, nodeTypes: NODE_TYPES, fitView: true, fitViewOptions: { padding: .035 }, minZoom: .3, maxZoom: 1.4, nodesDraggable: false, nodesConnectable: false, elementsSelectable: false, zoomOnScroll: true, zoomOnDoubleClick: false, proOptions: { hideAttribution: false } }, h(Background, { gap: 22, size: 1, color: "rgba(16,22,20,.08)" }), h(Controls, { showInteractive: false })); }
let root = null;
window.mountSelectionReactFlow = function () { const container = document.getElementById("knowledgeReactFlow"); if (!container) return; container.classList.add("rf-shell--knowledge", "rf-shell--selection"); if (!root) root = createRoot(container); root.render(h(SelectionFlow)); };
window.unmountSelectionReactFlow = function () { if (!root) return; root.unmount(); root = null; };
