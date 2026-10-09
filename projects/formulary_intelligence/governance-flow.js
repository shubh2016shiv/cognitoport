/* Governance and Observability — mounted ReactFlow low-level design. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  start: ["M5 4h14v16H5z", "M8 8h8", "M8 12h8", "M8 16h5"],
  record: ["M4 5h16v14H4z", "M8 9h8", "M8 13h5"],
  timing: ["M12 7v5l3 2", "M12 3a9 9 0 1 0 9 9"],
  limit: ["M12 3 4 6v5c0 3-1.7 5.3-4 7-2.3-1.7-4-4-4-7V9z", "M9.5 12.5 11 14l3.5-4"],
  usage: ["M5 19V9", "M12 19V5", "M19 19v-7"],
  branch: ["M7 4v7a4 4 0 0 0 4 4h6", "M7 20v-5", "m14 12 3 3-3 3"],
  empty: ["M5 12h14"],
  save: ["M5 5h14v14H5z", "M8 5v5h8V5", "M8 15h8"],
  check: ["M20 6 9 17l-5-5"],
  warn: ["M12 3 2 20h20z", "M12 9v5", "M12 17h.01"],
  complete: ["M4 12h14", "m13 7 5 5-5 5"],
};
function Icon({ name }) { return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }, (ICONS[name] || ICONS.record).map((d, i) => h("path", { d, key: i }))); }
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
  { id: "L1", type: "lane", x: 20, y: 20, w: 1260, h: 380, title: "Observe the pipeline", hint: "make successful decisions, deliberate skips, and degraded outcomes explainable" },
  { id: "START", type: "step", x: 350, y: 70, w: 600, h: 80, kind: "source", icon: "start", seq: "01", title: "Formulary intelligence processing begins", sub: "Open an observable execution for the patient's coverage-enrichment request." },
  { id: "OUTCOMES", type: "step", x: 350, y: 180, w: 600, h: 90, kind: "exact", icon: "record", title: "Record the outcome of every phase", sub: "Capture what completed, what was deliberately skipped, and what failed or degraded." },
  { id: "DURATION", type: "step", x: 350, y: 300, w: 600, h: 76, kind: "handoff", icon: "timing", title: "Capture phase duration", sub: "Make slow coverage, retrieval, and model work visible for operational review." },

  { id: "L2", type: "lane", x: 20, y: 420, w: 1260, h: 325, title: "Govern model usage", hint: "apply shared capacity controls and account for every classification and selection call" },
  { id: "LIMIT", type: "step", x: 350, y: 470, w: 600, h: 88, kind: "gate", icon: "limit", seq: "02", title: "Apply the shared model-usage limit", sub: "Classification and selection wait for available model capacity before executing." },
  { id: "USAGE", type: "step", x: 350, y: 605, w: 600, h: 92, kind: "container", icon: "usage", title: "Record model timing and usage", sub: "Publish the model outcome and release the reserved capacity when the call finishes." },

  { id: "L3", type: "lane", x: 20, y: 765, w: 1260, h: 495, title: "Persist the outcome", hint: "store the coverage-aware recommendation and make the save outcome visible" },
  { id: "RESULT", type: "step", x: 350, y: 815, w: 600, h: 84, kind: "gate", icon: "branch", title: "Is a final coverage-aware recommendation available?", sub: "Only a completed recommendation result proceeds to persistence." },
  { id: "NO_RESULT", type: "step", x: 60, y: 935, w: 280, h: 102, kind: "similarity", icon: "empty", title: "No → record that no result was produced", sub: "Processing can finish without attempting a save." },
  { id: "SAVE", type: "step", x: 350, y: 930, w: 600, h: 82, kind: "handoff", icon: "save", seq: "03", title: "Attempt to update the patient's recommendation", sub: "Persist the completed coverage-aware recommendation in the recommendation service." },
  { id: "SAVED", type: "step", x: 350, y: 1040, w: 600, h: 84, kind: "gate", icon: "branch", title: "Was the recommendation saved?", sub: "Both successful and unsuccessful persistence outcomes remain observable." },
  { id: "NOT_SAVED", type: "step", x: 980, y: 1031, w: 265, h: 102, kind: "blocked", icon: "warn", title: "No → record the save outcome", sub: "No persistence retry is performed in this workflow." },
  { id: "COMPLETE", type: "step", x: 350, y: 1155, w: 600, h: 80, kind: "output", icon: "complete", title: "Mark formulary processing complete", sub: "Close the request with its recommendation and observable outcome." },
];
const EDGES = [
  ["start-outcomes", "START", "OUTCOMES", { sh: "bottom", th: "top" }],
  ["outcomes-duration", "OUTCOMES", "DURATION", { sh: "bottom", th: "top" }],
  ["duration-limit", "DURATION", "LIMIT", { sh: "bottom", th: "top" }],
  ["limit-usage", "LIMIT", "USAGE", { sh: "bottom", th: "top" }],
  ["usage-result", "USAGE", "RESULT", { sh: "bottom", th: "top" }],
  ["result-no", "RESULT", "NO_RESULT", { sh: "source-left", th: "target-right", label: "No", color: "#6c766f" }],
  ["result-yes", "RESULT", "SAVE", { sh: "bottom", th: "top", label: "Yes", color: "#2f7a4a" }],
  ["save-saved", "SAVE", "SAVED", { sh: "bottom", th: "top" }],
  ["saved-no", "SAVED", "NOT_SAVED", { sh: "right", th: "left", label: "No", color: "#a2453c" }],
  ["saved-yes", "SAVED", "COMPLETE", { sh: "bottom", th: "top", label: "Yes", color: "#2f7a4a" }],
  ["no-result-complete", "NO_RESULT", "COMPLETE", { sh: "bottom", th: "left", color: "#6c766f" }],
  ["not-saved-complete", "NOT_SAVED", "COMPLETE", { sh: "bottom", th: "target-right", color: "#a2453c" }],
];
function buildElements(onOpen) { const nodes = LAYOUT.map(n => ({ id: n.id, type: n.type, position: { x: n.x, y: n.y }, style: { width: n.w, height: n.h }, data: { ...n, onOpen }, draggable: false, selectable: false, focusable: n.type !== "lane", zIndex: n.type === "lane" ? 0 : 3 })); const edges = EDGES.map(([id, source, target, o]) => ({ id, source, target, sourceHandle: o.sh || "bottom", targetHandle: o.th || "top", type: "smoothstep", label: o.label, labelStyle: { fill: "#3f4a45", fontSize: 11, fontWeight: 700 }, labelBgStyle: { fill: "#f4f1e9", fillOpacity: .96 }, labelBgPadding: [7, 4], labelBgBorderRadius: 7, markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: o.color || "#879087" }, style: { stroke: o.color || "#9aa198", strokeWidth: 1.6 }, zIndex: 4 })); return { nodes, edges }; }
function GovernanceFlow() { const onOpen = React.useCallback((domNode, nodeId) => { const detail = window.DIAGRAM_STAGES?.governance?.details?.[nodeId]; if (!detail || !domNode) return; window.showKnowledgeBubble?.(domNode.closest(".react-flow__node") || domNode, detail, { immediate: true }); }, []); const { nodes, edges } = React.useMemo(() => buildElements(onOpen), [onOpen]); return h(ReactFlow, { nodes, edges, nodeTypes: NODE_TYPES, fitView: true, fitViewOptions: { padding: .04 }, minZoom: .32, maxZoom: 1.4, nodesDraggable: false, nodesConnectable: false, elementsSelectable: false, zoomOnScroll: true, zoomOnDoubleClick: false, proOptions: { hideAttribution: false } }, h(Background, { gap: 22, size: 1, color: "rgba(16,22,20,.08)" }), h(Controls, { showInteractive: false })); }
let root = null;
window.mountGovernanceReactFlow = function () { const container = document.getElementById("knowledgeReactFlow"); if (!container) return; container.classList.add("rf-shell--knowledge", "rf-shell--governance"); if (!root) root = createRoot(container); root.render(h(GovernanceFlow)); };
window.unmountGovernanceReactFlow = function () { if (!root) return; root.unmount(); root = null; };
