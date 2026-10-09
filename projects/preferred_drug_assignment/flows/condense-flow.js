/*
  Stage 03, one straight vertical spine, every main arrow dead centre:

    input arrives
      -> rules for grouping (fixed first, govern everything below)
      -> combine the repeated strengths of each medicine
      -> the rule in action on two real examples, column by column
      -> 1,348 recommendations become 720 distinct medicines

  "Medicare still waits" is a borderless margin disclaimer.
  The "stays separate" cases are exception notes attached to the medicines,
  not a third column in the grid.
*/
export const condenseStory = {
    variant: "guided",
    nodes: [
        { id: "IN", type: "src", x: 360, y: 24, w: 480, h: 78, kind: "source", icon: "package",
            title: "1,348 interpreted recommendations", sub: "Every clinician's line now has a primary medicine name and a precise clinical class." },
        { id: "NOTE_WAIT", type: "explain", x: 892, y: 26, w: 232, h: 78, kind: "note", icon: "warn",
            title: "Medicare still waits", sub: "No formulary search or coverage decision happens while repeated recommendations are combined." },
        { id: "lane-rules", type: "lane", x: 80, y: 134, w: 1040, h: 172, kind: "control",
            title: "Rules for grouping", hint: "Fixed first: one deterministic rule, no new AI or coverage decision" },
        { id: "MATCH_RULE", type: "step", x: 122, y: 186, w: 292, h: 100, kind: "control", icon: "merge",
            title: "Combine only when both signals agree", sub: "Same drug name and same precise class become one entry. If either differs, they stay separate." },
        { id: "KEEP", type: "step", x: 454, y: 186, w: 292, h: 100, kind: "control", icon: "sheet",
            title: "Keep every original line", sub: "Strength-specific wording stays visible inside the combined medicine for traceability." },
        { id: "IDENTITY", type: "step", x: 786, y: 186, w: 292, h: 100, kind: "control", icon: "column",
            title: "Give each medicine an identity", sub: "Later searches and review results can always point back to the right medicine." },
        { id: "QUESTION", type: "explain", x: 320, y: 346, w: 560, h: 84, kind: "group", icon: "merge",
            title: "Combine the repeated strengths of each medicine", sub: "One entry per drug name-and-class pair, with every original recommendation kept attached." },
        { id: "lane-group", type: "lane", x: 80, y: 462, w: 1040, h: 376, kind: "group",
            title: "The rule in action, on the real clinician list", hint: "The original recommendations stay attached to the medicine" },
        { id: "HDR_VAR", type: "step", x: 180, y: 502, w: 320, h: 34, kind: "head", title: "Repeated recommendations" },
        { id: "HDR_CON", type: "step", x: 600, y: 502, w: 360, h: 34, kind: "head", title: "One medicine" },
        { id: "ADDERALL_VARIANTS", type: "step", x: 180, y: 544, w: 320, h: 88, kind: "source", icon: "sheet",
            title: "7 Adderall recommendations", sub: "Tablets at 5, 7.5, 10, 12.5, 15, 20, and 30 mg." },
        { id: "ADDERALL_CONCEPT", type: "step", x: 600, y: 544, w: 360, h: 88, kind: "group", icon: "merge",
            title: "One medicine: Adderall", sub: "CNS stimulants: amphetamine derivatives. All seven strengths stay attached." },
        { id: "NOTE_XR", type: "explain", x: 600, y: 638, w: 360, h: 40, kind: "note", icon: "shield",
            title: "Exception: Adderall XR (extended-release) forms its own separate medicine." },
        { id: "HYZAAR_VARIANTS", type: "step", x: 180, y: 692, w: 320, h: 88, kind: "source", icon: "sheet",
            title: "3 Hyzaar recommendations", sub: "Tablets at 50-12.5, 100-12.5, and 100-25 mg." },
        { id: "HYZAAR_CONCEPT", type: "step", x: 600, y: 692, w: 360, h: 88, kind: "group", icon: "merge",
            title: "One medicine: Losartan-hydrochlorothiazide (Hyzaar)", sub: "ARB + thiazide diuretic. All three strengths stay attached." },
        { id: "NOTE_NAME", type: "explain", x: 600, y: 786, w: 360, h: 40, kind: "note", icon: "ban",
            title: "A near-identical name is never enough. Release and class differences keep medicines apart." },
        { id: "OUT", type: "explain", x: 350, y: 886, w: 500, h: 84, kind: "out", icon: "arrow",
            title: "1,348 recommendations become 720 distinct medicines", sub: "46.6% fewer searches and validation decisions. Next, each medicine is searched across Medicare and the other plans." },
    ],
    edges: [
        { from: "IN", to: "lane-rules", sh: "bottom", th: "top" },
        { from: "lane-rules", to: "QUESTION", sh: "bottom", th: "top" },
        { from: "QUESTION", to: "lane-group", sh: "bottom", th: "top" },
        { from: "ADDERALL_VARIANTS", to: "ADDERALL_CONCEPT", sh: "right", th: "left" },
        { from: "HYZAAR_VARIANTS", to: "HYZAAR_CONCEPT", sh: "right", th: "left" },
        { from: "lane-group", to: "OUT", sh: "bottom", th: "top" },
    ],
};
