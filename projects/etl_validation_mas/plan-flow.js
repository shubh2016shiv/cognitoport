/* ============================================================
   Plan diagram — a compact, readable decision flow
   ============================================================
   React Flow is intentionally used as an "island" in the existing vanilla
   application. The diagram follows the Plan section of the HLD: resolve the
   data, define the validation rule, then stop at a feasibility gate before
   Execute is allowed to generate code.
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const CARD_W = 286;
const CARD_H = 82;
const LANE_X = 36;
const LANE_W = 1028;
const LANE_H = 150;
const CARD_X = [70, 407, 744];

const NODE_LAYOUT = {
  REQ: { kind: "source", type: "step", icon: "request", x: 322, y: 0, w: 456, h: 68 },
  T1_ASK: { kind: "reason", type: "step", icon: "tables", sequence: "01", x: CARD_X[0], y: 126, w: CARD_W, h: CARD_H },
  T1_PLAN: { kind: "artifact", type: "step", icon: "join", sequence: "02", x: CARD_X[1], y: 126, w: CARD_W, h: CARD_H },
  T1_CHECK: { kind: "check", type: "step", icon: "check", sequence: "03", x: CARD_X[2], y: 126, w: CARD_W, h: CARD_H },
  TP: { kind: "handoff", type: "step", icon: "handoff", x: 322, y: 278, w: 456, h: 64 },
  T2_ASK: { kind: "reason", type: "step", icon: "rule", sequence: "01", x: CARD_X[0], y: 400, w: CARD_W, h: CARD_H },
  T2_PLAN: { kind: "artifact", type: "step", icon: "logic", sequence: "02", x: CARD_X[1], y: 400, w: CARD_W, h: CARD_H },
  T2_CHECK: { kind: "check", type: "step", icon: "check", sequence: "03", x: CARD_X[2], y: 400, w: CARD_W, h: CARD_H },
  GATE: { kind: "gate", type: "step", icon: "gate", x: 322, y: 552, w: 456, h: 72 },
  OUT: { kind: "output", type: "step", icon: "approved", x: 126, y: 690, w: 388, h: 72 },
  GAP: { kind: "blocked", type: "step", icon: "gap", x: 586, y: 690, w: 388, h: 72 },
};

const LANES = {
  "lane-tables": { label: "01 · Resolve the data", hint: "Which tables, columns and join connect this test?", kind: "plan-tables", x: LANE_X, y: 92, w: LANE_W, h: LANE_H },
  "lane-logic": { label: "02 · Define the validation rule", hint: "What exactly passes, fails and stays in scope?", kind: "plan-logic", x: LANE_X, y: 366, w: LANE_W, h: LANE_H },
};

const ICONS = {
  request: ["M5 4h14v16H5z", "M8 8h8", "M8 12h6", "M8 16h4"],
  tables: ["M4 5h16v14H4z", "M4 10h16", "M10 5v14"],
  join: ["M8 7H6a4 4 0 0 0 0 8h2", "M16 7h2a4 4 0 0 1 0 8h-2", "M9 12h6"],
  check: ["M5 12l4 4L19 6", "M5 5h14v14H5z"],
  handoff: ["M4 12h14", "m14-5 5 5-5 5"],
  rule: ["M7 5h12", "M7 12h12", "M7 19h12", "M4 5h.01", "M4 12h.01", "M4 19h.01"],
  logic: ["M5 6h6v5H5z", "M13 13h6v5h-6z", "M11 8h4v5"],
  gate: ["M12 3l8 9-8 9-8-9z", "M9 12l2 2 4-5"],
  approved: ["M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z", "m9 12 2 2 4-5"],
  gap: ["M12 3 21 19H3z", "M12 9v4", "M12 17h.01"],
};

function FlowIcon({ name }) {
  return h("span", { className: "rf-node-icon", "aria-hidden": "true" },
    h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
      ...(ICONS[name] || ICONS.rule).map((d, index) => h("path", { d, key: `${name}-${index}` }))));
}

function Handles() {
  return [
    h(Handle, { key: "top", id: "top", type: "target", position: Position.Top, className: "rf-handle" }),
    h(Handle, { key: "left", id: "left", type: "target", position: Position.Left, className: "rf-handle" }),
    h(Handle, { key: "bottom", id: "bottom", type: "source", position: Position.Bottom, className: "rf-handle" }),
    h(Handle, { key: "right", id: "right", type: "source", position: Position.Right, className: "rf-handle" }),
  ];
}

function StepCard({ data }) {
  return h("div", { className: `rf-node rf-node--${data.kind}` },
    ...Handles(),
    data.sequence ? h("span", { className: "rf-node-sequence", "aria-hidden": "true" }, data.sequence) : null,
    h("div", { className: "rf-node-main" },
      h(FlowIcon, { name: data.icon }),
      h("div", { className: "rf-node-copy" },
        h("p", { className: "rf-node-title" }, data.title),
        data.sub ? h("p", { className: "rf-node-sub" }, data.sub) : null)));
}

function LaneBackground({ data }) {
  return h("div", { className: `rf-lane rf-lane--${data.kind}` },
    ...Handles(),
    h("span", { className: "rf-lane-label rf-lane-label--split" },
      h("strong", null, data.label),
      h("small", { className: "rf-lane-annotation" }, data.hint)));
}

const NODE_TYPES = { step: StepCard, lane: LaneBackground };

function buildElements(details) {
  const nodes = Object.entries(LANES).map(([id, lane]) => ({
    id, type: "lane", position: { x: lane.x, y: lane.y }, style: { width: lane.w, height: lane.h },
    data: { label: lane.label, hint: lane.hint, kind: lane.kind }, draggable: false, selectable: false, focusable: false, zIndex: 0,
  }));

  Object.entries(NODE_LAYOUT).forEach(([id, layout]) => {
    const detail = details[id] || { title: id };
    nodes.push({
      id, type: layout.type, position: { x: layout.x, y: layout.y }, style: { width: layout.w, height: layout.h },
      data: { title: detail.title, sub: detail.sub, kind: layout.kind, icon: layout.icon, sequence: layout.sequence },
      ariaLabel: `${detail.title}. ${detail.sub || detail.body || ""}`, ariaRole: "button", focusable: true,
      draggable: false, zIndex: 1,
    });
  });

  const marker = { type: MarkerType.ArrowClosed, width: 17, height: 17, color: "#5c6b64" };
  const edge = (id, source, target, options = {}) => ({
    id, source, target, sourceHandle: options.sourceHandle || "bottom", targetHandle: options.targetHandle || "top", type: "smoothstep",
    label: options.label,
    labelStyle: { fill: options.color || "#53605a", fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: "#f7f4ec", fillOpacity: 0.96 }, labelBgPadding: [7, 4], labelBgBorderRadius: 8,
    markerEnd: { ...marker, color: options.color || marker.color },
    style: { stroke: options.color || "#5c6b64", strokeWidth: 1.7, strokeDasharray: options.dashed ? "5 4" : undefined }, zIndex: 0,
  });

  const edges = [
    edge("req-lane1", "REQ", "lane-tables"),
    edge("t1-ask-plan", "T1_ASK", "T1_PLAN", { sourceHandle: "right", targetHandle: "left" }),
    edge("t1-plan-check", "T1_PLAN", "T1_CHECK", { sourceHandle: "right", targetHandle: "left" }),
    edge("lane1-tp", "lane-tables", "TP"),
    edge("tp-lane2", "TP", "lane-logic"),
    edge("t2-ask-plan", "T2_ASK", "T2_PLAN", { sourceHandle: "right", targetHandle: "left" }),
    edge("t2-plan-check", "T2_PLAN", "T2_CHECK", { sourceHandle: "right", targetHandle: "left" }),
    edge("lane2-gate", "lane-logic", "GATE"),
    edge("gate-out", "GATE", "OUT", { label: "ready / assistable", color: "#1e6b52" }),
    edge("gate-gap", "GATE", "GAP", { label: "blocked", color: "#9d4b41", dashed: true }),
  ];
  return { nodes, edges };
}

function PlanFlow({ details, onNodeActivate }) {
  const { nodes, edges } = React.useMemo(() => buildElements(details), [details]);
  const handleNodeClick = React.useCallback((event, node) => {
    if (node.type !== "lane") onNodeActivate(event.target?.closest?.(".react-flow__node") || event.currentTarget, node.id);
  }, [onNodeActivate]);
  const handleKeyDown = React.useCallback((event) => {
    if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
    const nodeEl = event.target.closest?.(".react-flow__node");
    const nodeId = nodeEl?.dataset.id;
    if (!nodeId || LANES[nodeId]) return;
    event.preventDefault();
    onNodeActivate(nodeEl, nodeId);
  }, [onNodeActivate]);

  return h("div", { className: "rf-focus-scope", onKeyDown: handleKeyDown },
    h(ReactFlow, {
      nodes, edges, nodeTypes: NODE_TYPES, fitView: true, fitViewOptions: { padding: 0.045 }, minZoom: 0.45, maxZoom: 1.7,
      nodesDraggable: false, nodesConnectable: false, elementsSelectable: false, nodesFocusable: true, panOnScroll: false, zoomOnScroll: false,
      zoomOnPinch: true, zoomOnDoubleClick: false, panOnDrag: true, onNodeClick: handleNodeClick,
      onInit: (instance) => { window.__diagramReactFlowInstance = instance; },
    }, h(Background, { gap: 22, size: 1, color: "rgba(16, 22, 20, 0.08)" }),
    h(Controls, { showInteractive: false, position: "bottom-right" })));
}

let root = null;
let mountedStage = null;

window.mountPlanReactFlow = function mountPlanReactFlow(stageId) {
  const container = document.getElementById("knowledgeReactFlow");
  const cfg = window.DIAGRAM_STAGES && window.DIAGRAM_STAGES[stageId];
  if (!container || !cfg) return;
  container.classList.add("rf-shell--plan");
  const details = cfg.details;
  const onNodeActivate = (domEl, nodeId) => {
    const detail = details[nodeId];
    if (detail && domEl) window.showKnowledgeBubble(domEl, detail);
  };
  if (!root || mountedStage !== stageId) {
    if (root) root.unmount();
    root = createRoot(container);
    mountedStage = stageId;
  }
  root.render(h(PlanFlow, { details, onNodeActivate }));
};

window.unmountPlanReactFlow = function unmountPlanReactFlow() {
  if (!root) return;
  root.unmount();
  root = null;
  mountedStage = null;
};
