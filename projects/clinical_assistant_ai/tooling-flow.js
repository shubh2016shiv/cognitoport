/* Formulary Tool Loop — mounted ReactFlow LLD. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  tool: ["M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-3 3-3-3z"],
  args: ["M8 4H5v16h3", "M16 4h3v16h-3", "M10 9h4", "M10 15h4"],
  plan: ["M3 6h18v12H3z", "M3 10h18", "M7 15h4"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14", "m16 16 4.5 4.5"],
  details: ["M6 3h12v18H6z", "M9 8h6", "M9 12h6", "M9 16h4"],
  table: ["M4 5h16v14H4z", "M4 10h16", "M10 5v14", "M4 15h16"],
  prompt: ["M4 5h16v14H4z", "M8 9h8", "M8 13h5", "M16 16h2"],
  lock: ["M6 10h12v10H6z", "M8 10V7a4 4 0 0 1 8 0v3", "M12 14v2"],
  sse: ["M5 7h14", "M5 12h10", "M5 17h7", "m17 14 3 3-3 3"],
};

function Icon({ name }) {
  return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
    (ICONS[name] || ICONS.tool).map((d, i) => h("path", { d, key: i }))
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

/* This is a deliberately bounded detour: one patient-specific lookup followed
   by one model pass whose execution path cannot enter another tool loop. */
const LAYOUT = [
  { id: "L1", type: "lane", x: 20, y: 20, w: 1080, h: 290, title: "Understand the formulary lookup request" },
  { id: "IN", type: "step", x: 290, y: 76, w: 520, h: 80, kind: "source", icon: "tool", seq: "01", title: "Receive the interrupted formulary tool request", sub: "The first model call asked for patient-specific drug coverage instead of showing an answer" },
  { id: "ARGS", type: "step", x: 290, y: 188, w: 520, h: 86, kind: "exact", icon: "args", seq: "02", title: "Reassemble the requested drug classes and coverage filters", sub: "Combine streamed arguments and require at least one specific drug class" },

  { id: "L2", type: "lane", x: 20, y: 340, w: 1080, h: 488, title: "Search the patient's covered-drug list", hint: "formulary means the plan's covered medications" },
  { id: "PLAN", type: "step", x: 290, y: 398, w: 520, h: 82, kind: "handoff", icon: "plan", seq: "03", title: "Load the patient's insurance and formulary plan", sub: "Resolve the exact covered-drug list associated with this patient" },
  { id: "SEARCH", type: "step", x: 290, y: 506, w: 520, h: 84, kind: "exact", icon: "search", seq: "04", title: "Search the patient's formulary for each drug class in parallel", sub: "Find matching covered medications independently for every requested class" },
  { id: "DETAILS", type: "step", x: 290, y: 616, w: 520, h: 84, kind: "similarity", icon: "details", seq: "05", title: "Load the matching drugs' coverage details", sub: "Fetch tier and restrictions in batches; apply PA, QL, ST or NDS filters only when requested" },
  { id: "TABLE", type: "step", x: 290, y: 726, w: 520, h: 66, kind: "output", icon: "table", seq: "06", title: "Build a clear formulary coverage table", sub: "Drug name, coverage tier and plan requirements — or an explicit no-match result" },

  { id: "L3", type: "lane", x: 20, y: 858, w: 1080, h: 376, title: "Answer once with the lookup result", hint: "tool-call handling does not run again" },
  { id: "PROMPT", type: "step", x: 290, y: 916, w: 520, h: 82, kind: "handoff", icon: "prompt", seq: "07", title: "Add the formulary result to the original grounded conversation", sub: "Preserve the patient context, question, guideline evidence and the model's lookup request" },
  { id: "SECOND", type: "step", x: 290, y: 1024, w: 520, h: 84, kind: "gate", icon: "lock", seq: "08", title: "Start the one allowed follow-up model call", sub: "Tool-call handling is disabled, so the request cannot enter a second lookup loop" },
  { id: "GO", type: "step", x: 290, y: 1136, w: 520, h: 66, kind: "output", icon: "sse", title: "Stream the final answer through the existing SSE channel", sub: "Use the same timeout, citation tracking and browser-delivery path as a direct answer" },
];

const GREEN = "#2f7a4a";
const EDGES = [
  ["in-args", "IN", "ARGS"],
  ["args-plan", "ARGS", "PLAN"],
  ["plan-search", "PLAN", "SEARCH"],
  ["search-details", "SEARCH", "DETAILS"],
  ["details-table", "DETAILS", "TABLE"],
  ["table-prompt", "TABLE", "PROMPT"],
  ["prompt-second", "PROMPT", "SECOND"],
  ["second-go", "SECOND", "GO", GREEN],
];

function buildElements(onOpen) {
  const nodes = LAYOUT.map((node) => ({
    id: node.id, type: node.type, position: { x: node.x, y: node.y }, style: { width: node.w, height: node.h },
    data: { ...node, onOpen }, draggable: false, selectable: false, focusable: node.type !== "lane", zIndex: node.type === "lane" ? 0 : 3,
  }));
  const edges = EDGES.map(([id, source, target, color]) => ({
    id, source, target, sourceHandle: "bottom", targetHandle: "top", type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: color || "#879087" },
    style: { stroke: color || "#9aa198", strokeWidth: 1.6 }, zIndex: 4,
  }));
  return { nodes, edges };
}

function ToolingFlow() {
  const onOpen = React.useCallback((domNode, nodeId) => {
    const detail = window.DIAGRAM_STAGES?.tooling?.details?.[nodeId];
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
window.mountToolingReactFlow = function () {
  const container = document.getElementById("knowledgeReactFlow");
  if (!container) return;
  container.classList.add("rf-shell--knowledge", "rf-shell--tooling");
  if (!root) root = createRoot(container);
  root.render(h(ToolingFlow));
};
window.unmountToolingReactFlow = function () { if (!root) return; root.unmount(); root = null; };
