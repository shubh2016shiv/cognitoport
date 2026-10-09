/* ============================================================
   Knowledge diagram: source material to reusable evidence
   ============================================================
   This view keeps the decisive architecture visible without reproducing the
   preparation document field by field. Documents and production code stay in
   separate lanes, produce separate record families, share a fingerprinted
   store, and expose exact and similarity access with different trust claims.
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;

/* ---------- hand-placed layout, in pixels ---------- */
const STEP_W = 420;
const PDF_X = 70;
const ETL_X = 610;
const CONTENT_L = 32;
const CONTENT_W = 1068;
const CX = CONTENT_L + CONTENT_W / 2;

const SOURCE_Y = 18;
const LANE_TOP = 116;
const LANE_H = 430;

const STORE_LANE_Y = 690;
const STORE_LANE_H = 176;
const ACCESS_LANE_Y = 914;
const ACCESS_LANE_H = 170;

const READY_W = 650;
const READY_X = CX - READY_W / 2;
const READY_Y = 1128;

const NODE_LAYOUT = {
  PDFSRC: { kind: "pdf", type: "step", icon: "document", x: PDF_X, y: SOURCE_Y, w: STEP_W, h: 74 },
  CODESRC: { kind: "etl", type: "step", icon: "code", x: ETL_X, y: SOURCE_Y, w: STEP_W, h: 74 },

  D1: { kind: "pdf", type: "step", icon: "scan", sequence: "01", x: PDF_X, y: 166, w: STEP_W, h: 72 },
  D2: { kind: "pdf", type: "step", icon: "map", sequence: "02", x: PDF_X, y: 258, w: STEP_W, h: 72 },
  D3: { kind: "pdf", type: "step", icon: "table", sequence: "03", x: PDF_X, y: 350, w: STEP_W, h: 72 },
  D4: { kind: "pdf", type: "step", icon: "package", sequence: "04", x: PDF_X, y: 442, w: STEP_W, h: 72 },

  E1: { kind: "etl", type: "step", icon: "filter", sequence: "01", x: ETL_X, y: 190, w: STEP_W, h: 76 },
  E2: { kind: "etl", type: "step", icon: "lineage", sequence: "02", x: ETL_X, y: 304, w: STEP_W, h: 76 },
  E3: { kind: "etl", type: "step", icon: "package", sequence: "03", x: ETL_X, y: 418, w: STEP_W, h: 76 },

  FP: { kind: "fingerprint", type: "step", icon: "fingerprint", x: 290, y: 584, w: 550, h: 70 },

  CDOC: { kind: "pdf", type: "step", icon: "documents", x: 55, y: 748, w: 320, h: 82 },
  CETL: { kind: "etl", type: "step", icon: "code", x: 405, y: 748, w: 320, h: 82 },
  CMAN: { kind: "manifest", type: "step", icon: "manifest", x: 755, y: 748, w: 320, h: 82 },

  Q1: { kind: "exact", type: "step", icon: "exact", x: 150, y: 970, w: 390, h: 78 },
  Q2: { kind: "similarity", type: "step", icon: "search", x: 590, y: 970, w: 390, h: 78 },

  READY: { kind: "output", type: "explainer", icon: "database", x: READY_X, y: READY_Y, w: READY_W, h: 88 },
};

const LANES = {
  "lane-doc": {
    label: "Document Evidence",
    hint: "What the data should contain",
    kind: "pdf",
    x: 34,
    y: LANE_TOP,
    w: 498,
    h: LANE_H,
  },
  "lane-code": {
    label: "Code Evidence",
    hint: "What the pipeline actually does",
    kind: "etl",
    x: 572,
    y: LANE_TOP,
    w: 498,
    h: LANE_H,
  },
  "lane-store": {
    label: "Five separate collections",
    hint: "One store address; document, code, and run history never become one pile",
    kind: "store",
    x: CONTENT_L,
    y: STORE_LANE_Y,
    w: CONTENT_W,
    h: STORE_LANE_H,
  },
  "lane-access": {
    label: "Two ways to ask",
    hint: "Certain questions use fields; open questions use ranked meaning",
    kind: "ask",
    x: 110,
    y: ACCESS_LANE_Y,
    w: 910,
    h: ACCESS_LANE_H,
  },
};

const FLOW_EDGES = [
  ["PDFSRC", "D1"],
  ["CODESRC", "E1"],
  ["D1", "D2"],
  ["D2", "D3"],
  ["D3", "D4"],
  ["E1", "E2"],
  ["E2", "E3"],
  ["D4", "CDOC"],
  ["E3", "CETL"],
  ["D4", "FP", { dashed: true }],
  ["E3", "FP", { dashed: true }],
  ["FP", "CMAN"],
  ["lane-store", "Q1"],
  ["lane-store", "Q2"],
  ["Q1", "READY"],
  ["Q2", "READY"],
];

