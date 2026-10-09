/*
  Stage 02, one straight vertical spine, every main arrow dead centre:

    input arrives
      -> rules of engagement for the AI (set first, govern everything below)
      -> AI asks its two questions
      -> the two questions applied to two real examples, column by column
      -> every recommendation now has a searchable identity

  The scope note (no Medicare search yet) is a borderless margin disclaimer.
  The "simplify without erasing meaning" principle is a footer strip inside
  the example lane, not a card in the path.
*/
export const normalizeStory = {
    variant: "guided",
    nodes: [
        { id: "RAW", type: "src", x: 360, y: 24, w: 480, h: 78, kind: "source", icon: "package",
            title: "Clinicians describe the medicine", sub: "1,348 recommendations arrive with the original clinical wording preserved." },
        { id: "NOTE_SCOPE", type: "explain", x: 892, y: 26, w: 232, h: 78, kind: "note", icon: "warn",
            title: "No Medicare search yet", sub: "The formulary is not queried and no coverage decision is made in this stage." },
        { id: "lane-guardrails", type: "lane", x: 80, y: 134, w: 1040, h: 172, kind: "control",
            title: "Rules of engagement for the AI", hint: "Fixed first: they govern every step below" },
        { id: "SAME_RULES", type: "step", x: 122, y: 186, w: 292, h: 100, kind: "control", icon: "examples",
            title: "Apply the same clinical rules", sub: "Medicines, combinations, supplements, vaccines, and devices each follow explicit identification guidance." },
        { id: "TWO_FIELDS", type: "step", x: 454, y: 186, w: 292, h: 100, kind: "control", icon: "lock",
            title: "Return only two answers", sub: "One primary medicine name and one precise class keep the result easy to inspect." },
        { id: "ISOLATE", type: "step", x: 786, y: 186, w: 292, h: 100, kind: "control", icon: "warn",
            title: "Set unclear rows aside during evaluation", sub: "A difficult recommendation is recorded for review without stopping the rest of the list." },
        { id: "QUESTION", type: "explain", x: 320, y: 346, w: 560, h: 88, kind: "interpret", icon: "brain",
            title: "AI asks two focused questions", sub: "What is the primary medicine? What is the most specific clinical class that describes it?" },
        { id: "lane-understand", type: "lane", x: 80, y: 474, w: 1040, h: 400, kind: "interpret",
            title: "The two questions, applied to two real examples", hint: "The original recommendation stays beside the interpretation" },
        { id: "HDR_RAW", type: "step", x: 122, y: 516, w: 250, h: 38, kind: "head", title: "Raw clinician wording" },
        { id: "HDR_NAME", type: "step", x: 412, y: 516, w: 280, h: 38, kind: "head", title: "Extract the primary name" },
        { id: "HDR_CLASS", type: "step", x: 732, y: 516, w: 346, h: 38, kind: "head", title: "Assign the specific class" },
        { id: "ADDERALL_RAW", type: "step", x: 122, y: 564, w: 250, h: 96, kind: "source", icon: "sheet",
            title: "Clinician writes: ADDERALL tablet 15 mg", sub: "Brand, dosage form, and strength in one line." },
        { id: "ADDERALL_NAME", type: "step", x: 412, y: 564, w: 280, h: 96, kind: "interpret", icon: "brain",
            title: "Primary medicine: Adderall", sub: "Strength and routine dosage form no longer define the medicine's identity." },
        { id: "ADDERALL_CLASS", type: "step", x: 732, y: 564, w: 346, h: 96, kind: "structured", icon: "json",
            title: "Class: CNS stimulants, amphetamine derivatives", sub: "Specific enough to guide a meaningful formulary search later." },
        { id: "HYZAAR_RAW", type: "step", x: 122, y: 676, w: 250, h: 96, kind: "source", icon: "sheet",
            title: "Clinician writes: Hyzaar 100-12.5 mg", sub: "A brand and two ingredients expressed as one combination medicine." },
        { id: "HYZAAR_NAME", type: "step", x: 412, y: 676, w: 280, h: 96, kind: "interpret", icon: "brain",
            title: "Primary medicine: Losartan-hydrochlorothiazide (Hyzaar)", sub: "Both ingredients remain together; neither one is dropped." },
        { id: "HYZAAR_CLASS", type: "step", x: 732, y: 676, w: 346, h: 96, kind: "structured", icon: "json",
            title: "Class: ARB + thiazide diuretic", sub: "The class describes both mechanisms instead of using a broad blood-pressure label." },
        { id: "DISTINCTION", type: "explain", x: 100, y: 800, w: 1000, h: 58, kind: "footnote", icon: "shield",
            title: "The rule these examples follow: simplify the wording without erasing clinical meaning", sub: "Adderall and Adderall XR stay distinct. Combination medicines stay combined. Brand, release type, and device clues survive when they change what the medicine means." },
        { id: "OUT", type: "explain", x: 350, y: 918, w: 500, h: 82, kind: "out", icon: "arrow",
            title: "Every recommendation now has a searchable clinical identity", sub: "Next, repeated strengths of the same drug are grouped into one entry." },
    ],
    edges: [
        { from: "RAW", to: "lane-guardrails", sh: "bottom", th: "top" },
        { from: "lane-guardrails", to: "QUESTION", sh: "bottom", th: "top" },
        { from: "QUESTION", to: "lane-understand", sh: "bottom", th: "top" },
        { from: "ADDERALL_RAW", to: "ADDERALL_NAME" },
        { from: "ADDERALL_NAME", to: "ADDERALL_CLASS" },
        { from: "HYZAAR_RAW", to: "HYZAAR_NAME" },
        { from: "HYZAAR_NAME", to: "HYZAAR_CLASS" },
        { from: "lane-understand", to: "OUT", sh: "bottom", th: "top" },
    ],
};
