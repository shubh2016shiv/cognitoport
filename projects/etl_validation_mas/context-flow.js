/* ============================================================
   Context diagram: one request to one bounded evidence package
   ============================================================
   The three phases follow CONTEXT_ENGINEERING.md directly:
   Gather what is known, enrich it with deterministic analysis, then format,
   trim, and order it for the planning agents. No model call occurs here.
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;

const CONTENT_L = 80;
const CONTENT_W = 1120;
const CX = CONTENT_L + CONTENT_W / 2;

const INPUT_W = 360;
const INPUT_Y = 10;
const INPUT_H = 74;
const CARD_W = 330;
const CARD_H = 102;
const CARD_GAP = 30;
const CONTEXT_W = 760;
const CONTEXT_H = 78;

const GATEWAY_Y = 120;
const GATHER_Y = 230;
const GATHER_H = 330;
const GATHER_ROW_1_Y = 300;
const GATHER_ROW_2_Y = 425;
const PC1_Y = 605;

const ENRICH_Y = 720;
const ENRICH_H = 330;
const ENRICH_ROW_1_Y = 790;
const ENRICH_ROW_2_Y = 915;
const PC2_Y = 1095;

const ASSEMBLY_Y = 1210;
const ASSEMBLY_H = 330;
const ASSEMBLY_ROW_1_Y = 1280;
const ASSEMBLY_ROW_2_Y = 1405;
const OUT_Y = 1585;

function rowPositions(count, width, gap, y) {
  const rowWidth = count * width + (count - 1) * gap;
  const x0 = CX - rowWidth / 2;
  return Array.from({ length: count }, (_, index) => ({ x: x0 + index * (width + gap), y }));
}

const G_TOP = rowPositions(3, CARD_W, CARD_GAP, GATHER_ROW_1_Y);
const G_BOTTOM = rowPositions(3, CARD_W, CARD_GAP, GATHER_ROW_2_Y);
const E_TOP = rowPositions(3, CARD_W, CARD_GAP, ENRICH_ROW_1_Y);
const E_BOTTOM = rowPositions(3, CARD_W, CARD_GAP, ENRICH_ROW_2_Y);
const A_TOP = rowPositions(3, CARD_W, CARD_GAP, ASSEMBLY_ROW_1_Y);
const A_BOTTOM = rowPositions(2, CARD_W, CARD_GAP, ASSEMBLY_ROW_2_Y);

const NODE_LAYOUT = {
  REQ: { kind: "source", type: "step", icon: "request", x: CX - INPUT_W - 30, y: INPUT_Y, w: INPUT_W, h: INPUT_H },
  STORE: { kind: "source", type: "step", icon: "database", x: CX + 30, y: INPUT_Y, w: INPUT_W, h: INPUT_H },
  GW: { kind: "container", type: "explainer", icon: "gateway", splitTop: true, x: CX - 270, y: GATEWAY_Y, w: 540, h: CONTEXT_H },

  G1: { kind: "gather", type: "step", icon: "schema", sequence: "01", x: G_TOP[0].x, y: G_TOP[0].y, w: CARD_W, h: CARD_H },
  G2: { kind: "gather", type: "step", icon: "lineage", sequence: "02", x: G_TOP[1].x, y: G_TOP[1].y, w: CARD_W, h: CARD_H },
  G3: { kind: "gather", type: "step", icon: "reference", sequence: "03", x: G_TOP[2].x, y: G_TOP[2].y, w: CARD_W, h: CARD_H },
  G4: { kind: "gather", type: "step", icon: "rules", sequence: "04", x: G_BOTTOM[0].x, y: G_BOTTOM[0].y, w: CARD_W, h: CARD_H },
  G5: { kind: "gather", type: "step", icon: "code", sequence: "05", x: G_BOTTOM[1].x, y: G_BOTTOM[1].y, w: CARD_W, h: CARD_H },
  G6: { kind: "gather", type: "step", icon: "registry", sequence: "06", x: G_BOTTOM[2].x, y: G_BOTTOM[2].y, w: CARD_W, h: CARD_H },

  PC1: { kind: "container", type: "explainer", icon: "context", x: CX - CONTEXT_W / 2, y: PC1_Y, w: CONTEXT_W, h: CONTEXT_H },

  E1: { kind: "enrich", type: "step", icon: "classify", sequence: "01", x: E_TOP[0].x, y: E_TOP[0].y, w: CARD_W, h: CARD_H },
  E2: { kind: "enrich", type: "step", icon: "conflict", sequence: "02", x: E_TOP[1].x, y: E_TOP[1].y, w: CARD_W, h: CARD_H },
  E3: { kind: "enrich", type: "step", icon: "join", sequence: "03", x: E_TOP[2].x, y: E_TOP[2].y, w: CARD_W, h: CARD_H },
  E4: { kind: "enrich", type: "step", icon: "transform", sequence: "04", x: E_BOTTOM[0].x, y: E_BOTTOM[0].y, w: CARD_W, h: CARD_H },
  E5: { kind: "enrich", type: "step", icon: "trim", sequence: "05", x: E_BOTTOM[1].x, y: E_BOTTOM[1].y, w: CARD_W, h: CARD_H },
  E6: { kind: "enrich", type: "step", icon: "family", sequence: "06", x: E_BOTTOM[2].x, y: E_BOTTOM[2].y, w: CARD_W, h: CARD_H },

  PC2: { kind: "container", type: "explainer", icon: "context", x: CX - CONTEXT_W / 2, y: PC2_Y, w: CONTEXT_W, h: CONTEXT_H },

  A1: { kind: "assemble", type: "step", icon: "markdown", sequence: "01", x: A_TOP[0].x, y: A_TOP[0].y, w: CARD_W, h: CARD_H },
  A2: { kind: "assemble", type: "step", icon: "shield", sequence: "02", x: A_TOP[1].x, y: A_TOP[1].y, w: CARD_W, h: CARD_H },
  A3: { kind: "assemble", type: "step", icon: "profile", sequence: "03", x: A_TOP[2].x, y: A_TOP[2].y, w: CARD_W, h: CARD_H },
  A4: { kind: "assemble", type: "step", icon: "budget", sequence: "04", x: A_BOTTOM[0].x, y: A_BOTTOM[0].y, w: CARD_W, h: CARD_H },
  A5: { kind: "assemble", type: "step", icon: "order", sequence: "05", x: A_BOTTOM[1].x, y: A_BOTTOM[1].y, w: CARD_W, h: CARD_H },

  OUT: { kind: "output", type: "explainer", icon: "package", x: CX - CONTEXT_W / 2, y: OUT_Y, w: CONTEXT_W, h: CONTEXT_H },
};

const LANES = {
  "lane-gather": {
    label: "01 · Gather The Facts",
    hint: "Read the numbered cards from left to right, top row first",
    kind: "gather",
    x: CONTENT_L,
    y: GATHER_Y,
    w: CONTENT_W,
    h: GATHER_H,
  },
  "lane-enrich": {
    label: "02 · Understand The Evidence",
    hint: "Six automatic checks make raw evidence safe to use",
    kind: "enrich",
    x: CONTENT_L,
    y: ENRICH_Y,
    w: CONTENT_W,
    h: ENRICH_H,
  },
  "lane-assemble": {
    label: "03 · Build The Context Package",
    hint: "Five packaging steps prepare the evidence for Plan",
    kind: "assemble",
    x: CONTENT_L,
    y: ASSEMBLY_Y,
    w: CONTENT_W,
    h: ASSEMBLY_H,
  },
};

const FLOW_EDGES = [
  { from: "REQ", to: "GW", sourceHandle: "bottom", targetHandle: "top-left" },
  { from: "STORE", to: "GW", sourceHandle: "bottom", targetHandle: "top-right" },
  { from: "GW", to: "lane-gather", sourceHandle: "bottom", targetHandle: "top" },
  { from: "lane-gather", to: "PC1", sourceHandle: "bottom", targetHandle: "top" },
  { from: "PC1", to: "lane-enrich", sourceHandle: "bottom", targetHandle: "top" },
  { from: "lane-enrich", to: "PC2", sourceHandle: "bottom", targetHandle: "top" },
  { from: "PC2", to: "lane-assemble", sourceHandle: "bottom", targetHandle: "top" },
  { from: "lane-assemble", to: "OUT", sourceHandle: "bottom", targetHandle: "top" },
];

const ICONS = {
  request: ["M5 4h14v16H5z", "M8 8h8", "M8 12h6", "M8 16h4"],
  database: ["M4 6c0-2 16-2 16 0s-16 2-16 0", "M4 6v12c0 2 16 2 16 0V6", "M4 12c0 2 16 2 16 0"],
  schema: ["M4 5h16v14H4z", "M4 10h16", "M10 5v14"],
  lineage: ["M6 5h5", "M13 5h5v5", "M6 19h5", "M13 19h5v-5", "M11 5v14", "M11 12h7"],
  reference: ["M4 6h7v12H4z", "M13 6h7v12h-7z", "M11 9h2", "M11 15h2"],
  rules: ["M7 5h12", "M7 12h12", "M7 19h12", "m3-14 .8.8L5.5 4", "m-2.5 8 .8.8L5.5 11", "m-2.5 8 .8.8L5.5 18"],
  code: ["m8.5 7-4 5 4 5", "m15.5 7 4 5-4 5", "m13.5 4-3 16"],
  registry: ["M5 4h14v16H5z", "M8 8h3", "M13 8h3", "M8 12h3", "M13 12h3", "M8 16h3", "M13 16h3"],
  context: ["M4 5h16v14H4z", "M8 9h8", "M8 13h8", "M8 17h5"],
  gateway: ["M4 5h6v5H4z", "M14 5h6v5h-6z", "M9 16h6v4H9z", "M7 10v3h5v3", "M17 10v3h-5"],
  classify: ["M4 6h6v5H4z", "M14 6h6v5h-6z", "M4 15h6v4H4z", "M14 15h6v4h-6z"],
  join: ["M8 7H6a4 4 0 0 0 0 8h2", "M16 7h2a4 4 0 0 1 0 8h-2", "M9 12h6"],
  conflict: ["M12 3 2.5 8h-5z", "M12 9v4", "M12 17h.01"],
  transform: ["M5 7h6", "m9 5 4 4-4 4", "M19 17h-6", "m-9 2-4-4 4-4"],
  trim: ["M5 6h14", "M8 11h8", "M10 16h4"],
  family: ["M4 5h7v6H4z", "M13 5h7v6h-7z", "M8 15h8v5H8z", "M8 11v4", "M16 11v4"],
  markdown: ["M4 5h16v14H4z", "M7 15V9l3 3 3-3v6", "m15 9 2 2 2-2v6"],
  shield: ["M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z", "m9 12 2 2 4-5"],
  profile: ["M5 5h14v4H5z", "M5 11h8v8H5z", "M15 11h4v8h-4z"],
  budget: ["M4 18a8 8 0 1 1 16 0", "m12 10 4 4", "M7 18h10"],
  order: ["M6 7h12", "M6 12h12", "M6 17h12", "m3-12 2-2", "m-2 7 2-2", "m-2 7 2-2"],
  package: ["m4 7 8-4 8 4-8 4z", "M4 7v10l8 4 8-4V7", "M12 11v10"],
};

function FlowIcon({ name }) {
  const paths = ICONS[name] || ICONS.context;
  return h(
    "span",
    { className: "rf-node-icon", "aria-hidden": "true" },
    h(
      "svg",
      {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.7,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
      ...paths.map((d, index) => h("path", { d, key: `${name}-${index}` }))
    )
  );
}

function Handles(splitTop = false) {
  const topTargets = splitTop
    ? [
        h(Handle, { key: "top-left", id: "top-left", type: "target", position: Position.Top, className: "rf-handle", style: { left: "11.2%" } }),
        h(Handle, { key: "top-right", id: "top-right", type: "target", position: Position.Top, className: "rf-handle", style: { left: "88.8%" } }),
      ]
    : [h(Handle, { key: "top", id: "top", type: "target", position: Position.Top, className: "rf-handle" })];

  return [
    ...topTargets,
    h(Handle, { key: "left", id: "left", type: "target", position: Position.Left, className: "rf-handle" }),
    h(Handle, { key: "bottom", id: "bottom", type: "source", position: Position.Bottom, className: "rf-handle" }),
    h(Handle, { key: "right", id: "right", type: "source", position: Position.Right, className: "rf-handle" }),
  ];
}

function StepCard({ data }) {
  return h(
    "div",
    { className: `rf-node rf-node--${data.kind}` },
    ...Handles(),
    data.sequence ? h("span", { className: "rf-node-sequence", "aria-hidden": "true" }, data.sequence) : null,
    h(
      "div",
      { className: "rf-node-main" },
      h(FlowIcon, { name: data.icon }),
      h("p", { className: "rf-node-title" }, data.title)
    ),
    data.sub ? h("p", { className: "rf-node-sub" }, data.sub) : null
  );
}

function ExplainerCard({ data }) {
  return h(
    "div",
    { className: `rf-node rf-node--explainer rf-node--${data.kind}` },
    ...Handles(data.splitTop),
    h(
      "div",
      { className: "rf-node-main" },
      h(FlowIcon, { name: data.icon }),
      h("p", { className: "rf-explainer-title" }, data.title)
    ),
    data.sub ? h("p", { className: "rf-explainer-lines" }, data.sub) : null
  );
}

function LaneBackground({ data }) {
  return h(
    "div",
    { className: `rf-lane rf-lane--${data.kind}` },
    ...Handles(),
    h(
      "span",
      { className: "rf-lane-label rf-lane-label--split" },
      h("strong", null, data.label),
      h("small", { className: "rf-lane-annotation" }, data.hint)
    )
  );
}

const NODE_TYPES = { step: StepCard, explainer: ExplainerCard, lane: LaneBackground };

function buildElements(details) {
  const nodes = [];

  Object.entries(LANES).forEach(([id, lane]) => {
    nodes.push({
      id,
      type: "lane",
      position: { x: lane.x, y: lane.y },
      style: { width: lane.w, height: lane.h },
      data: { label: lane.label, hint: lane.hint, kind: lane.kind },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: 0,
    });
  });

  Object.entries(NODE_LAYOUT).forEach(([id, layout]) => {
    const detail = details[id] || { title: id };
    nodes.push({
      id,
      type: layout.type,
      position: { x: layout.x, y: layout.y },
      style: { width: layout.w, height: layout.h },
      data: { title: detail.title, sub: detail.sub, kind: layout.kind, icon: layout.icon, sequence: layout.sequence, splitTop: layout.splitTop },
      ariaLabel: `${detail.title}. ${detail.sub || detail.body || ""}`,
      ariaRole: "button",
      focusable: true,
      draggable: false,
      zIndex: 1,
    });
  });

  const edges = FLOW_EDGES.map((edge) => ({
    id: `${edge.from}-${edge.to}`,
    source: edge.from,
    target: edge.to,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: "straight",
    markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: "#5c6b64" },
    style: { stroke: "#5c6b64", strokeWidth: 1.5, strokeLinecap: "round" },
    zIndex: 0,
  }));

  return { nodes, edges };
}

function ContextFlow({ details, onNodeActivate }) {
  const { nodes, edges } = React.useMemo(() => buildElements(details), [details]);

  const handleNodeClick = React.useCallback(
    (event, node) => {
      if (node.type === "lane") return;
      onNodeActivate(event.target?.closest?.(".react-flow__node") || event.currentTarget, node.id);
    },
    [onNodeActivate]
  );

  const handleKeyDown = React.useCallback(
    (event) => {
      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
      const nodeEl = event.target.closest?.(".react-flow__node");
      const nodeId = nodeEl?.dataset.id;
      if (!nodeId || LANES[nodeId]) return;
      event.preventDefault();
      onNodeActivate(nodeEl, nodeId);
    },
    [onNodeActivate]
  );

  return h(
    "div",
    { className: "rf-focus-scope", onKeyDown: handleKeyDown },
    h(
      ReactFlow,
      {
        nodes,
        edges,
        nodeTypes: NODE_TYPES,
        fitView: true,
        fitViewOptions: { padding: 0.035 },
        minZoom: 0.38,
        maxZoom: 2,
        nodesDraggable: false,
        nodesConnectable: false,
        elementsSelectable: false,
        nodesFocusable: true,
        panOnScroll: false,
        zoomOnScroll: false,
        zoomOnPinch: true,
        zoomOnDoubleClick: false,
        panOnDrag: true,
        proOptions: { hideAttribution: false },
        onNodeClick: handleNodeClick,
        onInit: (instance) => { window.__diagramReactFlowInstance = instance; },
      },
      h(Background, { gap: 22, size: 1, color: "rgba(16, 22, 20, 0.08)" }),
      h(Controls, { showInteractive: false, position: "bottom-right" })
    )
  );
}

let root = null;
let mountedStage = null;

window.mountContextReactFlow = function mountContextReactFlow(stageId) {
  const container = document.getElementById("knowledgeReactFlow");
  const cfg = window.DIAGRAM_STAGES && window.DIAGRAM_STAGES[stageId];
  if (!container || !cfg) return;

  container.classList.add("rf-shell--context");
  const details = cfg.details;

  const onNodeActivate = (domEl, nodeId) => {
    const detail = details[nodeId];
    if (!detail || !domEl) return;
    window.showKnowledgeBubble(domEl, detail);
  };

  if (!root || mountedStage !== stageId) {
    if (root) root.unmount();
    root = createRoot(container);
    mountedStage = stageId;
  }
  root.render(h(ContextFlow, { details, onNodeActivate }));
};

window.unmountContextReactFlow = function unmountContextReactFlow() {
  if (!root) return;
  root.unmount();
  root = null;
  mountedStage = null;
};
