/* Streaming Generation over SSE — mounted ReactFlow LLD. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  prompt: ["M4 5h16v14H4z", "M8 9h8", "M8 13h5"],
  model: ["M12 3v4", "M12 17v4", "M3 12h4", "M17 12h4", "M6 6l3 3", "M15 15l3 3", "M18 6l-3 3", "M9 15l-3 3"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "M12 7v5l3 2"],
  branch: ["M7 4v7a4 4 0 0 0 4 4h6", "M7 20v-5", "m14 12 3 3-3 3"],
  tool: ["M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-3 3-3-3z"],
  stop: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "m6 6 12 12"],
  citation: ["M7 4h10v16H7z", "M10 9h4", "M10 13h4", "M10 17h2"],
  sse: ["M5 7h14", "M5 12h10", "M5 17h7", "m17 14 3 3-3 3"],
  browser: ["M3 5h18v14H3z", "M3 9h18", "M7 7h.01", "M10 7h.01"],
  done: ["M20 6 9 17l-5-5", "M4 4h16v16H4z"],
};

function Icon({ name }) {
  return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
    (ICONS[name] || ICONS.sse).map((d, i) => h("path", { d, key: i }))
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

/* The happy path stays vertical. Timeout and tool-call outcomes leave sideways
   so they remain visible without interrupting the direct-answer SSE story. */
const LAYOUT = [
  { id: "L1", type: "lane", x: 20, y: 20, w: 1080, h: 420, title: "Start the streamed model response" },
  { id: "IN", type: "step", x: 290, y: 76, w: 520, h: 80, kind: "source", icon: "prompt", seq: "01", title: "Receive the grounded prompt and metered model client", sub: "The SSE response channel is already open from Request Admission" },
  { id: "CALL", type: "step", x: 290, y: 188, w: 520, h: 84, kind: "handoff", icon: "model", seq: "02", title: "Start the first model call as a stream", sub: "Ask the model to return its response incrementally instead of waiting for the full answer" },
  { id: "FIRST", type: "step", x: 290, y: 316, w: 520, h: 82, kind: "gate", icon: "clock", seq: "03", title: "Did the first model chunk arrive within 10 seconds?", sub: "Retry once after three seconds; stop if the second attempt also fails" },
  { id: "FAILED", type: "step", x: 40, y: 310, w: 220, h: 94, kind: "blocked", icon: "stop", title: "Send an SSE error and stop", sub: "Do not save a failed answer as a completed turn" },

  { id: "L2", type: "lane", x: 20, y: 470, w: 1080, h: 276, title: "Route the model response" },
  { id: "ROUTE", type: "step", x: 290, y: 528, w: 520, h: 82, kind: "gate", icon: "branch", seq: "04", title: "Is the model starting a formulary lookup?", sub: "Route a tool request away before any answer text is shown" },
  { id: "TOOL", type: "step", x: 840, y: 522, w: 240, h: 94, kind: "similarity", icon: "tool", title: "Pause the answer and run the formulary branch", sub: "Phase 06 performs the lookup, then returns a final answer stream" },
  { id: "ANSWER", type: "step", x: 290, y: 648, w: 520, h: 64, kind: "output", icon: "sse", title: "Continue with direct answer text", sub: "Every following model chunk uses the same SSE delivery path" },

  { id: "L3", type: "lane", x: 20, y: 776, w: 1080, h: 480, title: "Deliver the answer through Server-Sent Events", hint: "one-way server-to-browser stream" },
  { id: "CITATIONS", type: "step", x: 290, y: 834, w: 520, h: 84, kind: "exact", icon: "citation", seq: "05", title: "Track sources while preparing each chunk for display", sub: "Remember cited guideline IDs and keep internal citation markers out of the visible prose" },
  { id: "SSE", type: "step", x: 290, y: 946, w: 520, h: 82, kind: "handoff", icon: "sse", seq: "06", title: "Package the visible text as an SSE event", sub: "Prefix it with the conversation ID and safely encode line breaks" },
  { id: "DISPLAY", type: "step", x: 290, y: 1056, w: 520, h: 82, kind: "handoff", icon: "browser", seq: "07", title: "Push each SSE event to the clinician's browser", sub: "The answer grows on screen immediately while the model is still writing" },
  { id: "DONE", type: "step", x: 290, y: 1166, w: 520, h: 64, kind: "output", icon: "done", seq: "08", title: "Finish the SSE response", sub: "Append cited guideline titles, then send the [DONE] event" },
];

const GREEN = "#2f7a4a";
const RED = "#a2453c";
const PLUM = "#8c4b74";

const EDGES = [
  ["in-call", "IN", "CALL", {}],
  ["call-first", "CALL", "FIRST", {}],
  ["first-failed", "FIRST", "FAILED", { sh: "source-left", th: "target-right", label: "Two attempts fail", color: RED }],
  ["first-route", "FIRST", "ROUTE", { label: "Chunk arrives", color: GREEN }],
  ["route-tool", "ROUTE", "TOOL", { sh: "right", th: "left", label: "Tool request", color: PLUM }],
  ["route-answer", "ROUTE", "ANSWER", { label: "Answer text", color: GREEN }],
  ["answer-citations", "ANSWER", "CITATIONS", { color: GREEN }],
  ["citations-sse", "CITATIONS", "SSE", {}],
  ["sse-display", "SSE", "DISPLAY", {}],
  ["display-done", "DISPLAY", "DONE", { color: GREEN }],
];

function buildElements(onOpen) {
  const nodes = LAYOUT.map((node) => ({
    id: node.id, type: node.type, position: { x: node.x, y: node.y }, style: { width: node.w, height: node.h },
    data: { ...node, onOpen }, draggable: false, selectable: false, focusable: node.type !== "lane", zIndex: node.type === "lane" ? 0 : 3,
  }));
  const edges = EDGES.map(([id, source, target, options]) => ({
    id, source, target, sourceHandle: options.sh || "bottom", targetHandle: options.th || "top", type: "smoothstep", label: options.label,
    labelStyle: { fill: "#3f4a45", fontSize: 11, fontWeight: 700 }, labelBgStyle: { fill: "#f4f1e9", fillOpacity: 0.96 },
    labelBgPadding: [7, 4], labelBgBorderRadius: 7,
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: options.color || "#879087" },
    style: { stroke: options.color || "#9aa198", strokeWidth: 1.6 }, zIndex: 4,
  }));
  return { nodes, edges };
}

function GenerationFlow() {
  const onOpen = React.useCallback((domNode, nodeId) => {
    const detail = window.DIAGRAM_STAGES?.generation?.details?.[nodeId];
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
window.mountGenerationReactFlow = function () {
  const container = document.getElementById("knowledgeReactFlow");
  if (!container) return;
  container.classList.add("rf-shell--knowledge", "rf-shell--generation");
  if (!root) root = createRoot(container);
  root.render(h(GenerationFlow));
};
window.unmountGenerationReactFlow = function () { if (!root) return; root.unmount(); root = null; };
