/* ============================================================
   Stage 06 · Govern: committing the flag
   ============================================================
   Source: utils.py (row ids resolved to readable drug names for
   the audit file) and filter_formulary_drugs_as_preferred.py:
   the id parser, the cursor-free reset scan, and the batched
   bulk write that marks the current preferred set.

   House style: guided vertical spine, straight arrows, steps read
   left to right inside each phase. "Why clear first" and "the gap
   in the middle" are contextual notes inside Phase 2, not data
   destinations.
   ============================================================ */
export const assignStory = {
    variant: "guided",
    nodes: [
        { id: "IN", type: "src", x: 360, y: 24, w: 480, h: 84, kind: "source", icon: "package",
            title: "17,789 verified row ids", sub: "Only the ids that survived the intersection guard in stage 05." },
        // ---- Phase 1: results file -> database keys ----
        { id: "lane-prep", type: "lane", x: 80, y: 150, w: 1040, h: 232, kind: "context",
            title: "Phase 1 · Prepare the keys", hint: "Turn a results file back into a set of database keys" },
        { id: "P1", type: "step", x: 108, y: 200, w: 300, h: 150, kind: "context", icon: "sheet",
            title: "Re-read the id column", sub: "A CSV round-trip turns a list into text, so the parser accepts a real list, a string that only looks like one, an empty list, or a blank cell." },
        { id: "P2", type: "step", x: 428, y: 200, w: 300, h: 150, kind: "context", icon: "merge",
            title: "Flatten to distinct ids", sub: "17,789 assignments collapse to 11,312 distinct formulary rows. The same drug is assigned once per plan and once per strength." },
        { id: "P3", type: "step", x: 748, y: 200, w: 300, h: 150, kind: "context", icon: "search",
            title: "Resolve readable names", sub: "Ids are looked up and turned back into drug names, so a pharmacist reviews “Acarbose Tablet 25 MG Oral”, not “CFH00294”." },
        { id: "AUDIT", type: "explain", x: 1160, y: 220, w: 240, h: 150, kind: "structured", icon: "json",
            title: "The audit file", sub: "Preferred variants and their matched drug names, written side by side for human review." },
        // ---- Phase 2: the write ----
        { id: "lane-write", type: "lane", x: 80, y: 430, w: 1040, h: 330, kind: "control",
            title: "Phase 2 · Write it as a full refresh", hint: "After the run, the flag means exactly the current list" },
        { id: "W1", type: "step", x: 108, y: 480, w: 300, h: 150, kind: "control", icon: "ban",
            title: "Clear every flag first", sub: "The entire database of 37,307 documents is set to false before anything is set true, so a drug the committee dropped this cycle cannot keep last cycle's flag." },
        { id: "W2", type: "step", x: 428, y: 480, w: 300, h: 150, kind: "control", icon: "column",
            title: "Walk by _id, never skip", sub: "The scan steps forward with _id greater than the last seen, 100 at a time across four workers. A skip-based scan would slow down as the offset grew." },
        { id: "W3", type: "step", x: 748, y: 480, w: 300, h: 150, kind: "control", icon: "shield",
            title: "Then set the current set", sub: "Bulk writes of 100 are unordered so one bad row cannot stall the rest. Each batch is retried three times, and only on a database error." },
        { id: "NOTE_WHY", type: "explain", x: 108, y: 646, w: 300, h: 82, kind: "note", icon: "gauge",
            title: "Why clear every flag first", sub: "It makes the write declarative: afterwards the flag is true for exactly the current list, and nothing else." },
        { id: "NOTE_RISK", type: "explain", x: 456, y: 646, w: 592, h: 82, kind: "note", icon: "warn",
            title: "The gap in the middle", sub: "The two phases are not one transaction. Between them every flag is false, so a reader mid-run briefly sees no preferred drugs at all." },
        { id: "OUT", type: "explain", x: 340, y: 806, w: 520, h: 90, kind: "out", icon: "arrow",
            title: "Live preferred flags", sub: "11,312 rows across seven plans now read preferred_drug: true, ready for the prescribing dashboard." },
    ],
    edges: [
        { from: "IN", to: "lane-prep", sh: "bottom", th: "top" },
        { from: "P1", to: "P2", sh: "right", th: "left" },
        { from: "P2", to: "P3", sh: "right", th: "left" },
        { from: "P3", to: "AUDIT", sh: "right", th: "left" },
        { from: "lane-prep", to: "lane-write", sh: "bottom", th: "top" },
        { from: "W1", to: "W2", sh: "right", th: "left" },
        { from: "W2", to: "W3", sh: "right", th: "left" },
        { from: "lane-write", to: "OUT", sh: "bottom", th: "top" },
    ],
};