const ICONS = {
  document: ["M4 2.8h10l4 4V21.2H4z", "M14 2.8v4h4", "M7.5 11h7", "M7.5 15h7"],
  code: ["m8.5 7-4 5 4 5", "m15.5 7 4 5-4 5", "m13.5 4-3 16"],
  scan: ["M4 8V4h4", "M16 4h4v4", "M20 16v4h-4", "M8 20H4v-4", "M7 12h10"],
  map: ["M4 5h16v14H4z", "M8 9h8", "M8 13h5", "M8 17h8"],
  table: ["M4 5h16v14H4z", "M4 10h16", "M10 5v14"],
  filter: ["M3.5 5h17l-6.5 7.2v5.3l-4 2v-7.3z"],
  lineage: ["M6 5h5", "M13 5h5v5", "M6 19h5", "M13 19h5v-5", "M11 5v14", "M11 12h7"],
  package: ["m4 7 8-4 8 4-8 4z", "M4 7v10l8 4 8-4V7", "M12 11v10"],
  contract: ["M6 3h12v18H6z", "M9 8h6", "M9 12h6", "M9 16h4"],
  schema: ["M4 5h16v14H4z", "M4 10h16", "M9 5v14", "M15 5v14"],
  rules: ["M7 5h12", "M7 12h12", "M7 19h12", "m3-14 .8.8L5.5 4", "m-2.5 8 .8.8L5.5 11", "m-2.5 8 .8.8L5.5 18"],
  database: ["M4 6c0-2 16-2 16 0s-16 2-16 0", "M4 6v12c0 2 16 2 16 0V6", "M4 12c0 2 16 2 16 0"],
  documents: ["M4 5h7v14H4z", "M13 5h7v14h-7z", "M6.5 9h2", "M15.5 9h2"],
  fingerprint: ["M12 3a7 7 0 0 0-7 7", "M19 10a7 7 0 0 0-7-7", "M8 12a4 4 0 0 1 8 0v3", "M10 14a2 2 0 0 1 4 0v5", "M7 16a5 5 0 0 0 3 5"],
  manifest: ["M6 3h12v18H6z", "M9 8h6", "M9 12h6", "M9 16h4", "m15 15 1 1 2-3"],
  exact: ["M4 6h16", "M4 12h16", "M4 18h10", "m17 17 2 2 3-4"],
  search: ["M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z", "m16 16 5 5"],
};

function FlowIcon({ name }) {
  const paths = ICONS[name] || ICONS.contract;
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

function StepCard({ data }) {
  return h(
    "div",
    { className: `rf-node rf-node--${data.kind}` },
    h(Handle, { type: "target", position: Position.Top, className: "rf-handle" }),
    data.sequence ? h("span", { className: "rf-node-sequence", "aria-hidden": "true" }, data.sequence) : null,
    h(
      "div",
      { className: "rf-node-main" },
      h(FlowIcon, { name: data.icon }),
      h("p", { className: "rf-node-title" }, data.title)
    ),
    data.sub ? h("p", { className: "rf-node-sub" }, data.sub) : null,
    h(Handle, { type: "source", position: Position.Bottom, className: "rf-handle" })
  );
}

function ExplainerCard({ data }) {
  return h(
    "div",
    { className: `rf-node rf-node--${data.kind}` },
    h(Handle, { type: "target", position: Position.Top, className: "rf-handle" }),
    h(
      "div",
      { className: "rf-node-main" },
      h(FlowIcon, { name: data.icon }),
      h("p", { className: "rf-explainer-title" }, data.title)
    ),
    data.sub ? h("p", { className: "rf-explainer-lines" }, data.sub) : null,
    h(Handle, { type: "source", position: Position.Bottom, className: "rf-handle" })
  );
}

function LaneBackground({ data }) {
  return h(
    "div",
    { className: `rf-lane rf-lane--${data.kind}` },
    h(Handle, { type: "target", position: Position.Top, className: "rf-handle" }),
    h(
      "span",
      { className: "rf-lane-label rf-lane-label--split" },
      h("strong", null, data.label),
      data.hint ? h("small", { className: "rf-lane-annotation" }, data.hint) : null
    ),
    h(Handle, { type: "source", position: Position.Bottom, className: "rf-handle" })
  );
}

const NODE_TYPES = {
  step: StepCard,
  explainer: ExplainerCard,
  lane: LaneBackground,
};

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
      data: { title: detail.title, sub: detail.sub, kind: layout.kind, icon: layout.icon, sequence: layout.sequence },
      ariaLabel: `${detail.title}. ${detail.sub || detail.body || ""}`,
      ariaRole: "button",
      focusable: true,
      draggable: false,
      zIndex: 1,
    });
  });

  const edges = FLOW_EDGES.map(([from, to, options = {}]) => ({
    id: `${from}-${to}`,
    source: from,
    target: to,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: "#5c6b64" },
    style: { stroke: "#5c6b64", strokeWidth: 1.8, strokeDasharray: options.dashed ? "5 4" : undefined },
    zIndex: 0,
  }));

  return { nodes, edges };
}

function KnowledgeFlow({ details, onNodeActivate }) {
  const { nodes, edges } = React.useMemo(() => buildElements(details), [details]);

  const handleNodeClick = React.useCallback(
    (event, node) => {
      if (node.type === "lane") return;
      onNodeActivate(event.target?.closest?.(".react-flow__node") || event.currentTarget, node.id);
    },
    [onNodeActivate]
  );

  /* React Flow's own click handling covers pointer activation. Enter/Space
     activation is handled here instead of relying on library internals:
     nodes are given a real tabIndex via `focusable: true` above, so a
     keydown bubbling up from a focused node is caught the same way a click
     is, and routed through the identical onNodeActivate path. */
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
        fitViewOptions: { padding: 0.045 },
        minZoom: 0.42,
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

window.mountKnowledgeReactFlow = function mountKnowledgeReactFlow(stageId) {
  const container = document.getElementById("knowledgeReactFlow");
  const cfg = window.DIAGRAM_STAGES && window.DIAGRAM_STAGES[stageId];
  if (!container || !cfg) return;

  container.classList.add("rf-shell--knowledge");
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
  root.render(h(KnowledgeFlow, { details, onNodeActivate }));
};

window.unmountKnowledgeReactFlow = function unmountKnowledgeReactFlow() {
  if (root) root.unmount();
  root = null;
  mountedStage = null;
};
