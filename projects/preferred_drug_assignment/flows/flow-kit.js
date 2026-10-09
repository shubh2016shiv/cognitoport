"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/* ============================================================
   Shared kit for every stage story canvas
   ============================================================
   Each stage owns a file that exports only its nodes and edges.
   This file owns everything about how those are drawn: the card
   shapes, the lane backgrounds, the icon set, and the canvas.
   ============================================================ */
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";
export const CARD_W = 250;
export const CARD_H = 120;
export const CARD_GAP = 18;
export const SRC_W = 250;
export const SRC_H = 96;
export const EXP_W = 210;
export const EXP_H = 130;
/** rows are laid out on two bands so the canvas stays wide-ish, not a long strip */
export const ROW1_Y = 8;
export const ROW2_Y = 380;
export const LANE_H = 320;
export const ROW1_CARD_Y = ROW1_Y + 80;
export const ROW2_CARD_Y = ROW2_Y + 80;
export function rowX(start, i) {
    return start + i * (CARD_W + CARD_GAP);
}
export function laneW(cards) {
    return cards * CARD_W + (cards - 1) * CARD_GAP + 44;
}
const ICONS = {
    committee: ["M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6", "M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5", "M17 9a2.5 2.5 0 1 0 0-5", "M17 15c2.5 0 4 1.4 4 4"],
    sheet: ["M5 3h14v18H5z", "M5 9h14", "M5 15h14", "M12 9v12"],
    inbox: ["M4 13h4l2 3h4l2-3h4", "M4 13 6 5h12l2 8v6H4z"],
    column: ["M5 3h14v18H5z", "M10 3v18", "M13 7h4", "M13 11h4", "M13 15h3"],
    filter: ["M4 5h16l-6 7v6l-4 2v-8z"],
    lock: ["M6 11h12v9H6z", "M9 11V8a3 3 0 0 1 6 0v3"],
    package: ["m4 7 8-4 8 4-8 4z", "M4 7v10l8 4 8-4V7", "M12 11v10"],
    search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14", "m16 16 4.5 4.5"],
    branch: ["M7 4v7a4 4 0 0 0 4 4h6", "M7 20v-5", "m14 12 3 3-3 3"],
    arrow: ["M4 12h14", "m13 7 5 5-5 5"],
    prompt: ["M4 5h16v11H9l-5 4z", "M8 9h8", "M8 12.5h5"],
    ban: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "m6 6 12 12"],
    examples: ["M4 5h7v6H4z", "M13 5h7v6h-7z", "M4 14h7v5H4z", "M13 14h7v5h-7z"],
    brain: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6", "M12 3v6", "M12 15v6", "M3 12h6", "M15 12h6", "M6 6l3 3", "M15 15l3 3", "M18 6l-3 3", "M9 15l-3 3"],
    gauge: ["M12 20a8 8 0 1 1 8-8", "m12 12 4-3", "M4 20h16"],
    clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "M12 7v5l3 2"],
    shield: ["M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z", "m9 12 2 2 4-5"],
    json: ["M8 4c-2 0-3 1-3 3v2c0 1.5-.7 2.5-2 3 1.3.5 2 1.5 2 3v2c0 2 1 3 3 3", "M16 4c2 0 3 1 3 3v2c0 1.5.7 2.5 2 3-1.3.5-2 1.5-2 3v2c0 2-1 3-3 3"],
    warn: ["M12 3 2 20h20z", "M12 9v5", "M12 17h.01"],
};
function FlowIcon({ name }) {
    const paths = ICONS[name || "package"] || ICONS.package;
    return (_jsx("span", { className: "sfIcon", "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", children: paths.map((d, i) => _jsx("path", { d: d }, i)) }) }));
}
const handles = (_jsxs(_Fragment, { children: [_jsx(Handle, { type: "target", position: Position.Left, id: "left", className: "sfHandle" }), _jsx(Handle, { type: "target", position: Position.Top, id: "top", className: "sfHandle" }), _jsx(Handle, { type: "source", position: Position.Right, id: "right", className: "sfHandle" }), _jsx(Handle, { type: "source", position: Position.Bottom, id: "bottom", className: "sfHandle" })] }));
function Card({ data, variant }) {
    return (_jsxs("div", { className: `sfNode sfNode--${variant} k-${data.kind}`, children: [handles, data.seq && _jsx("span", { className: "sfSeq", "aria-hidden": "true", children: data.seq }), _jsxs("div", { className: "sfNodeMain", children: [data.icon && _jsx(FlowIcon, { name: data.icon }), _jsx("p", { className: "sfTitle", children: data.title })] }), data.sub && _jsx("p", { className: "sfSub", children: data.sub })] }));
}
function LaneCard({ data }) {
    return (_jsxs("div", { className: `sfLane k-${data.kind}`, children: [handles, _jsxs("span", { className: "sfLaneLabel", children: [_jsx("strong", { children: data.title }), _jsx("small", { children: data.hint })] })] }));
}
const NODE_TYPES = {
    src: (p) => _jsx(Card, { data: p.data, variant: "src" }),
    step: (p) => _jsx(Card, { data: p.data, variant: "step" }),
    explain: (p) => _jsx(Card, { data: p.data, variant: "explain" }),
    lane: LaneCard,
};
export function StoryCanvas({ story }) {
    const isGuided = story.variant === "guided";
    const nodes = story.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: n.x, y: n.y },
        style: { width: n.w, height: n.h },
        data: n,
        draggable: false,
        selectable: false,
        zIndex: n.type === "lane" ? 0 : 2,
    }));
    const edges = story.edges.map((e) => {
        // "equiv" edges say two records mean the same thing (no arrowhead).
        // "governs" edges point from a rule panel to the step it constrains:
        // a faint dotted annotation line, not part of the data flow.
        const equiv = e.rel === "equiv";
        const governs = e.rel === "governs";
        return {
            id: `${e.from}-${e.to}`,
            source: e.from,
            target: e.to,
            sourceHandle: e.sh || "right",
            targetHandle: e.th || "left",
            type: e.bend ? "smoothstep" : isGuided ? "straight" : "smoothstep",
            label: e.label,
            labelStyle: { fill: "#f4f1e9", fontSize: 11, fontWeight: 700 },
            labelBgStyle: { fill: "#101614", fillOpacity: 0.96 },
            labelBgPadding: [7, 4],
            labelBgBorderRadius: 7,
            markerEnd: equiv
                ? undefined
                : governs
                    ? { type: MarkerType.ArrowClosed, width: 11, height: 11, color: "#a7b0aa" }
                    : { type: MarkerType.ArrowClosed, width: 15, height: 15, color: "#50615a" },
            style: equiv
                ? { stroke: "#9aa39d", strokeWidth: 1.5, strokeDasharray: "5 4" }
                : governs
                    ? { stroke: "#a7b0aa", strokeWidth: 1.2, strokeDasharray: "2 4" }
                    : { stroke: "#50615a", strokeWidth: 1.7 },
            zIndex: 4,
        };
    });
    return (_jsx("div", { className: `sfCanvas ${isGuided ? "sfCanvas--guided" : ""}`, children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, nodeTypes: NODE_TYPES, fitView: true, fitViewOptions: { padding: isGuided ? 0.035 : 0.05 }, minZoom: 0.3, maxZoom: 1.15, nodesDraggable: false, nodesConnectable: false, elementsSelectable: false, panOnScroll: false, zoomOnScroll: !isGuided, zoomOnDoubleClick: false, proOptions: { hideAttribution: false }, children: [_jsx(Background, { gap: 22, size: 1, color: "rgba(16,22,20,.10)" }), _jsx(Controls, { showInteractive: false })] }) }));
}
