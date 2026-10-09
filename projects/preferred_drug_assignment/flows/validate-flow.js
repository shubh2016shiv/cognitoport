/*
  Stage 05 is a three-phase horizontal pipeline, read like a book:

    PHASE 1 (left)   what the AI is given
      720 distinct medicines + covered candidates, then the two rule sets
      (closed evidence room, matching protocol) stacked below them

    PHASE 2 (middle) the engine
      run the protocol on the closed evidence set, with one worked
      example nested beneath it (accept / reject on a real Medicare row)

    PHASE 3 (right)  validation + output
      deterministic intersection, then the split:
      683 of 720 verified  /  37 need clinical review
*/
export const validateStory = {
    variant: "guided",
    nodes: [
        // ================= PHASE 1 =================
        { id: "PHASE1", type: "lane", x: 24, y: 24, w: 456, h: 1054, kind: "phase",
            title: "Phase 1 · Inputs + rules", hint: "Everything the AI is given before it acts" },
        { id: "CONCEPTS", type: "src", x: 50, y: 66, w: 404, h: 84, kind: "intent", icon: "package",
            title: "720 distinct medicines to verify", sub: "Each is one preferred medicine: a primary drug name and its precise clinical class, with its covered strengths attached." },
        { id: "CANDIDATES", type: "src", x: 50, y: 164, w: 404, h: 84, kind: "covered", icon: "database",
            title: "Covered candidates", sub: "Real rows retrieved from the seven plan formularies." },
        { id: "lane-context", type: "lane", x: 42, y: 286, w: 420, h: 300, kind: "context",
            title: "Constraints on the evidence", hint: "A closed evidence room" },
        { id: "ONE", type: "step", x: 62, y: 324, w: 380, h: 58, kind: "context", icon: "package",
            title: "One medicine at a time", sub: "Adderall evidence never mixes with Hyzaar's." },
        { id: "TABLE", type: "step", x: 62, y: 388, w: 380, h: 58, kind: "context", icon: "sheet",
            title: "A finite evidence table", sub: "Plan, row identity, description, similarity score, and nothing else." },
        { id: "LOCKED", type: "step", x: 62, y: 452, w: 380, h: 58, kind: "context", icon: "lock",
            title: "No additional searching", sub: "The model cannot add records or query the formulary." },
        { id: "PROVENANCE", type: "step", x: 62, y: 516, w: 380, h: 58, kind: "context", icon: "shield",
            title: "Plan identity stays attached", sub: "A Medicare row can never become another plan's result." },
        { id: "lane-protocol", type: "lane", x: 42, y: 616, w: 420, h: 434, kind: "reason",
            title: "The pharmacological matching protocol", hint: "Active ingredient first, class second" },
        { id: "CAT", type: "step", x: 62, y: 656, w: 380, h: 58, kind: "reason", icon: "branch",
            title: "Categorize the row first", sub: "Medicine or device: each has its own matching branch." },
        { id: "INGREDIENT", type: "step", x: 62, y: 720, w: 380, h: 58, kind: "reason", icon: "shield",
            title: "Active ingredient supremacy", sub: "Reject a different ingredient even when the class is identical." },
        { id: "NAMES", type: "step", x: 62, y: 784, w: 380, h: 58, kind: "reason", icon: "search",
            title: "Resolve naming differences", sub: "Brand vs generic, salt vs base; keep combinations together." },
        { id: "FORMS", type: "step", x: 62, y: 848, w: 380, h: 58, kind: "reason", icon: "sheet",
            title: "Keep matching formulations", sub: "All covered strengths and forms of the matched ingredient survive." },
        { id: "CLASS", type: "step", x: 62, y: 912, w: 380, h: 58, kind: "reason", icon: "gauge",
            title: "Class is a secondary check", sub: "Reject only when the class explicitly contradicts the ingredient." },
        { id: "OUTPUT_RULE", type: "step", x: 62, y: 976, w: 380, h: 58, kind: "reason", icon: "json",
            title: "Constrain the answer shape", sub: "Exact candidate names only, or an empty list. No prose." },
        // ================= PHASE 2 =================
        { id: "PHASE2", type: "lane", x: 520, y: 24, w: 576, h: 588, kind: "phase",
            title: "Phase 2 · The engine", hint: "The AI does the work" },
        { id: "EXECUTE", type: "explain", x: 544, y: 70, w: 528, h: 118, kind: "reason", icon: "brain",
            title: "Run the AI matching protocol on the closed evidence set", sub: "The model judges each candidate against the retrieved rows only. It cannot reach past them." },
        { id: "lane-example", type: "lane", x: 540, y: 226, w: 536, h: 360, kind: "example",
            title: "Example: evaluating a single medicine", hint: "Similarity proposes; active ingredient decides" },
        { id: "ADD_HEAD", type: "step", x: 560, y: 268, w: 244, h: 30, kind: "head", title: "Accept: ingredient matches" },
        { id: "REJ_HEAD", type: "step", x: 820, y: 268, w: 244, h: 30, kind: "head", title: "Reject: ingredient differs" },
        { id: "ADDERALL_MATCH", type: "step", x: 560, y: 306, w: 244, h: 258, kind: "accept", icon: "shield",
            title: "Adderall → Amphetamine-Dextroamphetamine", sub: "Accept the real Medicare family: 5 MG, 15 MG, 30 MG and the other covered strengths and forms the protocol permits." },
        { id: "ADDERALL_REJECT", type: "step", x: 820, y: 306, w: 244, h: 258, kind: "reject", icon: "ban",
            title: "Adderall → a different stimulant ingredient", sub: "Rejected even within the same stimulant class. For Hyzaar, Valsartan-HCTZ would be rejected the same way." },
        // ================= PHASE 3 =================
        { id: "PHASE3", type: "lane", x: 1136, y: 24, w: 512, h: 512, kind: "phase",
            title: "Phase 3 · Validation + output", hint: "The intersection splits the 720 medicines into two piles" },
        { id: "INTERSECT", type: "explain", x: 1158, y: 70, w: 468, h: 158, kind: "guard", icon: "shield",
            title: "Deterministic intersection: trust the rows, not the vocabulary", sub: "Real covered candidates ∩ AI-selected exact names = verified rows. A name the model invents matches nothing and disappears." },
        { id: "VERIFIED", type: "explain", x: 1158, y: 296, w: 224, h: 210, kind: "out", icon: "arrow",
            title: "683 of 720 medicines verified", sub: "Every surviving row identity originated in a real plan formulary." },
        { id: "REVIEW", type: "explain", x: 1402, y: 296, w: 224, h: 210, kind: "review", icon: "warn",
            title: "37 of 720 medicines need clinical review", sub: "Nothing survived the intersection. No forced answer: the system will not substitute a near-match for an empty result." },
    ],
    edges: [
        { from: "CONCEPTS", to: "EXECUTE", sh: "right", th: "left" },
        { from: "CANDIDATES", to: "EXECUTE", sh: "right", th: "left" },
        { from: "EXECUTE", to: "INTERSECT", sh: "right", th: "left" },
        { from: "INTERSECT", to: "VERIFIED", sh: "bottom", th: "top" },
        { from: "INTERSECT", to: "REVIEW", sh: "bottom", th: "top" },
    ],
};
