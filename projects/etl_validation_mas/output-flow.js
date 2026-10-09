/* ============================================================
   Artifacts — from a valid generated test to measured execution
   ============================================================
   This is the Post-Critique path documented at the end of full-flow.js.
   It deliberately keeps business outcomes separate from technical ones:
   Validation Fail is a real data-quality result, Crash is an execution
   failure, and Not Run means execution never began.
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;

const NODE_LAYOUT = {
  OUT: { kind: "output-valid", icon: "script", x: 300, y: 18, w: 500, h: 82 },

  REPO: { kind: "publish", icon: "repository", sequence: "01", x: 62, y: 184, w: 290, h: 92 },
  ADF: { kind: "orchestrate", icon: "pipeline", sequence: "02", x: 405, y: 184, w: 290, h: 92 },
  RUN: { kind: "runtime", icon: "runtime", sequence: "03", x: 748, y: 184, w: 290, h: 92 },

  PASS: { kind: "run-pass", icon: "pass", x: 48, y: 416, w: 230, h: 96 },
  VFAIL: { kind: "validation-fail", icon: "finding", x: 306, y: 416, w: 230, h: 96 },
  CRASH: { kind: "run-crash", icon: "crash", x: 564, y: 416, w: 230, h: 96 },
  NOTRUN: { kind: "not-run", icon: "notrun", x: 822, y: 416, w: 230, h: 96 },

  RATE: { kind: "dashboard", icon: "dashboard", x: 250, y: 640, w: 600, h: 128, metrics: [
    { label: "Acceptance threshold", display: "> 80%", value: 80 },
    { label: "Achieved pass rate", display: "86%", value: 86 },
  ] },
  NOTE: { kind: "limitation", icon: "limit", x: 225, y: 842, w: 650, h: 78 },
};

const LANES = {
  "lane-run": {
    label: "Publish and run",
    hint: "The approved version reaches real data for the first time",
    kind: "output-run", x: 32, y: 132, w: 1036, h: 184,
  },
  "lane-outcomes": {
    label: "One test, one outcome",
    hint: "Data-quality results stay separate from execution problems",
    kind: "output-outcomes", x: 32, y: 362, w: 1036, h: 190,
  },
  "lane-measure": {
    label: "Measure",
    hint: "Every outcome is counted; none is silently discarded",
    kind: "output-measure", x: 190, y: 602, w: 720, h: 206,
  },
};

const ICONS = {
  script: ["M5 3h10l4 4v14H5z", "M15 3v5h5", "M8 12h8", "M8 16h6"],
  repository: ["M4 6c0-2 3-3 8-3s8 1 8 3-3 3-8 3-8-1-8-3z", "M4 6v6c0 2 3 3 8 3s8-1 8-3V6", "M4 12v6c0 2 3 3 8 3s8-1 8-3v-6"],
  pipeline: ["M4 5h5v5H4z", "M15 14h5v5h-5z", "M9 7.5h4a4 4 0 0 1 4 4V14", "m14 12 3 3 3-3"],
  runtime: ["M4 4h16v12H4z", "M8 20h8", "m10 8 3 2-3 2", "M14 12h3"],
  pass: ["M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z", "m9 12 2 2 4-5"],
  finding: ["M4 5h16v14H4z", "M8 9h8", "M8 13h5", "M17 13v3", "M17 18h.01"],
  crash: ["M12 3 21 19H3z", "M12 9v4", "M12 17h.01"],
  notrun: ["M6 4h12v16H6z", "M9 9l6 6", "M15 9l-6 6"],
  dashboard: ["M4 19V5", "M4 19h16", "M8 16v-4", "M12 16V8", "M16 16v-7", "M20 16V5"],
  limit: ["M12 3 21 19H3z", "M12 9v4", "M12 17h.01"],
};

function FlowIcon({ name }) {
  return h("span", { className: "rf-node-icon", "aria-hidden": "true" },
    h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
      ...(ICONS[name] || ICONS.script).map((d, index) => h("path", { d, key: `${name}-${index}` }))));
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

function MetricRows({ metrics }) {
  return h("div", { className: "rf-output-metrics" }, ...metrics.map((metric) =>
    h("div", { className: "rf-output-metric", key: metric.label },
      h("span", { className: "rf-output-metric-label" }, metric.label),
      h("span", { className: "rf-output-metric-track", "aria-hidden": "true" },
        h("span", { style: { width: `${metric.value}%` } })),
      h("strong", null, metric.display))));
}

function StepCard({ data }) {
  return h("div", { className: `rf-node rf-node--${data.kind}` },
    ...Handles(),
    data.sequence ? h("span", { className: "rf-node-sequence", "aria-hidden": "true" }, data.sequence) : null,
    h("div", { className: "rf-node-main" },
      h(FlowIcon, { name: data.icon }),
      h("div", { className: "rf-node-copy" },
        h("p", { className: "rf-node-title" }, data.title),
        data.sub ? h("p", { className: "rf-node-sub" }, data.sub) : null)),
    data.metrics ? h(MetricRows, { metrics: data.metrics }) : null);
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
      data: { title: detail.title, sub: detail.sub, kind: layout.kind, icon: layout.icon, sequence: layout.sequence, metrics: layout.metrics },
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
    edge("out-repo", "OUT", "REPO", { label: "approved version only" }),
    edge("repo-adf", "REPO", "ADF", { sourceHandle: "right-out", targetHandle: "left-in" }),
    edge("adf-run", "ADF", "RUN", { sourceHandle: "right-out", targetHandle: "left-in" }),
    edge("run-pass", "RUN", "PASS", { color: "#1e6b52" }),
    edge("run-vfail", "RUN", "VFAIL", { color: "#a9702c" }),
    edge("run-crash", "RUN", "CRASH", { color: "#9d4b41" }),
    edge("run-notrun", "RUN", "NOTRUN", { color: "#64726b", dashed: true }),
    edge("pass-rate", "PASS", "RATE", { color: "#1e6b52" }),
    edge("vfail-rate", "VFAIL", "RATE", { color: "#a9702c" }),
    edge("crash-rate", "CRASH", "RATE", { color: "#9d4b41" }),
    edge("notrun-rate", "NOTRUN", "RATE", { color: "#64726b", dashed: true }),
  ];
  return { nodes, edges };
}

function OutputFlow({ details, onNodeActivate }) {
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

window.mountOutputReactFlow = function mountOutputReactFlow(stageId) {
  const container = document.getElementById("knowledgeReactFlow");
  const cfg = window.DIAGRAM_STAGES && window.DIAGRAM_STAGES[stageId];
  if (!container || !cfg) return;
  container.classList.add("rf-shell--output");
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
  root.render(h(OutputFlow, { details, onNodeActivate }));
};

window.unmountOutputReactFlow = function unmountOutputReactFlow() {
  if (!root) return;
  root.unmount();
  root = null;
  mountedStage = null;
};
