"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* A full screen for one stage's story, not a modal over the landing page.
   It owns the viewport, carries its own header, and steps between stages. */
import { StoryCanvas } from "./flows/flow-kit.js";
export default function StoryScreen({ story, id, label, title, kind, onClose, onPrev, onNext, prevTitle, nextTitle, }) {
    const isFirstStage = id === "01";
    const isSecondStage = id === "02";
    const isThirdStage = id === "03";
    const isFourthStage = id === "04";
    const isFifthStage = id === "05";
    const stageEyebrow = isFirstStage
        ? "Step 1 of 6 · Clinical decision"
        : isSecondStage
            ? "Step 2 of 6 · Understand the medicine"
            : isThirdStage
                ? "Step 3 of 6 · Combine repeated recommendations"
                : isFourthStage
                    ? "Step 4 of 6 · Search covered options"
                    : isFifthStage
                        ? "Step 5 of 6 · Verify the active ingredient"
                        : `${id} · ${label} · ${kind}`;
    return (_jsxs("div", { className: "storyScreen", role: "region", "aria-label": `${title}: stage story`, children: [_jsxs("header", { className: "storyScreenHead", children: [_jsx("button", { className: "storyBack", onClick: onClose, children: "\u2190 All stages" }), _jsxs("div", { className: "storyScreenTitle", children: [_jsx("p", { className: "eyebrow", children: stageEyebrow }), _jsx("h2", { children: title })] }), _jsxs("div", { className: "storyScreenMeta", children: [_jsxs("span", { className: "storyProgress", children: ["Step ", Number(id), " of 6"] }), _jsxs("div", { className: "storyNav", children: [_jsx("button", { onClick: onPrev, title: prevTitle, children: "\u2190" }), _jsx("button", { onClick: onNext, title: nextTitle, children: "\u2192" })] })] })] }), _jsx(StoryCanvas, { story: story }), _jsxs("footer", { className: "storyScreenFoot", children: [_jsx("span", { children: isFirstStage || isSecondStage || isThirdStage || isFourthStage || isFifthStage ? "Follow the numbered story" : "Drag to pan · scroll to zoom" }), _jsxs("span", { children: [_jsx("kbd", { children: "\u2190" }), _jsx("kbd", { children: "\u2192" }), " other stages \u00B7 ", _jsx("kbd", { children: "Esc" }), " back"] })] })] }));
}
