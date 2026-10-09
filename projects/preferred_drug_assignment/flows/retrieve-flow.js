/*
  Stage 04, one straight vertical spine, every main arrow dead centre:

    inputs (medicines + plan formularies)
      -> how the search is run (fixed parameters, set first)
      -> run the semantic search
      -> the seven plans, each searched on its own
      -> the search in action on two real medicines, column by column
      -> covered candidates, with plan identity attached

  "Candidate is not confirmed" is a borderless margin note, not a step.
*/
export const retrieveStory = {
    variant: "guided",
    nodes: [
        { id: "IN", type: "src", x: 180, y: 24, w: 400, h: 84, kind: "source", icon: "package",
            title: "720 distinct medicines to search for", sub: "Each is one medicine: a primary drug name and a precise clinical class." },
        { id: "PLANS", type: "src", x: 620, y: 24, w: 400, h: 84, kind: "covered", icon: "database",
            title: "Seven separate plan formularies", sub: "Every plan contains only the medicines that plan actually covers." },
        { id: "lane-params", type: "lane", x: 80, y: 140, w: 1040, h: 172, kind: "search",
            title: "How the search is run", hint: "Fixed parameters: the same for every medicine and every plan" },
        { id: "PARAM_MEANING", type: "step", x: 122, y: 192, w: 292, h: 100, kind: "search", icon: "search",
            title: "Search by clinical meaning", sub: "The medicine name and its precise class are used together, never plain text." },
        { id: "PARAM_BANDS", type: "step", x: 454, y: 192, w: 292, h: 100, kind: "search", icon: "filter",
            title: "Keep the three strongest similarity levels", sub: "If several strengths share a level, the whole family stays. No strength is picked early." },
        { id: "PARAM_PLANS", type: "step", x: 786, y: 192, w: 292, h: 100, kind: "search", icon: "database",
            title: "Ask each plan on its own", sub: "Every plan is searched separately; results never cross plan boundaries." },
        { id: "SEARCH", type: "explain", x: 320, y: 352, w: 560, h: 84, kind: "search", icon: "search",
            title: "Run the semantic search", sub: "Each medicine is matched against the real covered records of each plan, by clinical meaning." },
        { id: "lane-plans", type: "lane", x: 80, y: 470, w: 1040, h: 150, kind: "plans",
            title: "The seven plans, each searched on its own", hint: "Medicare is the plan followed through this walkthrough" },
        { id: "MEDICARE", type: "step", x: 120, y: 516, w: 180, h: 86, kind: "medicare", icon: "shield", title: "Medicare", sub: "Followed here" },
        { id: "MEDICAID", type: "step", x: 316, y: 516, w: 118, h: 86, kind: "plan", icon: "database", title: "Medicaid", sub: "On its own" },
        { id: "COMMERCIAL", type: "step", x: 450, y: 516, w: 118, h: 86, kind: "plan", icon: "database", title: "Commercial", sub: "On its own" },
        { id: "FEHB", type: "step", x: 584, y: 516, w: 118, h: 86, kind: "plan", icon: "database", title: "FEHB", sub: "On its own" },
        { id: "EXCHANGE", type: "step", x: 718, y: 516, w: 118, h: 86, kind: "plan", icon: "database", title: "Exchange", sub: "On its own" },
        { id: "CLEAR", type: "step", x: 852, y: 516, w: 118, h: 86, kind: "plan", icon: "database", title: "Clear", sub: "On its own" },
        { id: "INTEL", type: "step", x: 986, y: 516, w: 118, h: 86, kind: "plan", icon: "database", title: "Intel", sub: "On its own" },
        { id: "lane-meaning", type: "lane", x: 80, y: 652, w: 1040, h: 380, kind: "search",
            title: "The search in action, on two real medicines", hint: "The same medicine is written differently inside a formulary" },
        { id: "HDR_CONCEPT", type: "step", x: 122, y: 694, w: 260, h: 34, kind: "head", title: "Clinician's medicine" },
        { id: "HDR_SEARCH", type: "step", x: 412, y: 694, w: 300, h: 34, kind: "head", title: "Search name + class" },
        { id: "HDR_FOUND", type: "step", x: 742, y: 694, w: 336, h: 34, kind: "head", title: "Covered record it surfaces" },
        { id: "ADDERALL", type: "step", x: 122, y: 738, w: 260, h: 92, kind: "intent", icon: "sheet",
            title: "Clinician's medicine: Adderall", sub: "CNS stimulant, amphetamine derivative." },
        { id: "ADDERALL_SEARCH", type: "step", x: 412, y: 738, w: 300, h: 92, kind: "search", icon: "search",
            title: "Match name + precise class", sub: "Connects the brand name to differently worded covered records." },
        { id: "ADDERALL_FOUND", type: "step", x: 742, y: 738, w: 336, h: 92, kind: "covered", icon: "database",
            title: "Medicare: Amphetamine-Dextroamphetamine", sub: "A real formulary record such as Tablet 15 MG Oral surfaces." },
        { id: "HYZAAR", type: "step", x: 122, y: 846, w: 260, h: 92, kind: "intent", icon: "sheet",
            title: "Clinician's medicine: Hyzaar", sub: "ARB + thiazide diuretic." },
        { id: "HYZAAR_SEARCH", type: "step", x: 412, y: 846, w: 300, h: 92, kind: "search", icon: "search",
            title: "Match the combination together", sub: "Both ingredient signals stay part of the clinical meaning." },
        { id: "HYZAAR_FOUND", type: "step", x: 742, y: 846, w: 336, h: 92, kind: "covered", icon: "database",
            title: "Medicare: Losartan Potassium-HCTZ", sub: "Its covered Tablet 100-12.5 MG Oral surfaces." },
        { id: "FOOTNOTE_FAMILY", type: "explain", x: 100, y: 956, w: 1000, h: 56, kind: "footnote", icon: "sheet",
            title: "The whole covered strength family returns, not one row",
            sub: "The Amphetamine-Dextroamphetamine tablets (5, 15, 30 MG Oral and other covered strengths) and the Losartan Potassium-HCTZ tablets (50-12.5, 100-12.5, 100-25 MG Oral) all stay in the evidence set." },
        { id: "NOTE_UNCONFIRMED", type: "explain", x: 872, y: 1058, w: 248, h: 104, kind: "note", icon: "warn",
            title: "Candidate is not confirmed", sub: "A close result can still be a different active ingredient from the same class. The next stage decides which truly match." },
        { id: "OUT", type: "explain", x: 340, y: 1064, w: 520, h: 88, kind: "out", icon: "arrow",
            title: "Covered candidates, with their plan identity attached", sub: "Every candidate keeps its plan, formulary identity, medicine description, strength, form, and similarity level for ingredient validation." },
    ],
    edges: [
        { from: "IN", to: "lane-params", sh: "bottom", th: "top" },
        { from: "PLANS", to: "lane-params", sh: "bottom", th: "top" },
        { from: "lane-params", to: "SEARCH", sh: "bottom", th: "top" },
        { from: "SEARCH", to: "lane-plans", sh: "bottom", th: "top" },
        { from: "lane-plans", to: "lane-meaning", sh: "bottom", th: "top" },
        { from: "ADDERALL", to: "ADDERALL_SEARCH", sh: "right", th: "left" },
        { from: "ADDERALL_SEARCH", to: "ADDERALL_FOUND", sh: "right", th: "left" },
        { from: "HYZAAR", to: "HYZAAR_SEARCH", sh: "right", th: "left" },
        { from: "HYZAAR_SEARCH", to: "HYZAAR_FOUND", sh: "right", th: "left" },
        { from: "lane-meaning", to: "OUT", sh: "bottom", th: "top" },
    ],
};
