/* Prompt Assembly and Capacity — mounted ReactFlow LLD. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  input: ["M4 5h16v14H4z", "M8 9h8", "M8 13h5"],
  template: ["M6 3h12v18H6z", "M9 8h6", "M9 12h6", "M9 16h4"],
  evidence: ["M5 4h14v16H5z", "M8 8h8", "M8 12h8", "M8 16h5"],
  dialogue: ["M4 5h16v11H8l-4 4z", "M8 9h8", "M8 12h5"],
  history: ["M12 8v5l3 2", "M3.5 12a8.5 8.5 0 1 0 2.5-6", "M3 4v5h5"],
  question: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14", "M12 17h.01"],
  tokens: ["M4 7h16", "M4 12h10", "M4 17h7", "M18 11v6", "M15 14h6"],
  capacity: ["M5 19V5", "M5 7h8a4 4 0 0 1 0 8H5", "M16 10h3", "M17.5 8.5v3"],
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
    onClick: (event) => data.onOpen?.(event.currentTarget, data.id),
    onKeyDown: (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); data.onOpen?.(event.currentTarget, data.id); } },
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

/* The layout follows the exact message order seen by the model. Capacity is
   kept in a separate lane because it prepares execution, not prompt content. */
const LAYOUT = [
  { id: "L1", type: "lane", x: 20, y: 20, w: 1080, h: 290, title: "Choose the instructions for this request" },
  { id: "IN", type: "step", x: 290, y: 76, w: 520, h: 80, kind: "source", icon: "input", seq: "01", title: "Receive the completed context and current question", sub: "Patient record, care summaries, chat history, guideline evidence and clinician question" },
  { id: "TEMPLATE", type: "step", x: 290, y: 188, w: 520, h: 86, kind: "exact", icon: "template", seq: "02", title: "Load the correct versioned clinical instructions", sub: "Use the standard prompt, or the formulary-enabled version when that capability is on" },

  { id: "L2", type: "lane", x: 20, y: 340, w: 1080, h: 480, title: "Assemble the ordered model conversation", hint: "the current question must remain last" },
  { id: "GROUND", type: "step", x: 290, y: 398, w: 520, h: 82, kind: "handoff", icon: "evidence", seq: "03", title: "Add clinical record fields and guideline evidence", sub: "Fill the instructions with patient data and citation-numbered guideline excerpts" },
  { id: "CARE", type: "step", x: 290, y: 506, w: 520, h: 82, kind: "similarity", icon: "dialogue", seq: "04", title: "Present care summaries as earlier conversation", sub: "Add preventive care, recommendations, patient summary and quality measures as prior exchanges" },
  { id: "HISTORY", type: "step", x: 290, y: 614, w: 520, h: 82, kind: "similarity", icon: "history", seq: "05", title: "Append the last 10 real chat turns", sub: "Keep the clinician's actual conversation after the prepared care context" },
  { id: "QUESTION", type: "step", x: 290, y: 722, w: 520, h: 62, kind: "gate", icon: "question", seq: "06", title: "Place the clinician's current question last", sub: "The completed sequence is now ready to send to the model" },

  { id: "L3", type: "lane", x: 20, y: 850, w: 1080, h: 386, title: "Reserve capacity for the model call" },
  { id: "TOKENS", type: "step", x: 290, y: 908, w: 520, h: 78, kind: "exact", icon: "tokens", seq: "07", title: "Count the completed prompt tokens", sub: "Use the actual assembled input to estimate the request's model capacity" },
  { id: "CLIENT", type: "step", x: 290, y: 1012, w: 520, h: 88, kind: "gate", icon: "capacity", seq: "08", title: "Reserve a metered model client", sub: "The token manager reserves capacity; attach the formulary lookup tool only when enabled" },
  { id: "GO", type: "step", x: 290, y: 1128, w: 520, h: 78, kind: "output", icon: "arrow", title: "Start streaming generation with the grounded prompt", sub: "Hand the ordered conversation and metered client to the first model call" },
];

const EDGES = [
  ["in-template", "IN", "TEMPLATE"],
  ["template-ground", "TEMPLATE", "GROUND"],
  ["ground-care", "GROUND", "CARE"],
  ["care-history", "CARE", "HISTORY"],
  ["history-question", "HISTORY", "QUESTION"],
  ["question-tokens", "QUESTION", "TOKENS"],
  ["tokens-client", "TOKENS", "CLIENT"],
  ["client-go", "CLIENT", "GO"],
];

function buildElements(onOpen) {
  const nodes = LAYOUT.map((node) => ({
    id: node.id, type: node.type, position: { x: node.x, y: node.y }, style: { width: node.w, height: node.h },
    data: { ...node, onOpen }, draggable: false, selectable: false, focusable: node.type !== "lane", zIndex: node.type === "lane" ? 0 : 3,
  }));
  const edges = EDGES.map(([id, source, target]) => ({
    id, source, target, sourceHandle: "bottom", targetHandle: "top", type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: "#879087" },
    style: { stroke: "#9aa198", strokeWidth: 1.6 }, zIndex: 4,
  }));
  return { nodes, edges };
}

function PromptFlow() {
  const onOpen = React.useCallback((domNode, nodeId) => {
    const detail = window.DIAGRAM_STAGES?.prompt?.details?.[nodeId];
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
window.mountPromptReactFlow = function () {
  const container = document.getElementById("knowledgeReactFlow");
  if (!container) return;
  container.classList.add("rf-shell--knowledge", "rf-shell--prompt");
  if (!root) root = createRoot(container);
  root.render(h(PromptFlow));
};
window.unmountPromptReactFlow = function () { if (!root) return; root.unmount(); root = null; };
