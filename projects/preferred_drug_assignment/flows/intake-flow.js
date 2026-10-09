/*
  Stage 01 follows the same house style as the other guided stages:
  full-width horizontal lanes stacked top to bottom, and inside each lane
  the steps read left to right.

    inputs -> the naming gap (two real Medicare examples)
           -> load the list: route by the checksum, then apply the rules
           -> ready

  The two Medicare examples are peers joined by a dashed "same medicine"
  equivalence, not a directional flow (nothing is translated yet).
  The checksum router branches: an unchanged list reuses its stored result
  and skips the rules; a new list runs 01 then 02.
*/
export const intakeStory = {
    variant: "guided",
    nodes: [
        { id: "COMMITTEE", type: "src", x: 175, y: 24, w: 350, h: 78, kind: "source", icon: "committee",
            title: "Clinicians decide", sub: "Physicians and pharmacists choose the medicines clinicians should consider first." },
        { id: "LIST", type: "src", x: 675, y: 24, w: 350, h: 78, kind: "source", icon: "sheet",
            title: "Preferred Drug List", sub: "1,348 usable recommendations, written in clinicians' own language." },
        { id: "GAP", type: "explain", x: 320, y: 134, w: 560, h: 84, kind: "gap", icon: "branch",
            title: "One clinical decision can be named very differently by a health plan", sub: "The preferred list tells us what clinicians recommend. It does not yet identify the exact covered record in a patient's insurance plan." },
        { id: "lane-examples", type: "lane", x: 80, y: 252, w: 1040, h: 300, kind: "compare",
            title: "Two real Medicare examples", hint: "Same treatment, two systems of language" },
        { id: "ADDERALL_LIST", type: "step", x: 120, y: 326, w: 250, h: 96, kind: "source", icon: "sheet",
            title: "Clinicians write: Adderall", sub: "A familiar brand name, with no plan-specific coverage identity." },
        { id: "ADDERALL_MEDICARE", type: "step", x: 410, y: 326, w: 330, h: 96, kind: "compare", icon: "column",
            title: "Medicare stores: Amphetamine-Dextroamphetamine Tablet 15 MG Oral", sub: "Generic ingredient, dosage form, strength, and route." },
        { id: "HYZAAR_LIST", type: "step", x: 120, y: 446, w: 250, h: 96, kind: "source", icon: "sheet",
            title: "Clinicians write: Hyzaar 100-12.5 mg", sub: "Brand and clinical shorthand for a combination medicine." },
        { id: "HYZAAR_MEDICARE", type: "step", x: 410, y: 446, w: 330, h: 96, kind: "compare", icon: "column",
            title: "Medicare stores: Losartan Potassium-HCTZ Tablet 100-12.5 MG Oral", sub: "The same ingredients and strength in formulary language." },
        { id: "MEANING", type: "explain", x: 790, y: 344, w: 280, h: 132, kind: "gap", icon: "prompt",
            title: "The meaning is there. The shared label is not.", sub: "A plain text match would miss these rows, or mistake a related medicine for the same one." },
        { id: "lane-intake", type: "lane", x: 80, y: 592, w: 1040, h: 250, kind: "preserve",
            title: "Load the Preferred Drug List", hint: "Route by the checksum, then apply the rules in order" },
        { id: "CACHE", type: "explain", x: 120, y: 650, w: 280, h: 150, kind: "search", icon: "search",
            title: "Has this exact list been processed before?", sub: "A checksum of the list is compared with the previous run." },
        { id: "DROP", type: "step", x: 450, y: 652, w: 270, h: 92, kind: "preserve", seq: "01", icon: "filter",
            title: "Drop rows with no drug value", sub: "Empty Preferred_Drugs cells are removed first." },
        { id: "PRESERVE", type: "step", x: 760, y: 652, w: 280, h: 92, kind: "preserve", seq: "02", icon: "lock",
            title: "Lock the remaining strings in, verbatim", sub: "Stored exactly as written. No normalization, spell-fix, or coverage guess." },
        { id: "REUSE", type: "step", x: 450, y: 764, w: 590, h: 62, kind: "preserve", icon: "clock",
            title: "Unchanged: reuse the cached identities, skip 01 and 02", sub: "" },
        { id: "OUT", type: "explain", x: 340, y: 900, w: 520, h: 82, kind: "out", icon: "arrow",
            title: "Ready to understand each medicine", sub: "Next, AI identifies the primary drug name and most specific clinical class." },
    ],
    edges: [
        { from: "COMMITTEE", to: "GAP", sh: "bottom", th: "top" },
        { from: "LIST", to: "GAP", sh: "bottom", th: "top" },
        { from: "GAP", to: "lane-examples", sh: "bottom", th: "top" },
        { from: "ADDERALL_LIST", to: "ADDERALL_MEDICARE", rel: "equiv", label: "same medicine" },
        { from: "HYZAAR_LIST", to: "HYZAAR_MEDICARE", rel: "equiv", label: "same medicine" },
        { from: "lane-examples", to: "lane-intake", sh: "bottom", th: "top" },
        { from: "CACHE", to: "DROP", sh: "right", th: "left", label: "list is new" },
        { from: "CACHE", to: "REUSE", sh: "right", th: "left", label: "unchanged" },
        { from: "DROP", to: "PRESERVE", sh: "right", th: "left" },
        { from: "lane-intake", to: "OUT", sh: "bottom", th: "top" },
    ],
};
