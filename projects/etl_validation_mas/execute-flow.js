/* ============================================================
   Execute — one single-shot function inside a deterministic scaffold
   ============================================================
   Source of truth:
   - standardized_documents/High_Level_Design_Architecture.md, Step 4
   - standardized_documents/project_contribution.md, Layers 2–3 + Bridge

   The scaffold exists first. Execute fills its one gap exactly once. A cheap
   structural gate either flags the case or permits deterministic injection;
   a separate contract smoke test runs before the expensive Critique loop.
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;

const NODE_LAYOUT = {
  REQ: { kind: "source", icon: "plans", x: 322, y: 0, w: 456, h: 72 },
  SCAF: { kind: "assemble", icon: "template", x: 100, y: 122, w: 400, h: 78 },
  PKG: { kind: "container", icon: "context", x: 600, y: 122, w: 400, h: 78 },

  ASK: { kind: "reason", icon: "model", sequence: "01", x: 70, y: 300, w: 286, h: 86 },
  LOGIC: { kind: "artifact", icon: "code", sequence: "02", x: 407, y: 300, w: 286, h: 86 },
  CHECK: { kind: "check", icon: "gate", sequence: "03", x: 744, y: 300, w: 286, h: 86 },

  ASSEMBLE: { kind: "assemble", icon: "inject", x: 170, y: 500, w: 350, h: 78 },
  FLAG: { kind: "blocked", icon: "flag", x: 612, y: 500, w: 350, h: 78 },

  CONTRACT: { kind: "gate", icon: "contract", x: 170, y: 650, w: 350, h: 78 },
  PATCH: { kind: "reason-secondary", icon: "patch", x: 612, y: 650, w: 350, h: 78 },

  DRAFT: { kind: "output", icon: "draft", x: 322, y: 802, w: 456, h: 76 },
};

const LANES = {
  "lane-execute": {
    label: "Execute · Single-shot generation",
    hint: "The model fills one function body and never regenerates here",
    kind: "execute-generate", x: 36, y: 262, w: 1028, h: 166,
  },
};

const ICONS = {
  plans: ["M4 5h7v14H4z", "M13 5h7v14h-7z", "M6.5 9h2", "M15.5 9h2", "M6.5 13h2", "M15.5 13h2"],
  template: ["M4 4h16v16H4z", "M4 9h16", "M9 9v11", "M12 13h5", "M12 17h3"],
  context: ["M4 5h16v14H4z", "M8 9h8", "M8 13h8", "M8 17h5"],
  model: ["M8 4h8", "M12 4V2", "M5 8h14v11H5z", "M8 12h.01", "M16 12h.01", "M9 16h6"],
  code: ["m8.5 7-4 5 4 5", "m15.5 7 4 5-4 5", "m13.5 4-3 16"],
  gate: ["M12 3l8 9-8 9-8-9z", "M9 12l2 2 4-5"],
  inject: ["M4 5h7v14H4z", "M13 5h7v14h-7z", "m8 12 8 0", "m13 9 3 3-3 3"],
  flag: ["M5 21V4", "M5 5h11l-2 4 2 4H5"],
  contract: ["M5 4h14v16H5z", "M8 9l2 2 5-5", "M8 15h8"],
  patch: ["M14 5l5 5-9 9H5v-5z", "M12 7l5 5"],
  draft: ["M6 3h9l4 4v14H6z", "M15 3v5h5", "M9 13h6", "M9 17h6"],
};

function FlowIcon({ name }) {
  return h("span", { className: "rf-node-icon", "aria-hidden": "true" },
    h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
      ...(ICONS[name] || ICONS.code).map((d, index) => h("path", { d, key: `${name}-${index}` }))));
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
    labelBgStyle: { fill: "#f7f4ec", fillOpacity: 0.96 }, labelBgPadding: [7, 4], labelBgBorderRadius: 8,
    markerEnd: { ...marker, color: options.color || marker.color },
    style: { stroke: options.color || "#5c6b64", strokeWidth: 1.7, strokeDasharray: options.dashed ? "5 4" : undefined }, zIndex: 0,
  });

  const edges = [
    edge("plans-scaffold", "REQ", "SCAF"),
    edge("plans-package", "REQ", "PKG"),
    edge("scaffold-execute", "SCAF", "ASK"),
    edge("package-execute", "PKG", "ASK"),
    edge("ask-logic", "ASK", "LOGIC", { sourceHandle: "right", targetHandle: "left" }),
    edge("logic-gate", "LOGIC", "CHECK", { sourceHandle: "right", targetHandle: "left" }),
    edge("gate-assemble", "CHECK", "ASSEMBLE", { label: "valid", color: "#1e6b52" }),
    edge("gate-flag", "CHECK", "FLAG", { label: "invalid", color: "#9d4b41", dashed: true }),
    edge("assemble-contract", "ASSEMBLE", "CONTRACT"),
    edge("contract-draft", "CONTRACT", "DRAFT", { label: "contract valid", color: "#1e6b52" }),
    edge("contract-patch", "CONTRACT", "PATCH", { sourceHandle: "right", targetHandle: "left", label: "shape violation", color: "#9d4b41", dashed: true }),
    edge("patch-draft", "PATCH", "DRAFT", { label: "one targeted fix", color: "#8a5a20" }),
  ];
  return { nodes, edges };
}

function ExecuteFlow({ details, onNodeActivate }) {
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
      nodes, edges, nodeTypes: NODE_TYPES, fitView: true, fitViewOptions: { padding: 0.045 }, minZoom: 0.42, maxZoom: 1.8,
      nodesDraggable: false, nodesConnectable: false, elementsSelectable: false, nodesFocusable: true, panOnScroll: false, zoomOnScroll: false,
      zoomOnPinch: true, zoomOnDoubleClick: false, panOnDrag: true, onNodeClick: handleNodeClick,
      onInit: (instance) => { window.__diagramReactFlowInstance = instance; },
    }, h(Background, { gap: 22, size: 1, color: "rgba(16, 22, 20, 0.08)" }),
    h(Controls, { showInteractive: false, position: "bottom-right" })));
}

let root = null;
let mountedStage = null;

window.mountExecuteReactFlow = function mountExecuteReactFlow(stageId) {
  const container = document.getElementById("knowledgeReactFlow");
  const cfg = window.DIAGRAM_STAGES && window.DIAGRAM_STAGES[stageId];
  if (!container || !cfg) return;
  container.classList.add("rf-shell--execute");
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
  root.render(h(ExecuteFlow, { details, onNodeActivate }));
};

window.unmountExecuteReactFlow = function unmountExecuteReactFlow() {
  if (!root) return;
  root.unmount();
  root = null;
  mountedStage = null;
};
