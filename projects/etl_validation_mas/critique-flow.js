/* ============================================================
   Critique — diagnose, plan, patch, prove, and exit safely
   ============================================================
   Sources of truth:
   - High_Level_Design_Architecture.md, Step 5
   - project_contribution.md, Layer 4 + Evaluation Rubrics

   This is the only correction loop in the architecture. Reviewers are
   read-only, repair roles are separated, and deterministic controls decide
   whether a version is accepted, reviewed again, regenerated, or returned
   as the best bounded result.
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;

const NODE_LAYOUT = {
  REQ: { kind: "source", icon: "draft", x: 340, y: 0, w: 420, h: 72 },

  AUTO: { kind: "check", icon: "automatic", sequence: "01", x: 68, y: 150, w: 296, h: 106 },
  MODEL: { kind: "reason", icon: "review", sequence: "02", x: 402, y: 150, w: 296, h: 106 },
  MERGE: { kind: "artifact", icon: "merge", sequence: "03", x: 736, y: 150, w: 296, h: 106 },

  ISSUES: { kind: "gate", icon: "decision", x: 340, y: 360, w: 420, h: 76 },

  FIXPLAN: { kind: "reason", icon: "plan", sequence: "01", x: 72, y: 520, w: 410, h: 82 },
  PATCHGEN: { kind: "reason-secondary", icon: "patch", sequence: "02", x: 72, y: 632, w: 410, h: 82 },
  REGRESSION: { kind: "check", icon: "guard", sequence: "03", x: 72, y: 744, w: 410, h: 88 },

  NUANCE: { kind: "reason", icon: "nuance", sequence: "01", x: 618, y: 520, w: 410, h: 82 },
  QSCORE: { kind: "score", icon: "score", sequence: "02", x: 618, y: 632, w: 410, h: 82 },
  READY: { kind: "gate", icon: "decision", sequence: "03", x: 618, y: 744, w: 410, h: 88 },

  REVIEWED: { kind: "output", icon: "approved", x: 40, y: 932, w: 300, h: 82 },
  CONTROL: { kind: "control", icon: "control", x: 400, y: 932, w: 300, h: 82 },
  BEST: { kind: "bounded", icon: "best", x: 760, y: 932, w: 300, h: 82 },
  REGEN: { kind: "reason-secondary", icon: "regenerate", x: 400, y: 1068, w: 300, h: 78 },
};

const LANES = {
  "lane-diagnose": {
    label: "01 · Diagnose without changing code",
    hint: "Cheap checks first; model review only after structural checks pass",
    kind: "critique-diagnose", x: 32, y: 106, w: 1036, h: 190,
  },
  "lane-repair": {
    label: "02A · Issues found — repair surgically",
    hint: "Diagnose → re-plan → patch → guard → re-review",
    kind: "critique-repair", x: 32, y: 476, w: 490, h: 398,
  },
  "lane-prove": {
    label: "02B · No issues — prove it is safe to accept",
    hint: "Requirement memory and scoring stay independent of reviewer opinion",
    kind: "critique-prove", x: 578, y: 476, w: 490, h: 398,
  },
};

const ICONS = {
  draft: ["M6 3h9l4 4v14H6z", "M15 3v5h5", "M9 13h6", "M9 17h6"],
  automatic: ["M5 5h14v14H5z", "m8 12 2 2 5-5", "M8 8h.01", "M16 16h.01"],
  review: ["M4 5h11v14H4z", "M8 9h3", "M8 13h3", "m14 2 5 5-8 8-4 1 1-4z"],
  merge: ["M5 5v4c0 3 7 3 7 7v3", "M19 5v4c0 3-7 3-7 7", "m9 17 3 3 3-3"],
  decision: ["M12 3l8 9-8 9-8-9z", "M12 8v5", "M12 17h.01"],
  plan: ["M5 4h14v16H5z", "M8 8h8", "M8 12h6", "M8 16h4"],
  patch: ["M14 5l5 5-9 9H5v-5z", "M12 7l5 5"],
  guard: ["M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z", "m9 12 2 2 4-5"],
  nuance: ["M12 3v4", "M12 17v4", "M3 12h4", "M17 12h4", "M8.5 8.5a5 5 0 1 0 7 7"],
  score: ["M4 19V9", "M10 19V5", "M16 19v-7", "M22 19V3"],
  approved: ["M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z", "m9 12 2 2 4-5"],
  control: ["M4 7h10", "M18 7h2", "M4 12h2", "M10 12h10", "M4 17h7", "M15 17h5", "M14 4v6", "M6 9v6", "M11 14v6"],
  best: ["M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2-4.5-4.4 6.2-.9z"],
  regenerate: ["M20 7v5h-5", "M4 17v-5h5", "M18 12a6 6 0 0 0-10-4L4 12", "M6 12a6 6 0 0 0 10 4l4-4"],
};

function FlowIcon({ name }) {
  return h("span", { className: "rf-node-icon", "aria-hidden": "true" },
    h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
      ...(ICONS[name] || ICONS.review).map((d, index) => h("path", { d, key: `${name}-${index}` }))));
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
    id, source, target, sourceHandle: options.sourceHandle || "bottom", targetHandle: options.targetHandle || "top", type: options.type || "smoothstep",
    label: options.label,
    labelStyle: { fill: options.color || "#53605a", fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: "#f7f4ec", fillOpacity: 0.97 }, labelBgPadding: [7, 4], labelBgBorderRadius: 8,
    markerEnd: { ...marker, color: options.color || marker.color },
    style: { stroke: options.color || "#5c6b64", strokeWidth: 1.7, strokeDasharray: options.dashed ? "5 4" : undefined }, zIndex: 0,
  });

  const edges = [
    edge("draft-auto", "REQ", "AUTO"),
    edge("auto-model", "AUTO", "MODEL", { sourceHandle: "right-out", targetHandle: "left-in", label: "automatic checks pass", color: "#1e6b52" }),
    edge("auto-merge", "AUTO", "MERGE", { sourceHandle: "bottom", targetHandle: "left-in", label: "issue found · skip model cost", color: "#9d4b41", dashed: true }),
    edge("model-merge", "MODEL", "MERGE", { sourceHandle: "right-out", targetHandle: "left-in" }),
    edge("merge-issues", "MERGE", "ISSUES"),

    edge("issues-repair", "ISSUES", "FIXPLAN", { label: "issues found", color: "#9d4b41" }),
    edge("fix-patch", "FIXPLAN", "PATCHGEN"),
    edge("patch-guard", "PATCHGEN", "REGRESSION"),
    edge("guard-review", "REGRESSION", "AUTO", { sourceHandle: "left-out", targetHandle: "left-in", label: "safe patch · review from the start", color: "#9d4b41", dashed: true, type: "step" }),

    edge("issues-prove", "ISSUES", "NUANCE", { label: "no issues", color: "#1e6b52" }),
    edge("nuance-score", "NUANCE", "QSCORE"),
    edge("score-ready", "QSCORE", "READY"),
    edge("ready-reviewed", "READY", "REVIEWED", { label: "score ≥ 0.95 · no blockers", color: "#1e6b52" }),
    edge("ready-best", "READY", "BEST", { label: "5 iterations exhausted", color: "#9d4b41", dashed: true }),
    edge("ready-control", "READY", "CONTROL", { label: "below bar · budget remains", color: "#8a5a20" }),
    edge("control-review", "CONTROL", "AUTO", { sourceHandle: "left-out", targetHandle: "right-in", label: "score still moving", color: "#8a5a20", dashed: true, type: "step" }),
    edge("control-regen", "CONTROL", "REGEN", { label: "score stalled twice", color: "#9d4b41" }),
    edge("regen-review", "REGEN", "AUTO", { sourceHandle: "right-out", targetHandle: "right-in", label: "regenerated function · re-review", color: "#9d4b41", dashed: true, type: "step" }),
  ];
  return { nodes, edges };
}

function CritiqueFlow({ details, onNodeActivate }) {
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
      nodes, edges, nodeTypes: NODE_TYPES, fitView: true, fitViewOptions: { padding: 0.04 }, minZoom: 0.34, maxZoom: 1.8,
      nodesDraggable: false, nodesConnectable: false, elementsSelectable: false, nodesFocusable: true, panOnScroll: false, zoomOnScroll: false,
      zoomOnPinch: true, zoomOnDoubleClick: false, panOnDrag: true, onNodeClick: handleNodeClick,
      onInit: (instance) => { window.__diagramReactFlowInstance = instance; },
    }, h(Background, { gap: 22, size: 1, color: "rgba(16, 22, 20, 0.08)" }),
    h(Controls, { showInteractive: false, position: "bottom-right" })));
}

let root = null;
let mountedStage = null;

window.mountCritiqueReactFlow = function mountCritiqueReactFlow(stageId) {
  const container = document.getElementById("knowledgeReactFlow");
  const cfg = window.DIAGRAM_STAGES && window.DIAGRAM_STAGES[stageId];
  if (!container || !cfg) return;
  container.classList.add("rf-shell--critique");
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
  root.render(h(CritiqueFlow, { details, onNodeActivate }));
};

window.unmountCritiqueReactFlow = function unmountCritiqueReactFlow() {
  if (!root) return;
  root.unmount();
  root = null;
  mountedStage = null;
};
