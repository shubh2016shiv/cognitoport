/* Request Admission — mounted ReactFlow LLD. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  person: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M4 21a8 8 0 0 1 16 0"],
  shield: ["M12 3 20 6v5c0 5-3.2 8.5-8 10-4.8-1.5-8-5-8-10V6z", "m8.5 12 2.2 2.2 4.8-4.8"],
  branch: ["M7 4v7a4 4 0 0 0 4 4h6", "M7 20v-5", "m14 12 3 3-3 3"],
  stop: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "m6 6 12 12"],
  audit: ["M9 4h6v3H9z", "M7 5H5v16h14V5h-2", "M9 12h6", "M9 16h4"],
  toggle: ["M7 7h10a5 5 0 0 1 0 10H7A5 5 0 0 1 7 7", "M16 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5"],
  tag: ["M3 12V4h8l10 10-8 8z", "M7.5 8.5h.01"],
  database: ["M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3", "M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6", "M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"],
  stream: ["M12 12h.01", "M8.5 8.5a5 5 0 0 0 0 7", "M15.5 8.5a5 5 0 0 1 0 7", "M5.5 5.5a9 9 0 0 0 0 13", "M18.5 5.5a9 9 0 0 1 0 13"],
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
  h(Handle, { type: "source", position: Position.Right, id: "right", key: "sr", className: "rf-handle" }),
  h(Handle, { type: "source", position: Position.Bottom, id: "bottom", key: "sb", className: "rf-handle" }),
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
    h("span", { className: "rf-lane-label" }, h("strong", null, data.title), h("span", { className: "rf-lane-annotation" }, ` — ${data.hint}`))
  );
}

const NODE_TYPES = { step: StepNode, lane: LaneNode };

/* One centre column read top to bottom; the only sideways move is the rejection. */
const LAYOUT = [
  { id: "L1", type: "lane", x: 20, y: 20, w: 1080, h: 398, title: "Authenticate clinician access", hint: "no patient record is loaded until identity is verified" },
  { id: "ASK", type: "step", x: 290, y: 78, w: 520, h: 80, kind: "source", icon: "person", seq: "01", title: "Receive the clinician's question", sub: "Question text, patient ID and an existing conversation ID when this is a follow-up" },
  { id: "VERIFY", type: "step", x: 290, y: 188, w: 520, h: 80, kind: "handoff", icon: "shield", seq: "02", title: "Authenticate the clinician", sub: "Validate an EHR launch token or a direct sign-in token, then resolve the clinician's identity" },
  { id: "AUTH_GATE", type: "step", x: 290, y: 298, w: 520, h: 80, kind: "gate", icon: "branch", title: "Was the clinician verified?", sub: "A valid token must resolve to a known clinician" },
  { id: "STOP_AUTH", type: "step", x: 870, y: 290, w: 210, h: 96, kind: "blocked", icon: "stop", title: "Reject the request", sub: "Return an access error; no patient data is loaded" },

  { id: "L2", type: "lane", x: 20, y: 448, w: 1080, h: 500, title: "Record and prepare the request", hint: "audit the request, load chatbot settings, create its IDs and save the question" },
  { id: "AUDIT", type: "step", x: 290, y: 506, w: 520, h: 80, kind: "exact", icon: "audit", seq: "03", title: "Publish the clinician request audit event", sub: "Record who asked, which chat endpoint was called and when" },
  { id: "FLAGS", type: "step", x: 290, y: 616, w: 520, h: 80, kind: "exact", icon: "toggle", seq: "04", title: "Load chatbot feature flags", sub: "Enable formulary lookup and detailed phase timing for this request when configured" },
  { id: "IDS", type: "step", x: 290, y: 726, w: 520, h: 80, kind: "exact", icon: "tag", seq: "05", title: "Create conversation and request IDs", sub: "Thread ID, run ID and question-response ID connect every later operation" },
  { id: "SAVE", type: "step", x: 290, y: 836, w: 520, h: 80, kind: "container", icon: "database", seq: "06", title: "Save the clinician's question", sub: "Write the user turn to chat history before attempting an answer" },

  { id: "L3", type: "lane", x: 20, y: 978, w: 1080, h: 288, title: "Start the live response", hint: "prepare streaming before guideline or patient-context loading begins" },
  { id: "STREAM", type: "step", x: 290, y: 1036, w: 520, h: 80, kind: "handoff", icon: "stream", seq: "07", title: "Prepare the live response channel with Server-Sent Events (SSE)", sub: "Keep the HTTP connection open and disable response buffering" },
  { id: "GO", type: "step", x: 290, y: 1146, w: 520, h: 90, kind: "output", icon: "arrow", title: "Start guideline and patient-context loading", sub: "Both independent lanes begin after the live response channel is ready" },
];

const GREEN = "#2f7a4a";
const RED = "#a2453c";

const EDGES = [
  ["ask-verify", "ASK", "VERIFY", {}],
  ["verify-gate", "VERIFY", "AUTH_GATE", {}],
  ["gate-no", "AUTH_GATE", "STOP_AUTH", { sh: "right", th: "left", label: "No", color: RED }],
  ["gate-yes", "AUTH_GATE", "AUDIT", { label: "Yes", color: GREEN }],
  ["audit-flags", "AUDIT", "FLAGS", {}],
  ["flags-ids", "FLAGS", "IDS", {}],
  ["ids-save", "IDS", "SAVE", {}],
  ["save-stream", "SAVE", "STREAM", {}],
  ["stream-go", "STREAM", "GO", { color: GREEN }],
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

function AdmissionFlow() {
  const onOpen = React.useCallback((domNode, nodeId) => {
    const detail = window.DIAGRAM_STAGES?.ingress?.details?.[nodeId];
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
window.mountAdmissionReactFlow = function () {
  const container = document.getElementById("knowledgeReactFlow");
  if (!container) return;
  container.classList.add("rf-shell--knowledge", "rf-shell--admission");
  if (!root) root = createRoot(container);
  root.render(h(AdmissionFlow));
};
window.unmountAdmissionReactFlow = function () { if (!root) return; root.unmount(); root = null; };
