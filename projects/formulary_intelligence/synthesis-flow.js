/* Final Recommendation Generation — mounted ReactFlow low-level design. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  selected: ["M7 7h10v4H7z", "M7 15h10v4H7z", "M12 11v4"],
  plan: ["M5 4h14v16H5z", "M8 8h8", "M8 12h8", "M8 16h5"],
  combine: ["M6 4v5l6 5", "M18 4v5l-6 5", "M12 14v6"],
  branch: ["M7 4v7a4 4 0 0 0 4 4h6", "M7 20v-5", "m14 12 3 3-3 3"],
  empty: ["M5 12h14"],
  attach: ["M7 7h10v4H7z", "M7 15h10v4H7z", "M12 11v4"],
  assemble: ["M5 4h14v16H5z", "M8 8h8", "M8 12h8", "M8 16h8"],
  arrow: ["M4 12h14", "m13 7 5 5-5 5"],
};
function Icon({ name }) { return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }, (ICONS[name] || ICONS.assemble).map((d, i) => h("path", { d, key: i }))); }
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
  { id: "L1", type: "lane", x: 20, y: 20, w: 1260, h: 325, title: "Selection results", hint: "bring the chosen covered drugs back together with the patient's plan context" },
  { id: "SELECTED", type: "step", x: 70, y: 70, w: 520, h: 90, kind: "source", icon: "selected", seq: "01", title: "Selected formulary drugs", sub: "Covered drugs chosen for the patient's pharmacological recommendations." },
  { id: "CONTEXT", type: "step", x: 710, y: 70, w: 520, h: 90, kind: "source", icon: "plan", title: "Plan and formulary context", sub: "The coverage information established earlier in the pipeline." },
  { id: "COMBINE", type: "step", x: 350, y: 205, w: 600, h: 92, kind: "handoff", icon: "combine", seq: "02", title: "Combine selections with the coverage context", sub: "Prepare one coverage-aware view of the pharmacological recommendations." },

  { id: "L2", type: "lane", x: 20, y: 365, w: 1260, h: 340, title: "Final assembly", hint: "formulary information enriches the recommendation but never gates it" },
  { id: "ANY", type: "step", x: 350, y: 415, w: 600, h: 86, kind: "gate", icon: "branch", title: "Were any covered drugs selected?", sub: "Both selected and unselected outcomes remain valid recommendation results." },
  { id: "EMPTY", type: "step", x: 105, y: 555, w: 470, h: 108, kind: "similarity", icon: "empty", title: "No → keep the recommendation without formulary drugs", sub: "The original pharmacological recommendation remains available without coverage enrichment." },
  { id: "ENRICH", type: "step", x: 725, y: 555, w: 470, h: 108, kind: "container", icon: "attach", title: "Yes → associate the covered drugs with each recommendation", sub: "Attach the relevant plan-covered choices to the pharmacological recommendation they support." },

  { id: "L3", type: "lane", x: 20, y: 725, w: 1260, h: 280, title: "System handoff", hint: "produce one consistent result for persistence and observability" },
  { id: "ASSEMBLE", type: "step", x: 350, y: 775, w: 600, h: 86, kind: "exact", icon: "assemble", seq: "03", title: "Assemble the final coverage-aware recommendation", sub: "Use the same response shape whether coverage enrichment is present or absent." },
  { id: "GO", type: "step", x: 260, y: 895, w: 780, h: 84, kind: "output", icon: "arrow", title: "Send the result for persistence and observability", sub: "Governance records the outcome and the recommendation service stores it." },
];
const EDGES = [
  ["selected-combine", "SELECTED", "COMBINE", { sh: "bottom", th: "top" }],
  ["context-combine", "CONTEXT", "COMBINE", { sh: "bottom", th: "top" }],
  ["combine-any", "COMBINE", "ANY", { sh: "bottom", th: "top" }],
  ["any-no", "ANY", "EMPTY", { sh: "source-left", th: "top", label: "No", color: "#6c766f" }],
  ["any-yes", "ANY", "ENRICH", { sh: "right", th: "top", label: "Yes", color: "#2f7a4a" }],
  ["empty-assemble", "EMPTY", "ASSEMBLE", { sh: "bottom", th: "left", color: "#6c766f" }],
  ["enrich-assemble", "ENRICH", "ASSEMBLE", { sh: "bottom", th: "target-right", color: "#2f7a4a" }],
  ["assemble-go", "ASSEMBLE", "GO", { sh: "bottom", th: "top", color: "#2f7a4a" }],
];
function buildElements(onOpen) { const nodes = LAYOUT.map(n => ({ id: n.id, type: n.type, position: { x: n.x, y: n.y }, style: { width: n.w, height: n.h }, data: { ...n, onOpen }, draggable: false, selectable: false, focusable: n.type !== "lane", zIndex: n.type === "lane" ? 0 : 3 })); const edges = EDGES.map(([id, source, target, o]) => ({ id, source, target, sourceHandle: o.sh || "bottom", targetHandle: o.th || "top", type: "smoothstep", label: o.label, labelStyle: { fill: "#3f4a45", fontSize: 11, fontWeight: 700 }, labelBgStyle: { fill: "#f4f1e9", fillOpacity: .96 }, labelBgPadding: [7, 4], labelBgBorderRadius: 7, markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: o.color || "#879087" }, style: { stroke: o.color || "#9aa198", strokeWidth: 1.6 }, zIndex: 4 })); return { nodes, edges }; }
function SynthesisFlow() { const onOpen = React.useCallback((domNode, nodeId) => { const detail = window.DIAGRAM_STAGES?.synthesis?.details?.[nodeId]; if (!detail || !domNode) return; window.showKnowledgeBubble?.(domNode.closest(".react-flow__node") || domNode, detail, { immediate: true }); }, []); const { nodes, edges } = React.useMemo(() => buildElements(onOpen), [onOpen]); return h(ReactFlow, { nodes, edges, nodeTypes: NODE_TYPES, fitView: true, fitViewOptions: { padding: .045 }, minZoom: .35, maxZoom: 1.4, nodesDraggable: false, nodesConnectable: false, elementsSelectable: false, zoomOnScroll: true, zoomOnDoubleClick: false, proOptions: { hideAttribution: false } }, h(Background, { gap: 22, size: 1, color: "rgba(16,22,20,.08)" }), h(Controls, { showInteractive: false })); }
let root = null;
window.mountSynthesisReactFlow = function () { const container = document.getElementById("knowledgeReactFlow"); if (!container) return; container.classList.add("rf-shell--knowledge", "rf-shell--synthesis"); if (!root) root = createRoot(container); root.render(h(SynthesisFlow)); };
window.unmountSynthesisReactFlow = function () { if (!root) return; root.unmount(); root = null; };
