/* Citation, Persistence and Telemetry — mounted ReactFlow LLD. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  answer: ["M4 5h16v14H4z", "M8 9h8", "M8 13h5"],
  match: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14", "m16 16 4.5 4.5", "m8 11 2 2 4-4"],
  refs: ["M6 3h12v18H6z", "M9 8h6", "M9 12h6", "M9 16h4"],
  done: ["M20 6 9 17l-5-5", "M4 4h16v16H4z"],
  branch: ["M7 4v7a4 4 0 0 0 4 4h6", "M7 20v-5", "m14 12 3 3-3 3"],
  discard: ["M4 7h16", "M9 7V4h6v3", "M7 7l1 14h8l1-14", "M10 11v6", "M14 11v6"],
  database: ["M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3", "M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6", "M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"],
  cache: ["M4 6h16v12H4z", "M8 10h8", "M8 14h5", "M17 4v4", "M15 6h4"],
  event: ["M4 12h16", "m15 7 5 5-5 5", "M4 7h6", "M4 17h6"],
  metrics: ["M5 20V10", "M12 20V4", "M19 20v-7", "M3 20h18"],
  complete: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "m8 12 3 3 5-6"],
};

function Icon({ name }) {
  return h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
    (ICONS[name] || ICONS.complete).map((d, i) => h("path", { d, key: i }))
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

/* The browser is told the answer is complete before persistence runs. The
   failure branch therefore stays explicit rather than being hidden in copy. */
const LAYOUT = [
  { id: "L1", type: "lane", x: 20, y: 20, w: 1080, h: 458, title: "Finish the clinician-visible answer" },
  { id: "IN", type: "step", x: 290, y: 76, w: 520, h: 76, kind: "source", icon: "answer", seq: "01", title: "Receive the completed answer and cited source IDs", sub: "Generation has ended; the browser is still listening on the SSE connection" },
  { id: "MATCH", type: "step", x: 290, y: 180, w: 520, h: 80, kind: "exact", icon: "match", seq: "02", title: "Match cited IDs to the retrieved guideline sources", sub: "Keep only sources the model actually referenced in its answer" },
  { id: "REFS", type: "step", x: 290, y: 288, w: 520, h: 72, kind: "handoff", icon: "refs", seq: "03", title: "Append readable guideline titles as References", sub: "Do not list retrieved guidelines that were never cited" },
  { id: "SSE_DONE", type: "step", x: 290, y: 388, w: 520, h: 62, kind: "output", icon: "done", seq: "04", title: "Send the References and [DONE] event through SSE", sub: "The clinician's browser now knows the visible answer is complete" },

  { id: "L2", type: "lane", x: 20, y: 508, w: 1080, h: 440, title: "Keep only an honest conversation record" },
  { id: "CHECK", type: "step", x: 290, y: 566, w: 520, h: 82, kind: "gate", icon: "branch", seq: "05", title: "Did generation finish without a terminal stream error?", sub: "A retry marker is removed; a final error marker makes the turn invalid" },
  { id: "DISCARD", type: "step", x: 40, y: 560, w: 220, h: 94, kind: "blocked", icon: "discard", title: "Discard the failed turn", sub: "Remove the saved question and do not store a partial answer" },
  { id: "CACHE", type: "step", x: 290, y: 682, w: 520, h: 82, kind: "similarity", icon: "cache", seq: "06", title: "Refresh the last-10-turn conversation cache", sub: "Cache the question-answer pair for the next prompt; skip this only if the clinician stopped the stream" },
  { id: "SAVE", type: "step", x: 290, y: 790, w: 520, h: 82, kind: "handoff", icon: "database", seq: "07", title: "Save the completed assistant answer to chat history", sub: "Persist the answer with its patient, clinician, conversation and request identifiers" },

  { id: "L3", type: "lane", x: 20, y: 978, w: 1080, h: 350, title: "Publish the operational record", hint: "performance is measured; clinical correctness is not" },
  { id: "EVENT", type: "step", x: 290, y: 1036, w: 520, h: 78, kind: "handoff", icon: "event", seq: "08", title: "Publish the completed chat-response event", sub: "Send the answer and correlation identifiers to the user-events stream" },
  { id: "METRICS", type: "step", x: 290, y: 1142, w: 520, h: 82, kind: "exact", icon: "metrics", seq: "09", title: "Record model usage and end-to-end stage timings", sub: "Capture model, token estimate, input/output and latency for this request" },
  { id: "DONE", type: "step", x: 290, y: 1252, w: 520, h: 48, kind: "output", icon: "complete", title: "Turn complete", sub: "The next question can reuse the updated conversation context" },
];

const GREEN = "#2f7a4a";
const RED = "#a2453c";

const EDGES = [
  ["in-match", "IN", "MATCH", {}],
  ["match-refs", "MATCH", "REFS", {}],
  ["refs-sse", "REFS", "SSE_DONE", { color: GREEN }],
  ["sse-check", "SSE_DONE", "CHECK", {}],
  ["check-discard", "CHECK", "DISCARD", { sh: "source-left", th: "target-right", label: "Terminal error", color: RED }],
  ["check-cache", "CHECK", "CACHE", { label: "Complete", color: GREEN }],
  ["cache-save", "CACHE", "SAVE", {}],
  ["save-event", "SAVE", "EVENT", {}],
  ["event-metrics", "EVENT", "METRICS", {}],
  ["metrics-done", "METRICS", "DONE", { color: GREEN }],
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

function SettleFlow() {
  const onOpen = React.useCallback((domNode, nodeId) => {
    const detail = window.DIAGRAM_STAGES?.settle?.details?.[nodeId];
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
window.mountSettleReactFlow = function () {
  const container = document.getElementById("knowledgeReactFlow");
  if (!container) return;
  container.classList.add("rf-shell--knowledge", "rf-shell--settle");
  if (!root) root = createRoot(container);
  root.render(h(SettleFlow));
};
window.unmountSettleReactFlow = function () { if (!root) return; root.unmount(); root = null; };
