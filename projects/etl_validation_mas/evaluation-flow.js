/* ============================================================
   Evaluate — an independent, post-hoc trust audit
   ============================================================
   High_Level_Design_Architecture.md Step 7 defines this stage. The weighted
   40/25/25/10 evaluator documented in project_contribution.md belongs inside
   Critique and is shown only to prevent the two mechanisms being confused.

   Evaluate runs after Critique, reads artifacts without executing code, does
   not repair anything, and returns Pass / Needs Review / Fail for a human.
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;

const NODE_LAYOUT = {
  INLOOP: { kind: "check", icon: "loop", x: 70, y: 48, w: 440, h: 86 },
  FINAL: { kind: "reason", icon: "audit", x: 590, y: 48, w: 440, h: 86 },

  REVIEWED: { kind: "source", icon: "bundle", x: 300, y: 214, w: 500, h: 78 },

  Q1: { kind: "evaluation-plan", icon: "compare", sequence: "01", x: 70, y: 380, w: 296, h: 96 },
  Q2: { kind: "evaluation-intent", icon: "intent", sequence: "02", x: 402, y: 380, w: 296, h: 96 },
  Q3: { kind: "evaluation-contract", icon: "contract", sequence: "03", x: 734, y: 380, w: 296, h: 96 },

  REPORT: { kind: "artifact", icon: "report", x: 300, y: 548, w: 500, h: 82 },

  PASS: { kind: "output", icon: "pass", x: 50, y: 710, w: 300, h: 82 },
  REVIEW: { kind: "control", icon: "review", x: 400, y: 710, w: 300, h: 82 },
  FAIL: { kind: "blocked", icon: "fail", x: 750, y: 710, w: 300, h: 82 },

  NOTE: { kind: "limitation", icon: "limit", x: 210, y: 852, w: 680, h: 82 },
};

const LANES = {
  "lane-distinction": {
    label: "First, separate two mechanisms that share the word evaluation",
    hint: "They serve different people and run at different times",
    kind: "evaluation-distinction", x: 32, y: 0, w: 1036, h: 168,
  },
  "lane-audit": {
    label: "Independent static audit · read the artifacts, do not run the script",
    hint: "Three plain questions produce one evidence-backed verdict",
    kind: "evaluation-audit", x: 32, y: 336, w: 1036, h: 180,
  },
};

const ICONS = {
  loop: ["M20 7v5h-5", "M4 17v-5h5", "M18 12a6 6 0 0 0-10-4L4 12", "M6 12a6 6 0 0 0 10 4l4-4"],
  audit: ["M10 4H5v16h14V9", "m13 3 5 5", "m12 10 6-6", "M8 12h5", "M8 16h7"],
  bundle: ["M4 5h7v14H4z", "M13 5h7v14h-7z", "M6.5 9h2", "M15.5 9h2", "M6.5 13h2", "M15.5 13h2"],
  compare: ["M4 6h6v12H4z", "M14 6h6v12h-6z", "M10 10h4", "M10 14h4"],
  intent: ["M12 3v4", "M12 17v4", "M3 12h4", "M17 12h4", "M8.5 8.5a5 5 0 1 0 7 7"],
  contract: ["M5 4h14v16H5z", "M8 9l2 2 5-5", "M8 15h8"],
  report: ["M5 4h14v16H5z", "M8 8h8", "M8 12h8", "M8 16h5"],
  pass: ["M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z", "m9 12 2 2 4-5"],
  review: ["M4 5h11v14H4z", "M8 9h3", "M8 13h3", "m14 2 5 5-8 8-4 1 1-4z"],
  fail: ["M5 5l14 14", "M19 5 5 19", "M4 4h16v16H4z"],
  limit: ["M12 3 21 19H3z", "M12 9v4", "M12 17h.01"],
};

function FlowIcon({ name }) {
  return h("span", { className: "rf-node-icon", "aria-hidden": "true" },
    h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
      ...(ICONS[name] || ICONS.audit).map((d, index) => h("path", { d, key: `${name}-${index}` }))));
}

function Handles() {
  return [
    h(Handle, { key: "top", id: "top", type: "target", position: Position.Top, className: "rf-handle" }),
    h(Handle, { key: "left-in", id: "left-in", type: "target", position: Position.Left, className: "rf-handle" }),
    h(Handle, { key: "right-in", id: "right-in", type: "target", position: Position.Right, className: "rf-handle" }),
    h(Handle, { key: "bottom", id: "bottom", type: "source", position: Position.Bottom, className: "rf-handle" }),
    h(Handle, { key: "left-out", id: "left-out", type: "source", position: Position.Left, className: "rf-handle" }),
    h(Handle, { key: "right-out", id: "right-out", type: "source", position: Position.Right, className: "rf-handle" }),
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
      id, type: "step", position: { x: layout.x, y: layout.y }, style: { width: layout.w, height: layout.h },
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
    labelBgStyle: { fill: "#f7f4ec", fillOpacity: 0.97 }, labelBgPadding: [7, 4], labelBgBorderRadius: 8,
    markerEnd: { ...marker, color: options.color || marker.color },
    style: { stroke: options.color || "#5c6b64", strokeWidth: 1.7, strokeDasharray: options.dashed ? "5 4" : undefined }, zIndex: 0,
  });

  const edges = [
    edge("final-input", "FINAL", "REVIEWED"),
    edge("input-q1", "REVIEWED", "Q1"),
    edge("input-q2", "REVIEWED", "Q2"),
    edge("input-q3", "REVIEWED", "Q3"),
    edge("q1-report", "Q1", "REPORT"),
    edge("q2-report", "Q2", "REPORT"),
    edge("q3-report", "Q3", "REPORT"),
    edge("report-pass", "REPORT", "PASS", { label: "aligned", color: "#1e6b52" }),
    edge("report-review", "REPORT", "REVIEW", { label: "specific ambiguity or gap", color: "#8a5a20" }),
    edge("report-fail", "REPORT", "FAIL", { label: "material mismatch", color: "#9d4b41", dashed: true }),
  ];
  return { nodes, edges };
}

function EvaluationFlow({ details, onNodeActivate }) {
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
      nodes, edges, nodeTypes: NODE_TYPES, fitView: true, fitViewOptions: { padding: 0.045 }, minZoom: 0.4, maxZoom: 1.8,
      nodesDraggable: false, nodesConnectable: false, elementsSelectable: false, nodesFocusable: true, panOnScroll: false, zoomOnScroll: false,
      zoomOnPinch: true, zoomOnDoubleClick: false, panOnDrag: true, onNodeClick: handleNodeClick,
      onInit: (instance) => { window.__diagramReactFlowInstance = instance; },
    }, h(Background, { gap: 22, size: 1, color: "rgba(16, 22, 20, 0.08)" }),
    h(Controls, { showInteractive: false, position: "bottom-right" })));
}

let root = null;
let mountedStage = null;

window.mountEvaluationReactFlow = function mountEvaluationReactFlow(stageId) {
  const container = document.getElementById("knowledgeReactFlow");
  const cfg = window.DIAGRAM_STAGES && window.DIAGRAM_STAGES[stageId];
  if (!container || !cfg) return;
  container.classList.add("rf-shell--evaluation");
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
  root.render(h(EvaluationFlow, { details, onNodeActivate }));
};

window.unmountEvaluationReactFlow = function unmountEvaluationReactFlow() {
  if (!root) return;
  root.unmount();
  root = null;
  mountedStage = null;
};
