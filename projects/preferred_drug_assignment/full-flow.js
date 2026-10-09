"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/* Consolidated HLD: Preferred Drug Intelligence Pipeline
 *
 * Layout contract (this is what keeps the canvas readable):
 *   1. Each phase is one column. Business flow inside a column runs top -> bottom.
 *   2. Phase-to-phase handoffs always exit RIGHT and enter LEFT, so smoothstep
 *      routes their vertical segment through the 60px gutter between columns,
 *      never across node content.
 *   3. Only phase-to-phase handoffs carry labels. Intra-phase edges are
 *      unlabeled: adjacency already says "next step".
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, } from "react";
import { createPortal } from "react-dom";
import { BaseEdge, Background, Controls, EdgeLabelRenderer, getSmoothStepPath, Handle, MarkerType, Position, ReactFlow, } from "@xyflow/react";
/* ------------------------------------------------------------------ layout */
const COL_W = 320;
const GUTTER = 60;
const NODE_W = 284;
const NODE_INSET = 18;
const ROW = { r1: 150, r2: 302, r3: 454, r4: 606 };
const CENTERED_ROW = {
    single: 386,
    pairTop: 300,
    pairBottom: 470,
    trioTop: 200,
    trioMiddle: 380,
    trioBottom: 560,
};
const colX = (i) => i * (COL_W + GUTTER);
const STAGE_TOP = 0;
const STAGE_H = 760;
const STAGES = {
    intake: {
        index: "01",
        title: "Clinical Source: Preferred Drug List",
        purpose: "Read the pharmacy-curated source entries",
        x: colX(0),
        width: COL_W,
    },
    identify: {
        index: "02",
        title: "Drug Data Extraction",
        purpose: "Extract a normalized drug name and precise therapeutic class",
        x: colX(1),
        width: COL_W,
    },
    consolidate: {
        index: "03",
        title: "Group Doses of the Same Drug",
        purpose: "Combine strengths and forms into distinct clinical groups",
        x: colX(2),
        width: COL_W,
    },
    retrieve: {
        index: "04",
        title: "Search Every Plan for Candidates",
        purpose: "Find plausible candidates across all seven plan formularies",
        x: colX(3),
        width: COL_W,
    },
    verify: {
        index: "05",
        title: "AI-Driven Clinical Validation",
        purpose: "Confirm clinical equivalence inside the retrieved evidence set",
        x: colX(4),
        width: COL_W,
    },
    publish: {
        index: "06",
        title: "Human Review & Automated Formulary Sync",
        purpose: "Review confirmed matches and update production formulary flags",
        x: colX(5),
        width: COL_W,
    },
};
const node = (stage, col, row, rest) => ({
    stage,
    x: colX(col) + NODE_INSET,
    y: row,
    width: NODE_W,
    ...rest,
});
const COMPONENTS = {
    /* 01: Intake ----------------------------------------------------------- */
    SOURCE_LIST: node("intake", 0, CENTERED_ROW.single, {
        icon: "list",
        tag: "SOURCE",
        title: "Preferred Drug List (Excel)",
        detail: "1,355 pharmacy-curated drug and device descriptions",
    }),
    /* 02: Identify --------------------------------------------------------- */
    IDENTITY_POLICY: node("identify", 1, CENTERED_ROW.pairTop, {
        icon: "prompt",
        tag: "PROMPT",
        title: "Rules for Reading Drug Names",
        detail: "Few-shot rules for drugs, combinations, vaccines, and devices",
    }),
    IDENTITY_AI: node("identify", 1, CENTERED_ROW.pairBottom, {
        icon: "brain",
        tag: "AI SERVICE",
        title: "Read the Drug Name and Class",
        detail: "GPT-4o returns a normalized name and precise therapeutic class",
    }),
    /* 03: Consolidate ------------------------------------------------------ */
    CONSOLIDATE: node("consolidate", 2, CENTERED_ROW.pairTop, {
        icon: "merge",
        tag: "PROCESS",
        title: "Merge the Same Drug's Doses",
        detail: "Groups equivalent strengths and forms, preserving source variants",
    }),
    CANONICAL_SET: node("consolidate", 2, CENTERED_ROW.pairBottom, {
        icon: "file",
        tag: "DATASET",
        title: "One Row Per Drug",
        detail: "One stable reference per normalized drug group",
    }),
    /* 04: Retrieve --------------------------------------------------------- */
    RETRIEVAL_GATEWAY: node("retrieve", 3, ROW.r1, {
        icon: "service",
        tag: "DATA SERVICE",
        title: "Search All 7 Insurance Plans",
        detail: "Builds search intent, then queries seven plan formularies at once",
    }),
    PLAN_INDEXES: node("retrieve", 3, ROW.r2, {
        icon: "database",
        tag: "LIVE DATA",
        title: "The 7 Plan Drug Databases",
        detail: "Medicare, Medicaid, Exchange, Commercial, FEHB, Clear, employer",
    }),
    CANDIDATE_RANKER: node("retrieve", 3, ROW.r3, {
        icon: "filter",
        tag: "PROCESS",
        title: "Keep the Closest Matches",
        detail: "Keeps top distinct similarity bands without splitting dose families",
    }),
    EVIDENCE_CONTEXT: node("retrieve", 3, ROW.r4, {
        icon: "table",
        tag: "PROCESS",
        title: "Show the Model Only These Candidates",
        detail: "Renders only the retrieved candidates as the model's whole world",
    }),
    /* 05: Verify ----------------------------------------------------------- */
    MATCH_POLICY: node("verify", 4, CENTERED_ROW.trioTop, {
        icon: "prompt",
        tag: "PROMPT",
        title: 'Rules for "Same Drug"',
        detail: "Ingredient-first rules for brands, salts, forms, and devices",
    }),
    MATCH_AI: node("verify", 4, CENTERED_ROW.trioMiddle, {
        icon: "brain",
        tag: "AI SERVICE",
        title: "Decide Which Are the Same Drug",
        detail: "GPT-4o selects clinically equivalent candidates from the evidence",
    }),
    CANDIDATE_GUARD: node("verify", 4, CENTERED_ROW.trioBottom, {
        icon: "shield",
        tag: "SAFETY CONTROL",
        title: "Block Anything Not Actually Covered",
        detail: "Accepts only records semantic retrieval actually returned",
        guardrail: true,
    }),
    /* 06: Publish ---------------------------------------------------------- */
    NAME_RESOLUTION: node("publish", 5, ROW.r1, {
        icon: "search",
        tag: "PROCESS",
        title: "Look Up Real Drug Names",
        detail: "Turns verified references into reviewer-readable drug names",
    }),
    REVIEW_REPORT: node("publish", 5, ROW.r2, {
        icon: "review",
        tag: "HUMAN REVIEW",
        title: "Pharmacist Review File",
        detail: "Maps each preferred drug to its matched formulary items for QA",
    }),
    STATUS_SYNC: node("publish", 5, ROW.r3, {
        icon: "merge",
        tag: "PROCESS",
        title: "Clear Old Flags, Set New Ones",
        detail: "Full refresh clears prior status, then applies verified assignments",
    }),
    PRODUCTION_FORMULARY: node("publish", 5, ROW.r4, {
        icon: "database",
        tag: "LIVE DATA",
        title: "Live Formulary Database (MongoDB)",
        detail: "MongoDB serves member lookup, cost tiers, and prior authorization",
    }),
};
const COMPONENT_DETAILS = {
    SOURCE_LIST: {
        stage: "Preferred Drug List",
        eyebrow: "01 · Preferred Drug List · Source",
        title: "Preferred Drug List (Excel)",
        definition: "A Preferred Drug List, or PDL, is the curated menu of medications an insurance plan prefers members to use.",
        sections: [
            {
                title: "What “preferred” means",
                items: [
                    "The plan has usually negotiated a better price for the drug.",
                    "Members typically pay the lowest available copay.",
                    "A similar non-preferred drug may cost more or require prior authorization.",
                ],
            },
            {
                title: "What the source looks like",
                facts: [
                    { label: "Size", value: "1,355 drug entries" },
                    { label: "Format", value: "One free-text column" },
                    { label: "Each entry", value: "One drug product" },
                ],
                note: "Drug name, brand, form, and strength are packed into the same line instead of separate fields.",
            },
            {
                title: "What real entries mean",
                table: {
                    columns: ["Raw entry", "Plain meaning"],
                    rows: [
                        [
                            "methylphenidate (RITALIN) tablet 10 mg",
                            "Generic methylphenidate · brand Ritalin · tablet · 10 mg",
                        ],
                        [
                            "ADDERALL XR capsule 10 mg",
                            "Brand Adderall XR · capsule · 10 mg",
                        ],
                        [
                            "(Pres360) insulin aspart (NOVOLOG PENFILL) BRAND ONLY DAW 100 unit/mL crtg",
                            "Special insulin program · Novolog Penfill brand required · cartridge · 100 unit/mL",
                        ],
                    ],
                },
            },
            {
                title: "Patterns the pipeline must understand",
                items: [
                    "A generic name may be followed by its brand in parentheses.",
                    "An all-caps name can mean the brand product itself is preferred.",
                    "Dosage form and strength usually appear near the end.",
                    "Plan prefixes and BRAND ONLY DAW carry special coverage instructions.",
                ],
            },
            {
                title: "What the pipeline turns it into",
                body: "Each messy line becomes one clean, reusable drug record:",
                facts: [
                    { label: "Drug", value: "Normalized name" },
                    { label: "Class", value: "What the drug treats" },
                    { label: "Variants", value: "Covered forms and strengths grouped together" },
                ],
            },
        ],
        insightLabel: "One-line summary",
        insight: "A real-world, one-column list of roughly 1,355 drug products the plan covers at its preferred tier. The rest of the pipeline exists to clean and match it.",
    },
    IDENTITY_POLICY: {
        stage: "Drug Name & Class Identification",
        eyebrow: "02 · Drug Name & Class Identification · Decision policy",
        title: "Rules for Reading Drug Names",
        definition: "A controlled rule set that turns one messy drug line into a consistent drug name and a precise therapeutic class before matching begins.",
        sections: [
            {
                title: "What the rules must decide",
                facts: [
                    { label: "Identity", value: "Which generic and brand name identify the drug" },
                    { label: "Variant", value: "Which words describe its form and strength" },
                    { label: "Class", value: "The most precise therapeutic category" },
                ],
            },
            {
                title: "How a raw line is divided",
                table: {
                    columns: ["Part", "Example"],
                    rows: [
                        ["Plan instruction", "(Pres360)"],
                        ["Generic name", "insulin aspart"],
                        ["Brand name", "(NOVOLOG PENFILL)"],
                        ["Coverage instruction", "BRAND ONLY DAW"],
                        ["Form and strength", "cartridge · 100 unit/mL"],
                    ],
                },
                note: "The generic and brand names form the identity. Form and strength are kept separately as the variant.",
            },
            {
                title: "Rules for the drug name",
                items: [
                    "Keep the generic name and any brand name together.",
                    "Remove form and strength from the primary name.",
                    "Treat a brand without parentheses as a valid drug identity.",
                    "Normalize the saved name to lowercase for consistent grouping.",
                ],
            },
            {
                title: "Rules for the therapeutic class",
                items: [
                    "Use the most specific class, subclass, and mechanism supported by the drug.",
                    "When an acronym is used, write the full term first and place the acronym in parentheses.",
                    "Assign every active ingredient in a combination drug its own class.",
                    "Identify supplements, vaccines, and devices by their specific type and function.",
                    "Preserve meaningful qualifiers such as central action or intrinsic sympathomimetic activity (ISA).",
                ],
            },
            {
                title: "Worked example",
                facts: [
                    {
                        label: "Raw line",
                        value: "(Pres360) insulin aspart (NOVOLOG PENFILL) BRAND ONLY DAW 100 unit/mL crtg",
                    },
                    { label: "Drug name", value: "insulin aspart (novolog penfill)" },
                    {
                        label: "Drug class",
                        value: "Insulins (rapid-acting insulin analogues)",
                    },
                    { label: "Variant", value: "Cartridge · 100 unit/mL" },
                ],
            },
        ],
        prompt: `From the Preferred drug string: "{drug_string}", extract the following information with utmost precision:

1. **Primary Name Extraction**:
   - Identify the main name along with any brand name present.
   - Example: For "losartan-hydrochlorothiazide (HYZAAR) tablet 100-12.5 mg", the primary name is "losartan-hydrochlorothiazide (HYZAAR)".

2. **Precise Class Identification (No Broad Classes Allowed)**:
   - **For Drugs**:
     - Identify the most specific drug class possible.
     - Always include any available subclass, mechanism, or specific detail. For example, if available, return "Beta-1 Selective Beta-Blockers (Cardioselective Beta-Blockers)" instead of simply "Beta-Blockers."
     - If an acronym is used, provide the full form followed by the acronym in brackets.
     - For combination drugs, list each precise class separated by a comma.
   - **For Supplements**:
     - Identify the supplement category with granular specificity. Examples include:
       - "Fat-Soluble Vitamins (Vitamin D)"
       - "Water-Soluble Vitamins (Vitamin C)"
       - "Omega-3 Fatty Acids (Fish Oil Supplements)"
   - **For Vaccines**:
     - Identify the vaccine type with the most precise classification possible.
     - Include any additional details (e.g., "Inactivated Influenza Vaccines", "Live Attenuated Influenza Vaccines", "Recombinant Influenza Vaccines", or any adjuvanted formulations) rather than simply "Influenza Vaccines" or "Vaccines".
   - **For Devices**:
     - Determine the device's precise functional class. Examples include:
       - "Insulin Delivery Devices"
       - "Glucose Monitoring Devices"
       - "Lancets and Lancing Devices"
     - Explicitly specify whether the device is **Manual** or **Continuous** (e.g., "Insulin Delivery Devices (Manual)").
   - **Important**: If any additional detail (such as "central" in "alpha-2 adrenergic agonists (central)") is available, it must be included. Do not default to a broad category if a more precise subclass is derivable from the input. Re-read the input carefully to ensure all specific qualifiers are captured.

3. **Handling Edge Cases**:
   - Resolve any ambiguities by providing the most specific class possible.
   - For combination products, ensure every component is classified precisely.
   - Always include additional qualifiers such as subtype, mechanism, or operation mode (for devices).

### Examples:
1. **"acebutolol (SECTRAL) capsule 200 mg"**
   - drug_name: "acebutolol (SECTRAL)"
   - drug_class: "Beta-1 Selective Beta-Blockers (Cardioselective Beta-Blockers) with Intrinsic Sympathomimetic Activity (ISA)"

2. **"atenolol (TENORMIN) tablet 50 mg"**
   - drug_name: "atenolol (TENORMIN)"
   - drug_class: "Beta-1 Selective Beta-Blockers (Cardioselective Beta-Blockers)"

3. **"diltiazem (CARDIZEM CD) capsule 120 mg"**
   - drug_name: "diltiazem (CARDIZEM CD)"
   - drug_class: "Non-Dihydropyridine Calcium Channel Blockers (Benzothiazepines)"

4. **"losartan-hydrochlorothiazide (HYZAAR) tablet 100-12.5 mg"**
   - drug_name: "losartan-hydrochlorothiazide (HYZAAR)"
   - drug_class: "Angiotensin II Receptor Blockers (ARBs), Thiazide Diuretics"

5. **"bd insulin pen needle uf mini"**
   - drug_name: "bd insulin pen needle uf mini"
   - drug_class: "Insulin Delivery Devices (Manual)"

6. **"accu-chek aviva"**
   - drug_name: "accu-chek aviva"
   - drug_class: "Glucose Monitoring Devices (Manual)"

7. **"accu-chek softclix lancets"**
   - drug_name: "accu-chek softclix lancets"
   - drug_class: "Lancets and Lancing Devices (Manual)"

8. **"vitamin D3 (cholecalciferol) supplement 1000 IU"**
   - drug_name: "vitamin D3 (cholecalciferol)"
   - drug_class: "Fat-Soluble Vitamins (Vitamin D)"

9. **"omega-3 fish oil softgels"**
   - drug_name: "omega-3 fish oil softgels"
   - drug_class: "Omega-3 Fatty Acids (Fish Oil Supplements)"

10. **"influenza vaccine"**
    - drug_name: "influenza vaccine"
    - drug_class: "Inactivated Influenza Vaccines"
    *(Assuming the default type is inactivated; if further details are provided, adjust accordingly.)*

### Final Output Format:
Return the result as a JSON object in the following format:
{
  "drug_name": "<primary name>",
  "drug_class": "<most precise class (include subtype, mechanism, and for devices, the operation mode)>"
}
Ensure that the output always includes the most precise and detailed drug class, avoiding any broad or generic classifications.`,
    },
    IDENTITY_AI: {
        stage: "Drug Name & Class Identification",
        eyebrow: "02 · Drug Name & Class Identification · AI reasoning",
        title: "Read the Drug Name and Class",
        definition: "A GPT-4o translation step that reads one pharmacy free-text entry and returns a normalized drug name plus a precise therapeutic class in validated JSON.",
        sections: [
            {
                title: "One entry in, two fields out",
                facts: [
                    {
                        label: "Input",
                        value: "(Pres360) insulin aspart (NOVOLOG PENFILL) BRAND ONLY DAW 100 unit/mL crtg",
                    },
                    { label: "drug_name", value: "insulin aspart (novolog penfill)" },
                    { label: "drug_class", value: "insulins (rapid-acting insulin analogues)" },
                ],
                note: "The plan instruction, coverage flag, form, and strength do not become part of the normalized drug name.",
            },
            {
                title: "How the model is constrained",
                table: {
                    columns: ["Constraint", "What it controls"],
                    rows: [
                        ["Temperature 0", "Reduces creative variation"],
                        ["Reading rules", "Require precise names and classes"],
                        ["JSON parser", "Rejects responses that break the output contract"],
                        ["10-call limit", "Caps simultaneous model requests"],
                        ["3-second pause", "Reduces pressure on API rate limits"],
                        ["Lowercase output", "Keeps saved values consistent"],
                    ],
                },
            },
            {
                title: "How one item is processed",
                steps: [
                    "Insert the raw drug entry into the approved reading prompt.",
                    "Send the prompt to Azure OpenAI GPT-4o.",
                    "Parse the reply as a JSON object with drug_name and drug_class.",
                    "Normalize both values to lowercase.",
                    "Save the structured result for the next stage.",
                ],
            },
            {
                title: "Failure and restart behavior",
                facts: [
                    {
                        label: "Bad response",
                        value: "Log the item and error separately while other items continue",
                    },
                    {
                        label: "Saved result",
                        value: "Can be loaded instead of calling the model again when restart is disabled",
                    },
                ],
            },
            {
                title: "Pipeline handoff",
                facts: [
                    { label: "Before", value: "One unstructured pharmacy string" },
                    { label: "This step", value: "Read and validate the name and class" },
                    { label: "Next", value: "Group dose and form variants of the same drug" },
                ],
            },
        ],
        insightLabel: "Why this stage matters",
        insight: "Every later match depends on this identity. The model handles varied pharmacy language, while the prompt, JSON parser, and runtime limits keep the result narrow and reviewable.",
    },
    CONSOLIDATE: {
        stage: "Group by Drug Name and Class",
        eyebrow: "03 · Group by Drug Name and Class · Deterministic process",
        title: "Merge the Same Drug's Doses",
        definition: "A deterministic grouping step that combines every dose and form of the same drug into one record while preserving the original variants.",
        sections: [
            {
                title: "Why grouping is needed",
                body: "The reading stage still produces one row per product. These two real insulin aspart entries describe the same clinical drug but arrive as separate rows:",
                table: {
                    columns: ["Original entry", "Shared identity"],
                    rows: [
                        [
                            "insulin aspart Non-Brand DAW injection 100 unit/ml crtg",
                            "insulin aspart · rapid-acting insulin analogs",
                        ],
                        [
                            "PHP All- insulin aspart U-100 100 unit/mL (3 mL) SubQ injection PEN",
                            "insulin aspart · rapid-acting insulin analogs",
                        ],
                    ],
                },
            },
            {
                title: "The exact grouping rule",
                facts: [
                    { label: "Group by", value: "Normalized drug name + therapeutic class" },
                    { label: "Collect", value: "Every original product line into one variants list" },
                    { label: "Assign", value: "One preferred_row_id to the surviving group" },
                ],
                note: "Both the name and class must match. A shared drug name alone is not enough.",
            },
            {
                title: "The grouped insulin record",
                facts: [
                    { label: "Row ID", value: "322" },
                    { label: "Drug", value: "insulin aspart" },
                    { label: "Class", value: "rapid-acting insulin analogs" },
                    {
                        label: "Variants",
                        value: "Non-Brand cartridge 100 unit/mL · PHP All insulin aspart U-100 injection pen 100 unit/mL",
                    },
                ],
            },
            {
                title: "Why class stays in the key",
                body: "The same drug name can represent different therapeutic uses. Keeping the class in the grouping key prevents clinically distinct records from being blended together.",
            },
            {
                title: "Dataset impact",
                facts: [
                    { label: "Before", value: "1,348 product rows" },
                    { label: "After", value: "720 drug and class records" },
                    { label: "Reduced", value: "628 repeated rows consolidated" },
                ],
                note: "The formulary matcher now works once per drug record instead of once per dose or form.",
            },
            {
                title: "Safety check",
                body: "Before grouping starts, the step verifies that the original drug entry, normalized name, and therapeutic class are all present. Missing columns stop the step with a clear error.",
            },
        ],
        insightLabel: "What this changes",
        insight: "The pipeline's unit of work changes from an individual dose to a clinically defined drug record. This reduces repeated matching while keeping every original variant traceable.",
    },
    CANONICAL_SET: {
        stage: "Group by Drug Name and Class",
        eyebrow: "03 · Group by Drug Name and Class · Phase boundary",
        title: "One Row Per Drug",
        definition: "The pipeline's normalized middle checkpoint: 720 rows, with one row for each drug and therapeutic class combination.",
        sections: [
            {
                title: "Why this is a data contract",
                body: "Identity processing promises to produce the same four fields for every group. Retrieval can consume those fields without knowing how the source text was interpreted or grouped.",
            },
            {
                title: "The four-field contract",
                table: {
                    columns: ["Field", "What it guarantees"],
                    rows: [
                        ["preferred_row_id", "A unique join key within this generated snapshot"],
                        ["preferred_primary_drug_name", "One normalized, lowercase drug name"],
                        ["preferred_drug_class", "The precise class paired with that name"],
                        ["preferred_drug_variants", "Every original dose and form in one list"],
                    ],
                },
            },
            {
                title: "Three real drug records",
                table: {
                    columns: ["ID", "Drug and class", "Grouped variants"],
                    widths: ["12%", "38%", "50%"],
                    rows: [
                        [
                            "322",
                            "insulin aspart · rapid-acting insulin analogs",
                            "2 variants: cartridge and injection pen, both 100 unit/mL",
                        ],
                        [
                            "8",
                            "acetaminophen (tylenol) · non-opioid analgesics",
                            "3 variants: liquid 160 mg/5mL and tablets 325 mg and 500 mg",
                        ],
                        [
                            "12",
                            "adderall · CNS stimulants (amphetamine derivatives)",
                            "7 tablet strengths: 5, 7.5, 10, 12.5, 15, 20, and 30 mg",
                        ],
                    ],
                },
            },
            {
                title: "How retrieval uses each row",
                steps: [
                    "Read records in controlled batches of 50.",
                    "Build a search query from the normalized drug name and class.",
                    "Retrieve plan-specific candidate drugs.",
                    "Filter candidates down to true matches.",
                    "Join the matched formulary references back through preferred_row_id.",
                ],
                note: "Variants travel with the row for traceability and review. The matcher uses the normalized identity rather than each individual dose.",
            },
            {
                title: "Stored-list quirk",
                body: "The variants list is stored as text that looks like a Python list. A downstream consumer must safely convert that text back into a list before iterating over the variants.",
            },
            {
                title: "About the row ID",
                body: "The row ID is reliable for joining records within this generated snapshot. If the source data changes and the dataset is regenerated, group positions can change, so the ID should not be treated as a permanent cross-version identifier.",
            },
        ],
        insightLabel: "The boundary it creates",
        insight: "Everything before this checkpoint defines drug identity. Everything after it searches and validates plan coverage. The four-field contract keeps those responsibilities separate.",
    },
    RETRIEVAL_GATEWAY: {
        stage: "Semantic Search by Drug Name and Class",
        eyebrow: "04 · Semantic Search by Drug Name and Class · Service boundary",
        title: "Search All 7 Insurance Plans",
        definition: "A fan-out search service that turns one normalized drug identity into a single, plan-labeled candidate list from seven insurance formularies.",
        sections: [
            {
                title: "One identity becomes seven searches",
                facts: [
                    { label: "Drug", value: "insulin aspart" },
                    { label: "Therapeutic class", value: "rapid-acting insulin analogs" },
                    {
                        label: "Search query",
                        value: "Drug: insulin aspart | Therapeutic Class: rapid-acting insulin analogs",
                    },
                ],
                note: "The same authenticated query is sent to every plan-specific formulary.",
            },
            {
                title: "The seven insurance plans",
                table: {
                    columns: ["Plan ID", "Insurance plan"],
                    widths: ["25%", "75%"],
                    rows: [
                        ["23379", "PHP Medicare"],
                        ["24769", "PHP Medicaid"],
                        ["23514", "PHP Exchange Metal Level"],
                        ["24770", "PHP Commercial"],
                        ["24771", "PHP Commercial FEHB"],
                        ["23515", "PHP Clear Metal Level"],
                        ["24772", "PHP Intel Connected Care"],
                    ],
                },
            },
            {
                title: "How the fan-out runs",
                steps: [
                    "Build one search query from the normalized name and therapeutic class.",
                    "Schedule all seven plan searches, with up to five requests running at once.",
                    "Authenticate every request with the service token.",
                    "Attach the source plan to every result and merge the responses into one list.",
                ],
            },
            {
                title: "What each candidate carries",
                table: {
                    columns: ["Field", "Why it matters"],
                    widths: ["38%", "62%"],
                    rows: [
                        ["Plan name", "Shows which insurance formulary returned it"],
                        ["Formulary row ID", "References the exact plan record"],
                        ["Drug description", "Gives the next stages evidence to inspect"],
                        ["Similarity score", "Shows how closely the record matched the query"],
                    ],
                },
            },
            {
                title: "If a plan is slow or unavailable",
                facts: [
                    { label: "Timeout", value: "30 seconds per request" },
                    { label: "Retry policy", value: "Up to 3 attempts, 5 seconds apart" },
                    { label: "Rate protection", value: "0.2-second pause before each call" },
                ],
                note: "A failed plan returns no candidates while the other plan searches continue. An empty result is allowed and does not stop the pipeline.",
            },
            {
                title: "What this node does not decide",
                body: "These are plausible candidates, not confirmed matches. The next nodes rank the search results and verify that the active ingredient is truly the same drug.",
            },
        ],
        insightLabel: "Boundary guarantee",
        insight: "Downstream receives one combined candidate list, and every candidate still identifies the insurance plan that supplied it.",
    },
    PLAN_INDEXES: {
        stage: "Semantic Search by Drug Name and Class",
        eyebrow: "04 · Semantic Search by Drug Name and Class · Coverage evidence",
        title: "The 7 Plan Drug Databases",
        definition: "Seven plan-scoped drug catalogs that pair fast semantic search with the detailed formulary records used to confirm and update preferred status.",
        sections: [
            {
                title: "Two stores, two responsibilities",
                table: {
                    columns: ["Store", "Responsibility"],
                    widths: ["28%", "72%"],
                    rows: [
                        ["Milvus", "Find similar drug descriptions quickly using vector search"],
                        ["MongoDB", "Keep the complete formulary record and its preferred status"],
                    ],
                },
                note: "Both stores identify the same drug record with formulary_row_id.",
            },
            {
                title: "The same insulin record in Milvus",
                body: "Milvus keeps only the fields needed for semantic retrieval. The full 1,536-number vector is shortened here so the record stays readable.",
                json: `{
  "formulary_row_id": "MCR03212",
  "dense_vector": "[1536 numeric values]",
  "page_content": "Drug: Insulin Aspart | Therapeutic Category: Blood Glucose Regulators | Therapeutic Class: Insulins | Custom Therapeutic Category: Blood Glucose Regulators | Custom Therapeutic Class: Insulins"
}`,
            },
            {
                title: "The same insulin record in MongoDB",
                body: "MongoDB keeps the operational detail a pharmacist or plan workflow needs. These are selected fields from the linked record.",
                json: `{
  "formulary_row_id": "MCR03212",
  "formulary_id": "23379",
  "drug_name": "Insulin Aspart Solution 100 UNIT/ML Injection",
  "strength": 100,
  "strength_uom": "UNIT/ML",
  "route": "Injection",
  "dose_form": "Solution",
  "drug_tier": 3,
  "therapeutic_class": "Insulins",
  "pa_required": 0,
  "quantity_limit": "50 ML per 30 days",
  "ndc": "50090495500",
  "rxcui": "311040",
  "preferred_drug": true
}`,
            },
            {
                title: "Catalog scale",
                table: {
                    columns: ["Plan formulary", "Records"],
                    widths: ["73%", "27%"],
                    rows: [
                        ["PHP Medicare", "4,579"],
                        ["PHP Medicaid", "5,282"],
                        ["PHP Exchange Metal Level", "5,901"],
                        ["PHP Commercial", "5,220"],
                        ["PHP Commercial FEHB", "5,214"],
                        ["PHP Clear Metal Level", "5,893"],
                        ["PHP Intel Connected Care", "5,218"],
                        ["Total", "37,307"],
                    ],
                },
            },
            {
                title: "How a record moves through the stores",
                steps: [
                    "Search the Milvus summary and vector for clinically similar records.",
                    "Return the shared formulary row ID with the candidate.",
                    "Use that ID to locate the complete MongoDB record.",
                    "Only a later confirmed match can set preferred_drug to true.",
                ],
            },
            {
                title: "Why seven catalogs cover thousands of plans",
                facts: [
                    { label: "Plan mappings", value: "3,894" },
                    { label: "Formularies", value: "7" },
                ],
                body: "Many insurance products share the same formulary. Each plan mapping points to one of these seven catalogs, so the search does not need thousands of separate indexes.",
            },
            {
                title: "Candidate does not mean confirmed",
                body: "A record is eligible evidence because it already exists inside a supported plan catalog. Retrieval only proposes it. The later clinical check decides whether it is a true active-ingredient match.",
            },
        ],
        insightLabel: "Why the paired design works",
        insight: "Milvus stays small and fast for discovery. MongoDB keeps the richer truth needed for review and updates. The shared record ID connects them without duplicating every field in the search index.",
    },
    CANDIDATE_RANKER: {
        stage: "Semantic Search by Drug Name and Class",
        eyebrow: "04 · Semantic Search by Drug Name and Class · Deterministic filter",
        title: "Keep the Closest Matches",
        definition: "A rule-based filter that keeps the three strongest similarity-score tiers from each plan before any language model reviews the candidates.",
        sections: [
            {
                title: "Filter input",
                body: "The filter receives one plan's ranked search results and the number of distinct score tiers to retain.",
                json: `{
  "plan": "PHP Medicare",
  "query": "Drug: insulin aspart | Therapeutic Class: rapid-acting insulin analogs",
  "k": 3,
  "hits": [
    { "drug": "Insulin Aspart vial 100 UNIT/ML", "similarity_score": 0.94 },
    { "drug": "Insulin Aspart FlexPen 100 UNIT/ML", "similarity_score": 0.94 },
    { "drug": "Insulin Aspart cartridge 100 UNIT/ML", "similarity_score": 0.91 },
    { "drug": "NovoLog FlexPen 100 UNIT/ML", "similarity_score": 0.88 },
    { "drug": "Insulin Lispro 100 UNIT/ML", "similarity_score": 0.86 }
  ]
}`,
                note: "Drug variants and similarity values in this worked example are illustrative.",
            },
            {
                title: "The exact rule",
                steps: [
                    "Collect every distinct similarity score returned for one plan.",
                    "Sort those scores from highest to lowest.",
                    "Select the first three score tiers.",
                    "Keep every record whose score belongs to a selected tier.",
                ],
            },
            {
                title: "Score tiers, not three rows",
                table: {
                    columns: ["Candidate", "Score", "Tier", "Result"],
                    widths: ["49%", "17%", "15%", "19%"],
                    rows: [
                        ["Insulin Aspart vial", "0.94", "1", "Keep"],
                        ["Insulin Aspart FlexPen", "0.94", "1", "Keep"],
                        ["Insulin Aspart cartridge", "0.91", "2", "Keep"],
                        ["NovoLog FlexPen", "0.88", "3", "Keep"],
                        ["Insulin Lispro", "0.86", "4", "Remove"],
                    ],
                },
                note: "Four rows survive because two insulin aspart records share the strongest score. The filter limits score depth without breaking a tie.",
            },
            {
                title: "Filter output",
                body: "Each survivor keeps the record reference, source plan, readable description, and score needed by the clinical matching stage.",
                json: `{
  "formulary_plan_name": "PHP Medicare",
  "formulary_row_id": "MCR03212",
  "description": "Drug: Insulin Aspart | Therapeutic Class: Insulins",
  "similarity_score": 0.94
}`,
                note: "The row ID is real. The similarity score is illustrative.",
            },
            {
                title: "Why ties are kept",
                body: "Different strengths or delivery forms can receive the same score. Keeping every tied row can preserve a useful group of related options for the next stage instead of selecting one arbitrarily.",
            },
            {
                title: "One tunable control",
                facts: [
                    { label: "Live value", value: "K = 3 score tiers" },
                    { label: "Higher K", value: "More recall, more model context" },
                    { label: "Lower K", value: "Lower cost, greater risk of missing a match" },
                ],
            },
            {
                title: "Predictable edge cases",
                items: [
                    "An empty search result produces an empty filtered result.",
                    "Every record tied within a selected tier passes, even when a tier is large.",
                    "The filter trusts the similarity scores returned by the vector service.",
                ],
            },
        ],
        insightLabel: "Why this checkpoint matters",
        insight: "This step is deterministic, cheap, and explainable. It reduces the evidence table before model review without deciding whether any candidate is clinically equivalent.",
    },
    EVIDENCE_CONTEXT: {
        stage: "Semantic Search by Drug Name and Class",
        eyebrow: "04 · Semantic Search by Drug Name and Class · Grounding boundary",
        title: "Show the Model Only These Candidates",
        definition: "A structured evidence packet that turns filtered results from all seven plans into the only candidate list the model is allowed to judge.",
        sections: [
            {
                title: "Packet input",
                body: "The preferred drug identity travels with the filtered candidates. This abbreviated example uses real formulary row IDs and illustrative similarity scores.",
                json: `{
  "preferred_drug_name": "insulin aspart",
  "preferred_drug_class": "rapid-acting insulin analogs",
  "candidates": [
    {
      "formulary_plan_name": "PHP Medicare",
      "formulary_row_id": "MCR03212",
      "description": "Drug: Insulin Aspart | Therapeutic Class: Insulins",
      "similarity_score": 0.94
    },
    {
      "formulary_plan_name": "PHP Medicaid",
      "formulary_row_id": "MCD03370",
      "description": "Drug: Insulin Aspart | Therapeutic Class: Human Insulin",
      "similarity_score": 0.92
    },
    {
      "formulary_plan_name": "PHP Commercial",
      "formulary_row_id": "COM03411",
      "description": "Drug: Insulin Aspart | Therapeutic Class: Human Insulin",
      "similarity_score": 0.92
    }
  ]
}`,
            },
            {
                title: "Four columns become the evidence table",
                table: {
                    columns: ["Column", "What it gives the model"],
                    widths: ["38%", "62%"],
                    rows: [
                        ["Plan name", "The insurance plan that supplied the candidate"],
                        ["Formulary row ID", "A traceable reference to the real record"],
                        ["Description", "Drug name and therapeutic classification"],
                        ["Similarity score", "Retrieval relevance from semantic search"],
                    ],
                },
                note: "Vectors, full MongoDB documents, and unrelated catalog records are left out.",
            },
            {
                title: "How the packet is constructed",
                steps: [
                    "Project every survivor into the same four-field shape.",
                    "Render the candidates as a GitHub-style Markdown table.",
                    "Insert that table beside the preferred drug name and class in the judging prompt.",
                    "Send the completed packet to the model for selection.",
                ],
            },
            {
                title: "The closed-universe rule",
                body: "The model may select a drug name from the evidence table or return an empty list. It cannot create a usable candidate outside the packet because code checks every claimed name against the supplied descriptions.",
                facts: [
                    { label: "Model can", value: "Select names already present" },
                    { label: "Model cannot", value: "Add a new formulary record" },
                    { label: "No match", value: "Return []" },
                ],
            },
            {
                title: "Model response contract",
                json: `[
  {
    "formulary_drug_name": "Insulin Aspart"
  }
]`,
                note: "The response contains names only, with no explanation or extra commentary.",
            },
            {
                title: "Validated output",
                body: "Code intersects the selected name with the original packet. The same drug can therefore produce a confirmed record for every plan where that name appeared.",
                json: `[
  {
    "description": "Drug: Insulin Aspart | Therapeutic Class: Insulins",
    "formulary_row_id": "MCR03212",
    "formulary_plan_name": "PHP Medicare"
  },
  {
    "description": "Drug: Insulin Aspart | Therapeutic Class: Human Insulin",
    "formulary_row_id": "MCD03370",
    "formulary_plan_name": "PHP Medicaid"
  },
  {
    "description": "Drug: Insulin Aspart | Therapeutic Class: Human Insulin",
    "formulary_row_id": "COM03411",
    "formulary_plan_name": "PHP Commercial"
  }
]`,
            },
            {
                title: "Why this reduces risk and cost",
                items: [
                    "Invented drug names cannot resolve to a packet row or formulary ID.",
                    "Every accepted match remains traceable to a plan and source record.",
                    "The model reviews a curated table instead of all 37,307 catalog records.",
                    "The exact evidence set can be reconstructed for review.",
                ],
            },
            {
                title: "Edge cases",
                items: [
                    "An empty packet can produce an empty model response and zero matches.",
                    "A large tied score tier can create a larger and more expensive packet.",
                    "Selecting one repeated drug name returns every packet row carrying that exact name.",
                ],
            },
        ],
        insightLabel: "Evidence boundary",
        insight: "The model can choose from retrieved evidence, but it cannot extend that evidence. Final records are produced by an explicit intersection with the original packet.",
    },
    MATCH_POLICY: {
        stage: "Verify by Active Ingredient",
        eyebrow: "05 · Verify by Active Ingredient · Clinical policy",
        title: 'Rules for "Same Drug"',
        definition: "The clinical rulebook that decides whether a retrieved candidate is the same medication as the preferred drug or only a similar-looking alternative.",
        sections: [
            {
                title: "Decision input",
                body: "The rulebook compares the preferred identity with one candidate from the closed evidence packet.",
                json: `{
  "preferred_drug_name": "insulin aspart",
  "preferred_drug_class": "rapid-acting insulin analogs",
  "candidate": {
    "formulary_drug_name": "Insulin Aspart",
    "description": "Drug: Insulin Aspart | Therapeutic Class: Insulins"
  }
}`,
            },
            {
                title: "First choose the correct rule path",
                table: {
                    columns: ["Candidate type", "How it is judged"],
                    widths: ["34%", "66%"],
                    rows: [
                        ["Medication", "Compare active ingredient, brand, salt, formulation, and class"],
                        ["Device", "Compare purpose, route, specifications, and brand compatibility"],
                    ],
                },
                note: "A device is evaluated by function, not by active ingredient.",
            },
            {
                title: "Medication rules in order",
                steps: [
                    "Require the same active ingredient. Reject a different molecule even when it belongs to the same class.",
                    "Resolve compatible salt forms and brand names to the underlying molecule.",
                    "Include immediate-release, extended-release, liquid, tablet, and other formulations when the ingredient matches.",
                    "Use therapeutic class as a final sanity check. It may reject a contradiction, but it cannot create a match.",
                ],
            },
            {
                title: "Insulin aspart examples",
                table: {
                    columns: ["Candidate", "Reason", "Decision"],
                    widths: ["34%", "46%", "20%"],
                    rows: [
                        ["Insulin Aspart solution", "Exact active ingredient, different formulation is allowed", "Match"],
                        ["NovoLog", "Brand resolves to insulin aspart", "Match"],
                        ["Insulin Lispro", "Similar rapid-acting class, different ingredient", "Reject"],
                        ["Insulin delivery pen", "Device can administer the preferred drug", "Device match"],
                    ],
                },
            },
            {
                title: "Device rules",
                items: [
                    "Confirm that the device supports administration or storage of the preferred drug.",
                    "Check device type, route, physical properties, and manual or continuous operation.",
                    "Use compatible brand naming as supporting evidence.",
                    "Reject a device that cannot physically support the drug or its route.",
                ],
            },
            {
                title: "Strict response contract",
                body: "Return matched medication and device names only. Return an empty array when nothing qualifies, with no explanation or comments.",
                json: `[
  {
    "formulary_drug_name": "Insulin Aspart"
  }
]`,
            },
            {
                title: "Precision comes first",
                body: "The policy prefers missing an unusually named true match over accepting a different molecule. A missed candidate can be reviewed later, while a false match could set the wrong formulary record as preferred.",
            },
        ],
        prompt: `**PHARMACOLOGICAL & DEVICE MATCHING PROTOCOL**
1. **Categorization Phase**
    Classify each entry as either:
        - **Drug/Medication**: If 'Drug: ' field contains chemical/generic name
        - **Device**: If 'Drug: ' field describes equipment (e.g., "Diskhaler", "Lancing Device")

2. **Drug Processing**
    a. **Active Ingredient Supremacy**
        - Eliminate drugs NOT containing **EXACT ACTIVE INGREDIENT** of {preferred_drug_name}
            IMPORTANT: **Reject same-class drugs with different active ingredients**
        - Match salt forms (e.g., "X Phosphate" ↔ "X")
        - Brand names MUST be resolved to their generic equivalents using standard pharmacological references. Example: 'Bydureon' → exenatide, 'Byetta' → exenatide
        - Match ALL brand variants of the active ingredient (e.g., 'Bydureon BCise' = exenatide).

    b. **Formulation Handling**
        - Include ALL formulations (IR/XR/etc.) of matched active ingredient
        - Example: "Oseltamivir Suspension" matches "Oseltamivir"

    c. **Class Validation**
        - Confirm remaining drugs belong to {preferred_drug_class}
        - Class matching is SECONDARY to active ingredient matching. Only reject drugs if class explicitly contradicts the preferred drug's class.

3. **Device Processing**
    a. **Functional Compatibility**
        - Match devices supporting administration/storage of {preferred_drug_name}
        - Examples:
            - Insulin pens ↔ Insulin
            - Spacers ↔ Inhalers
        - Devices containing the preferred drug's BRAND NAME in their title are automatically compatible (e.g., 'Bydureon Pen-Injector' supports exenatide)

    b. **Specification Matching**
        - Compare:
            * Device type (needle gauge, inhaler type)
            * Continous vs. manual devices
            * Brand compatibility
        - Assume compatibility for devices sharing naming conventions with matched drugs (e.g., 'Bydureon BCise Auto-injector' matches exenatide)

    c. **Exclusions**
        - Reject devices incompatible with {preferred_drug_name}'s:
            * Administration route
            * Physical properties

4. **Final Output Rules**
    - Return **BOTH** matched drugs AND devices
    - Format:
        \`\`\`json
        [{{"formulary_drug_name": "EXACT_DRUG_OR_DEVICE_NAME"}}]
        \`\`\`
    - If no matches, return empty array: \`[]\`
    - **DO NOT INCLUDE ANY EXPLANATORY TEXT OR COMMENTS IN THE RESPONSE.**

FORMULARY ENTRIES
{top_formulary_drugs_markdown_table}`,
        insightLabel: "Decision hierarchy",
        insight: "Exact ingredient identity has the highest authority. Brand, salt, and formulation rules normalize valid variations. Therapeutic class can veto a contradiction but never substitute for the right molecule.",
    },
    MATCH_AI: {
        stage: "Verify by Active Ingredient",
        eyebrow: "05 · Verify by Active Ingredient · AI reasoning",
        title: "Decide Which Are the Same Drug",
        definition: "The only stage where the model reasons clinically: GPT-4o applies the same-drug rulebook to one preferred drug and its closed candidate packet.",
        sections: [
            {
                title: "Input to one judgment",
                json: `{
  "preferred_row_id": 322,
  "preferred_drug_name": "insulin aspart",
  "preferred_drug_class": "rapid-acting insulin analogs",
  "matching_policy": "Pharmacological & Device Matching Protocol",
  "evidence_packet": "4-column Markdown candidate table"
}`,
                note: "One condensed drug record produces one model judgment, not one judgment per dose.",
            },
            {
                title: "From evidence to trusted record IDs",
                steps: [
                    "Provide the closed candidate table and clinical rulebook.",
                    "Ask GPT-4o at temperature 0 to judge ingredient equivalence.",
                    "Accept only a parseable JSON list of claimed drug names.",
                    "Hand the claims to deterministic code for intersection with the packet.",
                    "Return the verified formulary row IDs for this preferred drug.",
                ],
            },
            {
                title: "Model judgment versus code verification",
                table: {
                    columns: ["Owner", "Responsibility"],
                    widths: ["28%", "72%"],
                    rows: [
                        ["GPT-4o", "Resolve ingredient, brand, salt, formulation, class, and device nuance"],
                        ["JSON parser", "Reject malformed model responses before they are accepted"],
                        ["Safety code", "Map claimed names back to packet records and recover plan IDs"],
                    ],
                },
                note: "The model proposes names. It never creates or returns trusted formulary row IDs.",
            },
            {
                title: "Model proposal",
                json: `[
  {
    "formulary_drug_name": "Insulin Aspart"
  }
]`,
            },
            {
                title: "Verified result for the drug row",
                body: "When the selected name appears in several plan rows, code can recover every matching record from the packet.",
                json: `{
  "preferred_row_id": 322,
  "formulary_row_ids": [
    "MCR03212",
    "MCD03370",
    "COM03411"
  ],
  "status": "success"
}`,
                note: "The row IDs are real. This three-plan result is illustrative of the packet shown in the preceding node.",
            },
            {
                title: "Reliability around the model",
                table: {
                    columns: ["Control", "Behavior"],
                    widths: ["32%", "68%"],
                    rows: [
                        ["Temperature", "0 for constrained, lower-variability behavior"],
                        ["JSON gate", "Parse every response before accepting it"],
                        ["Retries", "Up to 5 attempts for call or JSON failures"],
                        ["Backoff", "About 1, 2, 4, and 8 seconds, plus small random jitter"],
                        ["Failure isolation", "Record the failed drug separately without crashing the batch"],
                    ],
                },
            },
            {
                title: "How the full run is controlled",
                facts: [
                    { label: "Work unit", value: "About 720 drug records" },
                    { label: "Chunk size", value: "50 records" },
                    { label: "Parallelism", value: "5 row judgments at once" },
                    { label: "Call pacing", value: "3 seconds before each model call" },
                    { label: "Checkpoint", value: "Save every processed chunk" },
                ],
            },
            {
                title: "Normal and exceptional outcomes",
                items: [
                    "No clinical match produces an empty row-ID list and remains a valid result.",
                    "One selected name can resolve to several plan records.",
                    "Malformed or empty model output is retried, then recorded as a failure if unresolved.",
                    "A claimed name outside the packet produces no verified record.",
                ],
            },
        ],
        insightLabel: "The judgment boundary",
        insight: "AI handles clinical naming ambiguity. Deterministic code handles trust, provenance, and record recovery. A model opinion alone can never update the formulary.",
    },
    CANDIDATE_GUARD: {
        stage: "Verify by Active Ingredient",
        eyebrow: "05 · Verify by Active Ingredient · Safety control",
        title: "Block Anything Not Actually Covered",
        definition: "A chain of checks that turns model-proposed names into verified formulary row IDs and blocks anything that cannot be traced to retrieved plan evidence.",
        sections: [
            {
                title: "The five-gate path",
                table: {
                    columns: ["Gate", "Required proof", "Owner"],
                    widths: ["14%", "58%", "28%"],
                    rows: [
                        ["1", "The record exists in a supported plan catalog", "Retrieval"],
                        ["2", "The record entered the closed evidence packet", "Packet builder"],
                        ["3", "The model claimed its name and code found that name in the packet", "Safety control"],
                        ["4", "The row judgment completed successfully", "Batch processor"],
                        ["5", "The verified ID is included in the later database update", "Status sync"],
                    ],
                },
                note: "Failure or absence in Gates 1 through 4 produces no verified row ID.",
            },
            {
                title: "Guard input",
                body: "The model's claims are checked against the exact candidates that appeared in its evidence packet.",
                json: `{
  "model_claims": [
    { "formulary_drug_name": "Insulin Aspart" },
    { "formulary_drug_name": "Insulin Glargine" }
  ],
  "packet_entries": [
    {
      "drug_name": "Insulin Aspart",
      "formulary_row_id": "MCR03212",
      "formulary_plan_name": "PHP Medicare"
    },
    {
      "drug_name": "Insulin Aspart",
      "formulary_row_id": "MCD03370",
      "formulary_plan_name": "PHP Medicaid"
    }
  ]
}`,
                note: "Insulin Glargine is an illustrative unsupported claim. It is absent from this packet.",
            },
            {
                title: "The decisive intersection",
                steps: [
                    "Read each candidate name from the packet description.",
                    "Compare that name with the model's claimed names.",
                    "Keep the packet record only when the names match exactly.",
                    "Carry forward the existing row ID and plan name from that packet record.",
                ],
            },
            {
                title: "Guard output",
                body: "The supported insulin aspart claim resolves to real records. The unsupported insulin glargine claim disappears because it has no packet entry.",
                json: `[
  {
    "description": "Drug: Insulin Aspart | Therapeutic Class: Insulins",
    "formulary_row_id": "MCR03212",
    "formulary_plan_name": "PHP Medicare"
  },
  {
    "description": "Drug: Insulin Aspart | Therapeutic Class: Human Insulin",
    "formulary_row_id": "MCD03370",
    "formulary_plan_name": "PHP Medicaid"
  }
]`,
            },
            {
                title: "What blocked outcomes look like",
                table: {
                    columns: ["Situation", "Result"],
                    widths: ["52%", "48%"],
                    rows: [
                        ["Claimed name is not in the packet", "No matching row ID"],
                        ["Packet contains a candidate the model did not claim", "Candidate is omitted"],
                        ["No clinical match exists", "Successful row with an empty ID list"],
                        ["Model call or JSON fails after retries", "Failed row with no update IDs"],
                    ],
                },
            },
            {
                title: "Failed judgment output",
                json: `{
  "preferred_row_id": 322,
  "formulary_row_ids": null,
  "status": "failed",
  "error_message": "Model response remained invalid after retries"
}`,
                note: "The error text is simplified for presentation. Failed rows are separated for follow-up.",
            },
            {
                title: "Later reset and mark pass",
                facts: [
                    { label: "Reset", value: "Set catalog flags to false in batches of 100" },
                    { label: "Workers", value: "4 reset batches can run concurrently" },
                    { label: "Mark", value: "Deduplicate verified IDs, then set true in batches of 100" },
                    { label: "DB retry", value: "Up to 3 attempts with 4 to 10 second backoff" },
                ],
                body: "Resetting first prevents an older successful run from intentionally carrying its preferred set into the new run.",
            },
            {
                title: "Current implementation limit",
                body: "The MongoDB reset and mark operations are batched but not transactional. If a batch still fails after retries, the error is logged and processing continues. A failed reset batch could leave stale true flags, while a failed mark batch could leave verified records false.",
                note: "The packet intersection is a hard guard on emitted row IDs. Atomic database state would require a transaction, run-level staging, or a final reconciliation check.",
            },
            {
                title: "Human-readable follow-up",
                body: "A later review file pairs each preferred drug with the formulary products that were found. This makes conservative misses visible without weakening the automated guard.",
            },
        ],
        insightLabel: "Hard local invariant",
        insight: "Every row ID emitted by this guard came from the original evidence packet. The model may propose a name, but only deterministic code can recover the plan record that moves forward.",
    },
    NAME_RESOLUTION: {
        stage: "Preferred Status Sync",
        eyebrow: "06 · Preferred Status Sync · Name resolution",
        title: "Look Up Real Drug Names",
        definition: "A name-resolution pass that looks up every verified formulary row ID in MongoDB and turns machine references into drug names a reviewer can inspect.",
        sections: [
            {
                title: "Resolution input",
                body: "The matched drug row carries its preferred identity, original variants, and the verified formulary IDs recovered from the evidence packet.",
                json: `{
  "preferred_primary_drug_name": "insulin aspart",
  "preferred_drug_class": "rapid-acting insulin analogs",
  "preferred_drug_variants": [
    "insulin aspart cartridge 100 unit/mL"
  ],
  "formulary_row_ids": [
    "MCR03212"
  ]
}`,
            },
            {
                title: "The MongoDB lookup",
                body: "Each ID is queried independently. Only the human-readable drug name is requested from the larger formulary document.",
                json: `{
  "filter": {
    "formulary_row_id": "MCR03212"
  },
  "projection": {
    "drug_name": 1,
    "_id": 0
  }
}`,
            },
            {
                title: "Lookup response",
                json: `{
  "drug_name": "Insulin Aspart Solution 100 UNIT/ML Injection"
}`,
                note: "This is the current record stored for MCR03212 in the local MongoDB snapshot.",
            },
            {
                title: "How the review row is assembled",
                steps: [
                    "Resolve the row's formulary IDs concurrently.",
                    "Drop lookup results that returned no MongoDB record.",
                    "Deduplicate repeated drug names.",
                    "Prefix resolved formulary products with ▶.",
                    "Prefix original preferred-drug variants with •.",
                ],
            },
            {
                title: "Human-readable result",
                body: "The two bullet styles let a reviewer compare the original plan wording with the real covered product that the pipeline matched.",
                json: `{
  "preferred_primary_drug_name": "insulin aspart",
  "preferred_drug_class": "rapid-acting insulin analogs",
  "preferred_drug_variants": "• insulin aspart cartridge 100 unit/mL",
  "formulary_row_ids": ["MCR03212"],
  "formulary_drugs_found_to_preferred": "▶ Insulin Aspart Solution 100 UNIT/ML Injection"
}`,
            },
            {
                title: "How to read the markers",
                table: {
                    columns: ["Marker", "Meaning", "Example"],
                    widths: ["16%", "38%", "46%"],
                    rows: [
                        ["•", "Original preferred-list variant", "insulin aspart cartridge 100 unit/mL"],
                        ["▶", "Resolved covered formulary product", "Insulin Aspart Solution 100 UNIT/ML Injection"],
                    ],
                },
            },
            {
                title: "Six-column review contract",
                table: {
                    columns: ["Field", "Reviewer purpose"],
                    widths: ["48%", "52%"],
                    rows: [
                        ["preferred_row_id", "Connects the row to the condensed snapshot"],
                        ["preferred_primary_drug_name", "Shows the normalized preferred identity"],
                        ["preferred_drug_class", "Shows its therapeutic classification"],
                        ["preferred_drug_variants", "Lists the original source descriptions"],
                        ["formulary_row_ids", "Preserves the machine references used for updates"],
                        ["formulary_drugs_found_to_preferred", "Lists the resolved names for review"],
                    ],
                },
            },
            {
                title: "Conservative behavior and limitations",
                items: [
                    "An unresolved ID is omitted from the name list but remains visible in the row-ID column.",
                    "Duplicate names are removed with a set, so display order is not guaranteed.",
                    "Variant text must be a valid Python-style list when read from CSV; malformed text can fail report generation.",
                    "Nested thread pools resolve rows and their IDs concurrently, improving speed but potentially creating many simultaneous lookups.",
                ],
            },
            {
                title: "Snapshot note",
                facts: [
                    { label: "Current result", value: "723 rows × 6 columns" },
                    { label: "Archived result", value: "720 rows × 6 columns" },
                ],
                body: "Different runs can produce different row counts and record mappings. Formulary row IDs should be interpreted with the dataset version that produced the report, not as permanent identities across snapshots.",
            },
            {
                title: "Relationship to status updates",
                body: "The review report and MongoDB update begin from the same matched ID dataframe. However, missing lookup records and non-transactional update batches mean the report is an inspection companion, not proof that every database write succeeded.",
            },
        ],
        insightLabel: "Why this translation matters",
        insight: "Row IDs make joins and updates possible. Resolved names let a pharmacist compare what the source requested with the exact covered products the pipeline selected.",
    },
    REVIEW_REPORT: {
        stage: "Preferred Status Sync",
        eyebrow: "06 · Preferred Status Sync · Human review",
        title: "Pharmacist Review File",
        definition: "A one-row-per-preferred-drug audit sheet that places the source variants beside the real formulary products selected by the pipeline.",
        sections: [
            {
                title: "The file at a glance",
                facts: [
                    { label: "Current copy", value: "723 rows" },
                    { label: "Archived copy", value: "720 rows" },
                    { label: "Schema", value: "6 columns" },
                    { label: "Review unit", value: "One condensed preferred drug per row" },
                ],
            },
            {
                title: "The six-column evidence story",
                table: {
                    columns: ["Column", "What the reviewer sees"],
                    widths: ["48%", "52%"],
                    rows: [
                        ["preferred_row_id", "Snapshot-specific audit key"],
                        ["preferred_primary_drug_name", "Normalized drug being reviewed"],
                        ["preferred_drug_class", "Expected therapeutic class"],
                        ["preferred_drug_variants", "Original preferred-list doses marked with •"],
                        ["formulary_row_ids", "Matched machine references across plans"],
                        ["formulary_drugs_found_to_preferred", "Resolved products marked with ▶"],
                    ],
                },
            },
            {
                title: "A real insulin aspart row",
                body: "This abbreviated JSON preserves the real row's identity, source wording, four resolved product names, and total number of matched IDs.",
                json: `{
  "preferred_row_id": 320,
  "preferred_primary_drug_name": "insulin aspart",
  "preferred_drug_class": "rapid-acting insulins",
  "preferred_drug_variants": [
    "• PHP All- insulin aspart U-100 100 unit/mL (3 mL) SubQ injection PEN"
  ],
  "formulary_row_id_count": 26,
  "formulary_row_ids_sample": [
    "MCR03500",
    "MCD03322",
    "COM03369",
    "CFH03360"
  ],
  "formulary_drugs_found_to_preferred": [
    "▶ Insulin Aspart PenFill Solution Cartridge 100 UNIT/ML Subcutaneous",
    "▶ Insulin Aspart Solution 100 UNIT/ML Subcutaneous",
    "▶ Insulin Aspart FlexPen Solution Pen-Injector 100 UNIT/ML Subcutaneous",
    "▶ Insulin Aspart Solution 100 UNIT/ML Injection"
  ]
}`,
                note: "The record comes from the current 723-row result snapshot.",
            },
            {
                title: "The visual review language",
                table: {
                    columns: ["Marker", "Meaning", "Reviewer question"],
                    widths: ["15%", "34%", "51%"],
                    rows: [
                        ["•", "What the preferred list requested", "What identity and variants did we start with?"],
                        ["▶", "What the matcher found", "Is this truly the same drug or compatible device?"],
                    ],
                },
            },
            {
                title: "Four checks for every row",
                steps: [
                    "Ingredient: confirm every ▶ product has the same active ingredient as the • source drug.",
                    "Formulation: inspect whether important strengths or delivery forms appear to be missing.",
                    "Plan spread: use row-ID prefixes as a clue to which plan catalogs supplied matches.",
                    "Resolution gap: investigate any row ID that has no corresponding readable product name.",
                ],
                note: "Plan prefixes are inferred from the dataset. The report does not provide a separate plan-name column.",
            },
            {
                title: "A real issue the file exposes",
                body: "The current Accu-Chek Aviva glucose monitoring kit row resolves to a mixed device family, including lancets, a test strip, and device kits. That is not a clean meter-only result and deserves pharmacist review.",
                table: {
                    columns: ["Source request", "Selected examples"],
                    widths: ["38%", "62%"],
                    rows: [
                        ["Accu-Chek Aviva glucose monitoring kit", "Accu-Chek Multiclix Lancets"],
                        ["Same source row", "Accu-Chek Aviva Plus Strip In Vitro"],
                        ["Same source row", "Accu-Chek Guide Kit w/Device"],
                    ],
                },
                note: "The report records what the run decided. It does not sanitize questionable matches.",
            },
            {
                title: "What the report does not show",
                items: [
                    "Similarity scores or confidence levels",
                    "Explicit plan names beside each match",
                    "Per-plan duplicates after readable names are deduplicated",
                    "A reliable failure summary for judgments that never produced an ID list",
                ],
            },
            {
                title: "Important workflow reality",
                body: "The script writes this report and then immediately starts the MongoDB status update. It does not pause for pharmacist approval. A true preproduction approval gate must be added to orchestration or performed by stopping the workflow between those steps.",
            },
            {
                title: "Known report limitations",
                items: [
                    "Missing MongoDB records disappear from the readable-name list while their IDs remain visible.",
                    "A set removes duplicate names, so the displayed name order is not guaranteed.",
                    "Failed match rows can contain a missing ID list that the formatter does not safely handle.",
                    "Different snapshots can contain different row counts and record mappings.",
                ],
            },
        ],
        insightLabel: "The review question",
        insight: "For each row, ask whether every ▶ product is truly the same drug or compatible device as the • source entry. The file makes that judgment possible, but human approval is not yet enforced by the pipeline.",
    },
    STATUS_SYNC: {
        stage: "Preferred Status Sync",
        eyebrow: "06 · Preferred Status Sync · State reconciliation",
        title: "Clear Old Flags, Set New Ones",
        definition: "A two-phase state refresh that first clears existing preferred flags, then marks the distinct formulary records verified by the current run.",
        sections: [
            {
                title: "Desired-state input",
                body: "The matched dataframe contains one list of verified formulary row IDs for each preferred drug. Lists may already be parsed or stored as text.",
                json: `{
  "formulary_row_ids_by_drug": [
    ["MCR03212", "MCD03370"],
    "['COM03411', 'MCR03212']",
    "[]"
  ]
}`,
            },
            {
                title: "Normalize and deduplicate",
                steps: [
                    "Keep values that are already lists.",
                    "Parse text that contains a Python-style list.",
                    "Convert an empty list, invalid string, or missing value to no IDs.",
                    "Flatten the lists into one set so every verified ID is marked once.",
                ],
                json: `{
  "distinct_verified_formulary_row_ids": [
    "MCR03212",
    "MCD03370",
    "COM03411"
  ]
}`,
            },
            {
                title: "Phase 1: clear every old flag",
                body: "The collection is paged by MongoDB _id. Each batch uses those internal IDs to set preferred_drug to false, including records that may not have a usable formulary row ID.",
                json: `{
  "filter": {
    "_id": { "$in": ["<100 MongoDB document IDs>"] }
  },
  "update": {
    "$set": { "preferred_drug": false }
  }
}`,
            },
            {
                title: "Phase 2: mark only the verified set",
                body: "The pipeline knows the business key, so each distinct formulary row ID becomes an unordered bulk update that sets the flag to true.",
                json: `[
  {
    "filter": { "formulary_row_id": "MCR03212" },
    "update": { "$set": { "preferred_drug": true } }
  },
  {
    "filter": { "formulary_row_id": "MCD03370" },
    "update": { "$set": { "preferred_drug": true } }
  }
]`,
            },
            {
                title: "Why reset before marking",
                table: {
                    columns: ["Prior state", "Current evidence", "Clean-run result"],
                    widths: ["31%", "34%", "35%"],
                    rows: [
                        ["Old drug = true", "Not verified now", "Reset to false"],
                        ["Insulin aspart = false", "Verified now", "Set to true"],
                        ["Insulin aspart = true", "Verified now", "Remains true after refresh"],
                    ],
                },
                note: "After every write succeeds, the result depends only on the current verified set, not on a previous run.",
            },
            {
                title: "State transition example",
                json: `{
  "before": [
    { "formulary_row_id": "MCR03212", "preferred_drug": false },
    { "formulary_row_id": "STALE_FROM_PRIOR_RUN", "preferred_drug": true }
  ],
  "after_successful_refresh": [
    { "formulary_row_id": "MCR03212", "preferred_drug": true },
    { "formulary_row_id": "STALE_FROM_PRIOR_RUN", "preferred_drug": false }
  ]
}`,
                note: "The stale record name is illustrative. The insulin aspart row ID is real.",
            },
            {
                title: "Write controls",
                facts: [
                    { label: "Reference size", value: "37,307 documents in the local snapshot" },
                    { label: "Reset batch", value: "100 documents" },
                    { label: "Reset workers", value: "4 concurrent workers" },
                    { label: "Mark batch", value: "100 verified IDs" },
                    { label: "Retries", value: "Up to 3 attempts for MongoDB errors" },
                    { label: "Backoff", value: "Exponential, minimum 4 seconds, maximum 10" },
                ],
            },
            {
                title: "Conditional state invariant",
                body: "When every reset and mark batch succeeds, preferred_drug is true exactly for records whose formulary_row_id belongs to the current verified set. Repeating the same successful refresh produces the same desired state.",
            },
            {
                title: "Current implementation limits",
                items: [
                    "Reset and mark are separate operations with no transaction or run-level staging.",
                    "A batch that still fails after retries is logged, then processing continues.",
                    "A failed reset batch can leave stale true flags; a failed mark batch can leave verified records false.",
                    "The progress bar counts scheduled reset records, not confirmed successful writes.",
                    "Input parsing does not strictly enforce that every surviving ID is a valid string.",
                ],
            },
            {
                title: "Why the two keys differ",
                table: {
                    columns: ["Phase", "Key", "Reason"],
                    widths: ["20%", "31%", "49%"],
                    rows: [
                        ["Reset", "MongoDB _id", "Reach every document in the collection"],
                        ["Mark", "formulary_row_id", "Use the business IDs produced by matching"],
                    ],
                },
                note: "A document with a missing or changed formulary row ID can be reset but cannot be re-marked, which defaults that record to false after a successful reset.",
            },
        ],
        insightLabel: "Commit semantics",
        insight: "Clear-then-set is the right desired-state model because it makes removals explicit. In the current implementation, exact reconciliation is an outcome of a fully successful run, not an atomic guarantee.",
    },
    PRODUCTION_FORMULARY: {
        stage: "Preferred Status Sync",
        eyebrow: "06 · Preferred Status Sync · Production data",
        title: "Live Formulary Database (MongoDB)",
        definition: "The operational reference collection where richly detailed plan formulary records carry the preferred_drug flag produced by this pipeline.",
        sections: [
            {
                title: "Production destination at a glance",
                facts: [
                    { label: "Collection", value: "formulary_intelligence_reference_library" },
                    { label: "Local snapshot", value: "37,307 documents" },
                    { label: "Formularies", value: "7 plan catalogs" },
                    { label: "Plan mappings", value: "3,894 plan products" },
                    { label: "Pipeline write", value: "preferred_drug boolean" },
                ],
            },
            {
                title: "One real insulin aspart document",
                body: "This selected-field view shows the clinical identity, coverage rules, codes, provenance, and current pipeline state stored together for one Medicare record.",
                json: `{
  "formulary_row_id": "MCR03212",
  "formulary_id": "23379",
  "drug_name": "Insulin Aspart Solution 100 UNIT/ML Injection",
  "ingredient_description": "Insulin Aspart",
  "strength": 100,
  "strength_uom": "UNIT/ML",
  "route": "Injection",
  "dose_form": "Solution",
  "therapeutic_class": "Insulins",
  "drug_tier": 3,
  "pa_required": 0,
  "quantity_limit_flag": 1,
  "quantity_max": 50,
  "quantity_time": 30,
  "ndc": "50090495500",
  "rxcui": "311040",
  "status": "active",
  "version": "V1",
  "data_source": "PHP_Medicare",
  "tags": ["formulary_data", "PHP_Medicare"],
  "preferred_drug": true
}`,
                note: "The record and current true flag come from the local MongoDB snapshot.",
            },
            {
                title: "Four kinds of information in each document",
                table: {
                    columns: ["Family", "Examples", "Purpose"],
                    widths: ["22%", "42%", "36%"],
                    rows: [
                        ["Identity", "Drug name, strength, route, dose form", "Identify the covered product"],
                        ["Clinical", "Ingredient and therapeutic class", "Describe what the product is"],
                        ["Coverage", "Tier, prior authorization, quantity limits", "Describe plan rules"],
                        ["Codes", "NDC, RxCUI, GPI, DDI", "Connect external drug standards"],
                        ["State", "preferred_drug, status, version, tags", "Expose operational state"],
                    ],
                },
            },
            {
                title: "How this pipeline accesses the collection",
                table: {
                    columns: ["Operation", "Lookup key", "Fields affected"],
                    widths: ["31%", "31%", "38%"],
                    rows: [
                        ["Resolve a name", "formulary_row_id", "Read drug_name only"],
                        ["Clear old flags", "MongoDB _id", "Write preferred_drug = false"],
                        ["Mark verified records", "formulary_row_id", "Write preferred_drug = true"],
                    ],
                },
                note: "Both name resolution and status synchronization obtain their MongoDB connection from the same DB_CONN configuration value.",
            },
            {
                title: "The flag available to consumers",
                json: `{
  "formulary_id": "23379",
  "formulary_row_id": "MCR03212",
  "drug_name": "Insulin Aspart Solution 100 UNIT/ML Injection",
  "preferred_drug": true
}`,
                note: "This repository makes the flag available in the reference record. The specific downstream APIs and applications that consume it are outside the code shown here.",
            },
            {
                title: "Flag life cycle",
                steps: [
                    "A formulary record exists with its clinical and coverage attributes.",
                    "A pipeline run resets the collection's preferred flags to false.",
                    "Verified formulary row IDs are marked true.",
                    "Later readers can use the resulting boolean alongside the plan record.",
                ],
            },
            {
                title: "Why MongoDB holds the writable truth",
                table: {
                    columns: ["Store", "Optimized for", "What it keeps"],
                    widths: ["22%", "31%", "47%"],
                    rows: [
                        ["Milvus", "Semantic discovery", "Vector, compact description, shared row ID"],
                        ["MongoDB", "Operational reference data", "Rich document fields and writable preferred flag"],
                    ],
                },
                note: "formulary_row_id is the seam between search evidence and the operational record.",
            },
            {
                title: "Provenance present in the document",
                items: [
                    "Source plan tags and data_source",
                    "Record status and version",
                    "Created and updated timestamps from the source snapshot",
                    "Latest effective formulary date",
                    "A previously normalized drug-name field",
                ],
            },
            {
                title: "What the preferred flag does not record",
                items: [
                    "Which pipeline run changed it",
                    "Which preferred-list row justified it",
                    "Which model response selected it",
                    "Whether a pharmacist approved it",
                    "A timestamp written by the preferred-flag update itself",
                ],
                note: "The update changes only preferred_drug. It does not update updated_dt, version, or a dedicated decision-provenance field.",
            },
            {
                title: "Operational limits",
                items: [
                    "The 37,307-document count describes the local snapshot, not a live production count.",
                    "Reset and mark batches are not transactional, so exact state depends on every batch succeeding.",
                    "The code uses formulary_row_id as a business lookup key but does not demonstrate a unique database index for it.",
                    "The local dump is an inspection snapshot and can differ from the live instance configured through DB_CONN.",
                ],
            },
        ],
        insightLabel: "System boundary",
        insight: "This collection is where the pipeline's clinical decision becomes operational state. After a fully successful reconciliation, preferred_drug reflects the current verified set, while the rest of the document preserves the plan's clinical and coverage detail.",
    },
};
const PALETTE = {
    handoff: { color: "#34463e", width: 2.8 },
    internal: { color: "#98a39d", width: 1.25 },
    control: { color: "#7f8794", dash: "5 5", width: 1.35 },
    verified: { color: "#236c54", width: 2.8 },
};
function LaneEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, label, data, }) {
    const lane = (data || {});
    const centerX = sourceX + (targetX - sourceX) * (lane.ratio ?? 0.5);
    const labelX = (sourceX + targetX) / 2;
    const labelY = lane.labelOffsetFromTarget === undefined
        ? (sourceY + targetY) / 2
        : targetY + lane.labelOffsetFromTarget;
    const [path] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        centerX,
        borderRadius: 14,
    });
    return (_jsxs(_Fragment, { children: [_jsx(BaseEdge, { id: id, path: path, markerEnd: markerEnd, style: style }), label ? (_jsx(EdgeLabelRenderer, { children: _jsx("div", { className: "hld-edge-label nodrag nopan", style: {
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                    }, children: label }) })) : null] }));
}
const EDGE_TYPES = { lane: LaneEdge };
function flow(id, source, target, o = {}) {
    const kind = o.kind || "internal";
    const p = PALETTE[kind];
    return {
        id,
        source,
        target,
        sourceHandle: o.sourceHandle || "right",
        targetHandle: o.targetHandle || "left",
        type: o.label ? "lane" : "smoothstep",
        data: o.lane,
        pathOptions: { borderRadius: 14, stepPosition: o.stepPosition },
        ...(o.label ? { label: o.label } : {}),
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 17,
            height: 17,
            color: p.color,
        },
        style: { stroke: p.color, strokeWidth: p.width, strokeDasharray: p.dash },
        zIndex: 4,
    };
}
/* Vertical step inside a column: bottom -> top, no label needed. */
const step = (id, a, b, kind = "internal") => flow(id, a, b, { kind, sourceHandle: "bottom", targetHandle: "top" });
const FLOWS = [
    /* Phase handoffs: the only labeled edges on the canvas. */
    flow("h1", "SOURCE_LIST", "IDENTITY_AI", {
        kind: "handoff",
        label: "raw drug descriptions",
    }),
    flow("h2", "IDENTITY_AI", "CONSOLIDATE", {
        kind: "handoff",
        label: "clean drug name + class",
    }),
    flow("h3", "CANONICAL_SET", "RETRIEVAL_GATEWAY", {
        kind: "handoff",
        label: "one drug, all its doses",
    }),
    flow("h4", "EVIDENCE_CONTEXT", "MATCH_AI", {
        kind: "handoff",
        label: "candidate list only",
        lane: { ratio: 0.78, labelOffsetFromTarget: -90 },
    }),
    flow("h5", "CANDIDATE_GUARD", "NAME_RESOLUTION", {
        kind: "verified",
        label: "confirmed matches",
    }),
    /* The safety boundary is deliberately the one green cross-phase edge. */
    flow("guard", "CANDIDATE_RANKER", "CANDIDATE_GUARD", {
        kind: "verified",
        label: "must exist in this list",
        lane: { ratio: 0.22, labelOffsetFromTarget: -90 },
    }),
    /* inside 02 */
    step("i-policy", "IDENTITY_POLICY", "IDENTITY_AI", "control"),
    /* inside 03 */
    step("i-consolidate", "CONSOLIDATE", "CANONICAL_SET"),
    /* inside 04 */
    step("i-gateway", "RETRIEVAL_GATEWAY", "PLAN_INDEXES"),
    step("i-indexes", "PLAN_INDEXES", "CANDIDATE_RANKER"),
    step("i-ranker", "CANDIDATE_RANKER", "EVIDENCE_CONTEXT"),
    /* inside 05 */
    step("i-matchpolicy", "MATCH_POLICY", "MATCH_AI", "control"),
    step("i-matchai", "MATCH_AI", "CANDIDATE_GUARD"),
    /* inside 06 */
    step("i-name", "NAME_RESOLUTION", "REVIEW_REPORT"),
    step("i-review", "REVIEW_REPORT", "STATUS_SYNC"),
    step("i-sync", "STATUS_SYNC", "PRODUCTION_FORMULARY", "verified"),
];
/* ------------------------------------------------------------------- icons */
const ICONS = {
    list: [
        ["rect", { x: 5, y: 3, width: 14, height: 18, rx: 2 }],
        ["path", { d: "M9 8h6M9 12h6M9 16h4" }],
    ],
    prompt: [
        ["path", { d: "M4 5h16v11H9l-5 4z" }],
        ["path", { d: "M8 9h8M8 12.5h5" }],
    ],
    brain: [
        ["circle", { cx: 12, cy: 12, r: 3 }],
        [
            "path",
            {
                d: "M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3.2 3.2M14.8 14.8 18 18M18 6l-3.2 3.2M9.2 14.8 6 18",
            },
        ],
    ],
    file: [
        ["path", { d: "M6 3h8l4 4v14H6z" }],
        ["path", { d: "M14 3v4h4M9 12h6M9 16h4" }],
    ],
    merge: [
        ["path", { d: "M4 5h6l4 7h6M4 19h6l2.5-4.4" }],
        ["path", { d: "M17 9l3 3-3 3" }],
    ],
    search: [
        ["circle", { cx: 10, cy: 10, r: 5.5 }],
        ["path", { d: "m14.2 14.2 5.3 5.3" }],
    ],
    service: [
        ["rect", { x: 3, y: 4, width: 18, height: 6, rx: 2 }],
        ["rect", { x: 3, y: 14, width: 18, height: 6, rx: 2 }],
        ["path", { d: "M7 7h.01M7 17h.01" }],
    ],
    database: [
        ["ellipse", { cx: 12, cy: 5, rx: 7, ry: 3 }],
        [
            "path",
            { d: "M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" },
        ],
    ],
    filter: [["path", { d: "M4 4h16l-6.5 7.5v5.5L10 20v-8.5z" }]],
    table: [
        ["rect", { x: 3, y: 4, width: 18, height: 16, rx: 2 }],
        ["path", { d: "M3 9h18M9 9v11M15 9v11" }],
    ],
    shield: [
        ["path", { d: "M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z" }],
        ["path", { d: "m9 12 2.2 2.2L15.5 10" }],
    ],
    review: [
        ["rect", { x: 4, y: 3, width: 16, height: 18, rx: 2 }],
        ["path", { d: "M8 8h8M8 12h8M8 16h5" }],
    ],
};
function ArchitectureIcon({ name }) {
    const shapes = ICONS[name] || ICONS.file;
    return (_jsx("svg", { viewBox: "0 0 24 24", focusable: "false", "aria-hidden": "true", children: shapes.map(([el, props], i) => React.createElement(el, { ...props, key: i })) }));
}
const BubbleControllerContext = createContext(null);
/* ------------------------------------------------------------------- nodes */
function StagePanel({ data, }) {
    return (_jsx("div", { className: `hld-phase hld-phase--${data.stage}`, children: _jsxs("div", { className: "hld-phase-heading", children: [_jsx("span", { className: "hld-phase-index", children: data.index }), _jsxs("div", { children: [_jsx("p", { className: "hld-phase-title", children: data.title }), _jsx("p", { className: "hld-phase-note", children: data.purpose })] })] }) }));
}
function ArchitectureComponent({ data, }) {
    const bubble = useContext(BubbleControllerContext);
    const isActive = bubble?.activeId === data.id;
    const classes = [
        "hld-node",
        "nodrag",
        "nopan",
        `hld-node--${data.stage}`,
        `hld-node--role-${data.tag.toLowerCase().replace(/\s+/g, "-")}`,
        data.guardrail ? "hld-node--gate" : "",
        isActive ? "is-active" : "",
    ]
        .filter(Boolean)
        .join(" ");
    const activate = (event) => {
        bubble?.openComponent(data.id, event.currentTarget, {
            x: event.clientX,
            y: event.clientY,
        });
    };
    const activateFromKeyboard = (event) => {
        if (event.key !== "Enter" && event.key !== " ")
            return;
        event.preventDefault();
        bubble?.openComponent(data.id, event.currentTarget);
    };
    return (_jsxs("div", { className: classes, role: "button", tabIndex: 0, "aria-expanded": isActive, "aria-controls": "hld-component-definition", "aria-label": `Open architectural definition for ${data.title}`, onClick: activate, onKeyDown: activateFromKeyboard, children: [_jsx(Handle, { type: "target", position: Position.Left, id: "left", className: "hld-handle" }), _jsx(Handle, { type: "target", position: Position.Top, id: "top", className: "hld-handle" }), _jsxs("div", { className: "hld-node-head", children: [_jsx("span", { className: "hld-node-icon", "aria-hidden": "true", children: _jsx(ArchitectureIcon, { name: data.icon }) }), _jsx("span", { className: "hld-node-tag", children: data.tag })] }), _jsx("p", { className: "hld-node-title", children: data.title }), _jsx("p", { className: "hld-node-sub", children: data.detail }), _jsx(Handle, { type: "source", position: Position.Right, id: "right", className: "hld-handle" }), _jsx(Handle, { type: "source", position: Position.Bottom, id: "bottom", className: "hld-handle" })] }));
}
function KnowledgeBubble({ detail, open, position, onPointerEnter, onPointerLeave, onClose, }) {
    return (_jsxs("aside", { id: "hld-component-definition", className: `hld-knowledge-bubble${open ? " is-open" : ""}`, role: "region", "aria-live": "polite", "aria-label": `${detail.title} architectural definition`, style: position, onPointerEnter: onPointerEnter, onPointerLeave: onPointerLeave, children: [_jsxs("header", { className: "hld-bubble-head", children: [_jsxs("div", { children: [_jsx("p", { className: "hld-bubble-eyebrow", children: detail.eyebrow }), _jsx("h2", { className: "hld-bubble-title", children: detail.title })] }), _jsx("button", { type: "button", className: "hld-bubble-close", "aria-label": "Close architectural definition", onClick: onClose, children: _jsx("span", { "aria-hidden": "true", children: "\u00D7" }) })] }), _jsxs("div", { className: "hld-bubble-content", children: [_jsx("p", { className: "hld-bubble-definition", children: detail.definition }), _jsx("div", { className: "hld-bubble-sections", children: detail.sections.map((section) => (_jsxs("section", { className: "hld-bubble-section", children: [_jsx("h3", { children: section.title }), section.body ? _jsx("p", { children: section.body }) : null, section.items ? (_jsx("ul", { children: section.items.map((item) => (_jsx("li", { children: item }, item))) })) : null, section.steps ? (_jsx("ol", { className: "hld-bubble-steps", children: section.steps.map((step) => (_jsx("li", { children: step }, step))) })) : null, section.facts ? (_jsx("dl", { className: "hld-bubble-facts", children: section.facts.map((fact) => (_jsxs("div", { children: [_jsx("dt", { children: fact.label }), _jsx("dd", { children: fact.value })] }, `${fact.label}-${fact.value}`))) })) : null, section.table ? (_jsx("div", { className: "hld-bubble-table-wrap", children: _jsxs("table", { className: "hld-bubble-table", children: [section.table.widths ? (_jsx("colgroup", { children: section.table.widths.map((width, index) => (_jsx("col", { style: { width } }, `${index}-${width}`))) })) : null, _jsx("thead", { children: _jsx("tr", { children: section.table.columns.map((column) => (_jsx("th", { scope: "col", children: column }, column))) }) }), _jsx("tbody", { children: section.table.rows.map((row) => (_jsx("tr", { children: row.map((cell, index) => (_jsx("td", { children: cell }, `${index}-${cell}`))) }, row.join("-")))) })] }) })) : null, section.json ? (_jsx("pre", { className: "hld-bubble-json", "aria-label": `${section.title} JSON`, children: _jsx("code", { children: section.json }) })) : null, section.note ? (_jsx("p", { className: "hld-bubble-note", children: section.note })) : null] }, section.title))) }), detail.prompt ? (_jsxs("details", { className: "hld-bubble-prompt", children: [_jsx("summary", { children: "View actual model prompt" }), _jsx("pre", { children: detail.prompt })] })) : null, detail.insight && detail.insightLabel ? (_jsxs("section", { className: "hld-bubble-insight", children: [_jsx("p", { className: "hld-bubble-insight-label", children: detail.insightLabel }), _jsx("p", { children: detail.insight })] })) : null] }, `${detail.stage}-${detail.title}`)] }));
}
const NODE_TYPES = {
    stage: StagePanel,
    component: ArchitectureComponent,
};
const NODES = [
    ...Object.entries(STAGES).map(([stage, box]) => ({
        id: `stage-${stage}`,
        type: "stage",
        position: { x: box.x, y: STAGE_TOP },
        style: { width: box.width, height: STAGE_H },
        data: {
            stage,
            index: box.index,
            title: box.title,
            purpose: box.purpose,
        },
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: 0,
    })),
    ...Object.entries(COMPONENTS).map(([id, c]) => ({
        id,
        type: "component",
        position: { x: c.x, y: c.y },
        style: { width: c.width },
        data: { ...c, id },
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: 2,
    })),
];
const LEGEND = [
    { cls: "handoff", label: "Phase handoff" },
    { cls: "internal", label: "Step within a phase" },
    { cls: "control", label: "Policy / prompt input" },
    { cls: "gate", label: "Verified-only boundary" },
];
/* ------------------------------------------------------------------ styles */
const CSS = `
.hld-canvas{position:relative;width:100%;height:100%;min-height:640px;
  background:#f4f1e9;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;}
.hld-flow{box-sizing:border-box;width:100%;height:100%;}

.hld-phase{position:relative;width:100%;height:100%;border:0;background:transparent;}
.hld-phase::before{content:"";position:absolute;inset:136px 0 0;border-radius:18px;
  background:rgba(255,255,255,.58);border:1px solid rgba(38,50,45,.14);
  border-top:3px solid var(--accent,#8a9a91);box-shadow:0 10px 28px rgba(24,32,29,.065),
  inset 0 1px rgba(255,255,255,.72);}
.hld-phase-heading{position:relative;z-index:1;display:flex;align-items:flex-start;gap:12px;
  box-sizing:border-box;min-height:130px;padding:8px 18px 0;}
.hld-phase-index{flex:none;font-family:Georgia,"Times New Roman",serif;font-size:19px;font-weight:500;
  color:color-mix(in srgb,var(--accent,#708078) 72%,#26322d);font-variant-numeric:tabular-nums;
  line-height:1.12;}
.hld-phase-heading>div{min-width:0;}
.hld-phase-title{margin:0;font-family:Georgia,"Times New Roman",serif;font-size:17px;
  font-weight:600;color:#1c2924;line-height:1.17;letter-spacing:-.012em;}
.hld-phase-note{margin:7px 0 0;font-family:Georgia,"Times New Roman",serif;font-size:13.25px;
  font-style:italic;font-weight:500;line-height:1.3;color:rgba(28,41,36,.76);max-width:245px;}
.hld-phase--intake{--accent:#c2803a;}
.hld-phase--identify{--accent:#7a6a99;}
.hld-phase--consolidate{--accent:#9a9384;}
.hld-phase--retrieve{--accent:#4a7590;}
.hld-phase--verify{--accent:#8a5f86;}
.hld-phase--publish{--accent:#2f7a5c;}

.hld-edge-label{position:absolute;z-index:8;box-sizing:border-box;width:max-content;max-width:92px;
  padding:6px 9px;border:0;border-radius:8px;background:#101614;
  filter:drop-shadow(0 4px 8px rgba(16,22,20,.2));
  color:#e2bc88;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:12.5px;font-weight:750;line-height:1.18;letter-spacing:.035em;
  text-align:center;white-space:normal;overflow-wrap:normal;pointer-events:none;}

.hld-node{--role-accent:#65736c;position:relative;box-sizing:border-box;height:136px;
  padding:12px 14px;border-radius:13px;background:#fffefa;
  border:1px solid rgba(38,50,45,.20);box-shadow:0 7px 18px rgba(24,32,29,.095),
  0 1px 0 rgba(255,255,255,.9) inset;cursor:pointer;outline:none;
  transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease,background .18s ease;}
.hld-node:hover{border-color:color-mix(in srgb,var(--role-accent) 68%,transparent);
  box-shadow:0 12px 26px rgba(24,32,29,.14),0 1px 0 rgba(255,255,255,.92) inset;
  transform:translateY(-2px);}
.hld-node:focus-visible{box-shadow:0 0 0 3px color-mix(in srgb,var(--role-accent) 24%,transparent),
  0 10px 24px rgba(24,32,29,.13);border-color:var(--role-accent);}
.hld-node.is-active{border-color:var(--role-accent);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--role-accent) 18%,transparent),
  0 12px 28px rgba(24,32,29,.15);}
.hld-node-head{display:flex;align-items:center;gap:8px;margin-bottom:9px;}
.hld-node-icon{display:grid;place-items:center;flex:none;width:27px;height:27px;border-radius:8px;
  color:var(--role-accent);background:color-mix(in srgb,var(--role-accent) 10%,#fff);}
.hld-node-icon svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;
  stroke-linecap:round;stroke-linejoin:round;display:block;}
.hld-node-tag{display:inline-flex;align-items:center;min-height:21px;padding:4px 8px;border-radius:999px;
  background:rgba(38,50,45,.065);font-size:9px;font-weight:750;line-height:1;
  letter-spacing:.095em;text-transform:uppercase;color:rgba(30,42,36,.68);}
.hld-node-title{margin:0;font-size:14.6px;font-weight:650;color:#17241f;line-height:1.23;
  letter-spacing:-.006em;}
.hld-node-sub{margin:7px 0 0;font-size:11.4px;line-height:1.4;color:rgba(38,50,45,.72);}

.hld-node--role-ai-service{--role-accent:#705c83;background:#f4f0f6;
  border:1.5px solid rgba(112,92,131,.62);border-left-width:4px;
  box-shadow:0 10px 25px rgba(82,61,98,.15),0 1px 0 rgba(255,255,255,.82) inset;}
.hld-node--role-ai-service .hld-node-title,.hld-node--gate .hld-node-title{
  font-size:15.2px;font-weight:720;}
.hld-node--role-ai-service .hld-node-icon{color:#634b78;background:rgba(112,92,131,.15);}
.hld-node--role-ai-service .hld-node-tag{color:#5e496f;background:rgba(112,92,131,.13);}

.hld-node--gate{--role-accent:#287357;background:#edf6f1;border:1.5px solid rgba(40,115,87,.62);
  border-left-width:4px;box-shadow:0 10px 25px rgba(30,107,82,.14),
  0 1px 0 rgba(255,255,255,.82) inset;}
.hld-node--gate .hld-node-icon{color:#22684e;background:rgba(40,115,87,.14);}
.hld-node--gate .hld-node-tag{color:#205e48;background:rgba(40,115,87,.13);}

.hld-node--role-prompt{--role-accent:#82748d;background:rgba(255,254,250,.72);
  border-color:rgba(93,82,102,.24);border-left:3px dashed rgba(112,92,131,.52);
  box-shadow:0 4px 12px rgba(24,32,29,.06);}
.hld-node--role-prompt .hld-node-icon{color:#766780;background:rgba(118,103,128,.08);}
.hld-node--role-prompt .hld-node-tag{color:#6c6074;background:rgba(118,103,128,.085);}

.hld-node--role-live-data,.hld-node--role-dataset{--role-accent:#56717a;background:#f1f5f3;
  border-color:rgba(74,105,115,.34);box-shadow:0 7px 18px rgba(46,72,78,.09),
  inset 0 -3px 0 rgba(74,105,115,.12);}
.hld-node--role-live-data .hld-node-icon,.hld-node--role-dataset .hld-node-icon{
  color:#4c6972;background:rgba(74,105,115,.12);}
.hld-node--role-live-data .hld-node-tag,.hld-node--role-dataset .hld-node-tag{
  color:#47616a;background:rgba(74,105,115,.105);}

.hld-node--role-data-service{--role-accent:#4a7590;background:#f4f7f8;
  border-color:rgba(74,117,144,.38);}
.hld-node--role-source{--role-accent:#a66e32;background:#fffaf1;border-color:rgba(166,110,50,.36);}
.hld-node--role-human-review{--role-accent:#8a6c47;background:#fbf7ef;border-color:rgba(138,108,71,.34);}

.hld-handle{opacity:0;width:1px;height:1px;border:0;min-width:0;min-height:0;}
.hld-flow .react-flow__node-stage{pointer-events:none!important;}
.hld-flow .react-flow__node-component{cursor:help;}

.hld-knowledge-bubble{position:fixed;z-index:90;width:min(440px,calc(100vw - 24px));
  box-sizing:border-box;overflow:auto;overscroll-behavior:contain;
  color:#f3efe5;background:linear-gradient(152deg,#202824 0%,#111714 70%);
  border:1px solid rgba(226,177,105,.28);border-radius:18px;
  box-shadow:0 24px 70px rgba(8,13,11,.38),inset 0 1px rgba(255,255,255,.04);
  transform:translateY(7px) scale(.985);opacity:0;visibility:hidden;
  transition:transform .2s cubic-bezier(.22,.8,.25,1),opacity .16s ease,visibility 0s linear .2s;
  scrollbar-color:rgba(226,177,105,.34) transparent;}
.hld-knowledge-bubble.is-open{transform:none;opacity:1;visibility:visible;
  transition:transform .2s cubic-bezier(.22,.8,.25,1),opacity .16s ease,visibility 0s;}
.hld-bubble-head{position:sticky;z-index:2;top:0;display:flex;align-items:flex-start;
  justify-content:space-between;gap:18px;padding:22px 22px 17px;
  background:linear-gradient(180deg,rgba(24,32,28,.99) 0%,rgba(24,32,28,.96) 82%,rgba(24,32,28,0) 100%);}
.hld-bubble-eyebrow{margin:0 0 7px;color:#dfa85f;font-size:9px;font-weight:750;
  letter-spacing:.15em;text-transform:uppercase;}
.hld-bubble-title{margin:0;color:#fffaf0;font-family:Georgia,"Times New Roman",serif;
  font-size:24px;font-weight:500;line-height:1.13;letter-spacing:-.018em;}
.hld-bubble-close{flex:0 0 auto;display:grid;place-items:center;width:32px;height:32px;padding:0;
  border:1px solid rgba(243,239,229,.18);border-radius:50%;background:rgba(255,255,255,.04);
  color:rgba(255,255,255,.72);font:300 24px/1 ui-sans-serif,system-ui;cursor:pointer;
  transition:background .16s ease,color .16s ease,border-color .16s ease,transform .16s ease;}
.hld-bubble-close:hover{color:#fff;background:rgba(226,177,105,.12);
  border-color:rgba(226,177,105,.42);transform:rotate(4deg);}
.hld-bubble-close:focus-visible{outline:2px solid #e2b169;outline-offset:3px;}
.hld-bubble-content{padding:0 22px 24px;animation:hld-content-in .24s ease both;}
@keyframes hld-content-in{from{opacity:.38;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.hld-bubble-definition{margin:2px 0 20px;color:rgba(243,239,229,.82);font-size:13px;
  line-height:1.68;}
.hld-bubble-sections{display:grid;gap:10px;}
.hld-bubble-section{padding:14px 15px;border:1px solid rgba(255,255,255,.09);border-radius:12px;
  background:rgba(255,255,255,.035);}
.hld-bubble-section h3{margin:0 0 8px;color:#e1ad68;font-size:9px;font-weight:750;
  letter-spacing:.12em;text-transform:uppercase;}
.hld-bubble-section p,.hld-bubble-section li{color:rgba(243,239,229,.73);font-size:11.5px;line-height:1.58;}
.hld-bubble-section p{margin:0;}
.hld-bubble-section ul{display:grid;gap:5px;margin:0;padding:0 0 0 15px;}
.hld-bubble-section li::marker{color:#cf9550;}
.hld-bubble-steps{display:grid;gap:8px;margin:0;padding:0;list-style:none;counter-reset:hld-step;}
.hld-bubble-steps li{position:relative;min-height:22px;padding-left:31px;counter-increment:hld-step;}
.hld-bubble-steps li::before{content:counter(hld-step);position:absolute;left:0;top:1px;
  display:grid;place-items:center;width:20px;height:20px;border-radius:50%;
  background:rgba(223,168,95,.14);color:#e4b475;font-size:9px;font-weight:800;}
.hld-bubble-facts{display:grid;gap:0;margin:10px 0 0;border:1px solid rgba(255,255,255,.08);
  border-radius:9px;overflow:hidden;}
.hld-bubble-facts>div{display:grid;grid-template-columns:88px minmax(0,1fr);gap:10px;
  padding:8px 10px;background:rgba(8,13,11,.2);}
.hld-bubble-facts>div+div{border-top:1px solid rgba(255,255,255,.07);}
.hld-bubble-facts dt{color:#dfa85f;font-size:9px;font-weight:750;letter-spacing:.08em;
  text-transform:uppercase;}
.hld-bubble-facts dd{margin:0;color:rgba(255,248,235,.82);font-size:11.5px;line-height:1.45;}
.hld-bubble-table-wrap{margin-top:9px;overflow:hidden;border:1px solid rgba(255,255,255,.1);
  border-radius:9px;}
.hld-bubble-table{width:100%;border-collapse:collapse;table-layout:fixed;}
.hld-bubble-table th{padding:8px 9px;background:rgba(223,168,95,.12);color:#e4b475;
  font-size:8.5px;font-weight:750;letter-spacing:.1em;text-align:left;text-transform:uppercase;}
.hld-bubble-table td{padding:9px;color:rgba(243,239,229,.75);font-size:10.5px;line-height:1.45;
  vertical-align:top;overflow-wrap:anywhere;}
.hld-bubble-table th+th,.hld-bubble-table td+td{border-left:1px solid rgba(255,255,255,.08);}
.hld-bubble-table tr+tr td{border-top:1px solid rgba(255,255,255,.08);}
.hld-bubble-table td:first-child{color:#fff4df;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;
  font-size:9.75px;}
.hld-bubble-json{max-height:270px;margin:10px 0 0;padding:12px;overflow:auto;
  border:1px solid rgba(113,164,153,.22);border-radius:9px;background:rgba(4,10,9,.42);
  white-space:pre-wrap;overflow-wrap:anywhere;color:rgba(229,244,238,.8);
  font:9.75px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;
  scrollbar-color:rgba(113,164,153,.42) transparent;}
.hld-bubble-json code{font:inherit;color:inherit;}
.hld-bubble-note{margin-top:10px!important;padding-top:9px;border-top:1px solid rgba(255,255,255,.08);
  color:rgba(243,239,229,.62)!important;font-size:10.75px!important;font-style:italic;line-height:1.5!important;}
.hld-bubble-prompt{margin-top:14px;border:1px solid rgba(226,177,105,.24);border-radius:11px;
  background:rgba(8,13,11,.3);overflow:hidden;}
.hld-bubble-prompt summary{padding:12px 14px;color:#e4b475;font-size:10px;font-weight:750;
  letter-spacing:.1em;text-transform:uppercase;cursor:pointer;list-style-position:inside;}
.hld-bubble-prompt summary:hover{background:rgba(226,177,105,.07);}
.hld-bubble-prompt summary:focus-visible{outline:2px solid #e2b169;outline-offset:-3px;}
.hld-bubble-prompt pre{max-height:360px;margin:0;padding:14px;overflow:auto;
  border-top:1px solid rgba(226,177,105,.18);white-space:pre-wrap;overflow-wrap:anywhere;
  color:rgba(243,239,229,.76);font:10px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;
  scrollbar-color:rgba(226,177,105,.34) transparent;}
.hld-bubble-insight{margin-top:14px;padding:15px;border-left:2px solid #c88c45;border-radius:0 10px 10px 0;
  background:rgba(200,140,69,.09);}
.hld-bubble-insight-label{margin:0 0 7px!important;color:#e1ad68!important;font-size:9px!important;
  font-weight:750;letter-spacing:.12em;text-transform:uppercase;}
.hld-bubble-insight p{margin:0;color:rgba(255,248,235,.8);font-size:11.5px;line-height:1.62;}

@media(prefers-reduced-motion:reduce){
  .hld-flow,.hld-node,.hld-knowledge-bubble,.hld-bubble-content{transition:none;animation:none;}
}

.hld-legend{position:absolute;left:20px;bottom:14px;display:flex;flex-wrap:wrap;gap:16px;
  font-size:10.5px;color:rgba(38,50,45,.62);background:rgba(244,241,233,.9);
  padding:7px 12px;border-radius:9px;}
.hld-legend span{display:inline-flex;align-items:center;gap:6px;}
.hld-dot{width:16px;height:0;border-top-width:2px;border-top-style:solid;display:inline-block;}
.hld-dot--handoff{border-color:#3f5049;}
.hld-dot--internal{border-color:#93a099;border-top-width:1.5px;}
.hld-dot--control{border-color:#7d8fa0;border-top-style:dashed;}
.hld-dot--gate{border-color:#1e6b52;border-top-width:2.5px;}
`;
/* ----------------------------------------------------------------- export */
export default function FullFlow() {
    const [activeId, setActiveId] = useState(null);
    const [bubbleOpen, setBubbleOpen] = useState(false);
    const [bubblePosition, setBubblePosition] = useState({
        top: 12,
        left: 12,
        maxHeight: "calc(100vh - 24px)",
    });
    const activeIdRef = useRef(null);
    const activeTriggerRef = useRef(null);
    const hoverOpenTimerRef = useRef(null);
    const hoverCloseTimerRef = useRef(null);
    const closeTimerRef = useRef(null);
    const closeBubble = useCallback((restoreFocus = true) => {
        const trigger = activeTriggerRef.current;
        activeIdRef.current = null;
        setBubbleOpen(false);
        if (closeTimerRef.current)
            clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
            setActiveId(null);
            closeTimerRef.current = null;
            if (restoreFocus)
                trigger?.focus();
        }, 340);
    }, []);
    const openComponent = useCallback((id, trigger, pointer) => {
        if (hoverOpenTimerRef.current) {
            clearTimeout(hoverOpenTimerRef.current);
            hoverOpenTimerRef.current = null;
        }
        if (hoverCloseTimerRef.current) {
            clearTimeout(hoverCloseTimerRef.current);
            hoverCloseTimerRef.current = null;
        }
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        const triggerRect = trigger.getBoundingClientRect();
        const x = pointer?.x || triggerRect.right;
        const y = pointer?.y || triggerRect.top + triggerRect.height / 2;
        const gap = 14;
        const viewportPadding = 12;
        const bubbleWidth = Math.min(440, window.innerWidth - viewportPadding * 2);
        const roomRight = window.innerWidth - x;
        const roomBelow = window.innerHeight - y;
        const placeRight = roomRight >= bubbleWidth + gap + viewportPadding;
        const placeBelow = roomBelow >= 280 || roomBelow >= y;
        setBubblePosition({
            ...(placeRight
                ? { left: x + gap, right: "auto" }
                : { left: "auto", right: window.innerWidth - x + gap }),
            ...(placeBelow
                ? { top: y + gap, bottom: "auto", maxHeight: Math.max(180, roomBelow - gap - viewportPadding) }
                : { top: "auto", bottom: window.innerHeight - y + gap, maxHeight: Math.max(180, y - gap - viewportPadding) }),
        });
        activeTriggerRef.current = trigger;
        activeIdRef.current = id;
        setActiveId(id);
        setBubbleOpen(true);
    }, []);
    const scheduleHoverBubble = useCallback((id, trigger, pointer) => {
        if (activeIdRef.current === id) {
            if (hoverCloseTimerRef.current) {
                clearTimeout(hoverCloseTimerRef.current);
                hoverCloseTimerRef.current = null;
            }
            return;
        }
        if (hoverOpenTimerRef.current) {
            clearTimeout(hoverOpenTimerRef.current);
        }
        hoverOpenTimerRef.current = setTimeout(() => {
            hoverOpenTimerRef.current = null;
            openComponent(id, trigger, pointer);
        }, 1000);
    }, [openComponent]);
    const leaveComponent = useCallback((id) => {
        if (hoverOpenTimerRef.current) {
            clearTimeout(hoverOpenTimerRef.current);
            hoverOpenTimerRef.current = null;
        }
        if (activeIdRef.current !== id)
            return;
        if (hoverCloseTimerRef.current)
            clearTimeout(hoverCloseTimerRef.current);
        hoverCloseTimerRef.current = setTimeout(() => {
            hoverCloseTimerRef.current = null;
            if (activeIdRef.current === id)
                closeBubble(false);
        }, 1000);
    }, [closeBubble]);
    const keepBubbleOpen = useCallback(() => {
        if (!hoverCloseTimerRef.current)
            return;
        clearTimeout(hoverCloseTimerRef.current);
        hoverCloseTimerRef.current = null;
    }, []);
    const leaveBubble = useCallback(() => {
        const id = activeIdRef.current;
        if (!id)
            return;
        if (hoverCloseTimerRef.current)
            clearTimeout(hoverCloseTimerRef.current);
        hoverCloseTimerRef.current = setTimeout(() => {
            hoverCloseTimerRef.current = null;
            if (activeIdRef.current === id)
                closeBubble(false);
        }, 1000);
    }, [closeBubble]);
    const bubbleController = useMemo(() => ({ activeId: bubbleOpen ? activeId : null, openComponent }), [activeId, bubbleOpen, openComponent]);
    const activeDetail = activeId ? COMPONENT_DETAILS[activeId] : null;
    useEffect(() => {
        if (!bubbleOpen)
            return;
        const handleEscape = (event) => {
            if (event.key !== "Escape")
                return;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            closeBubble();
        };
        document.addEventListener("keydown", handleEscape, true);
        return () => document.removeEventListener("keydown", handleEscape, true);
    }, [bubbleOpen, closeBubble]);
    useEffect(() => () => {
        if (hoverOpenTimerRef.current)
            clearTimeout(hoverOpenTimerRef.current);
        if (hoverCloseTimerRef.current)
            clearTimeout(hoverCloseTimerRef.current);
        if (closeTimerRef.current)
            clearTimeout(closeTimerRef.current);
    }, []);
    return (_jsx(BubbleControllerContext.Provider, { value: bubbleController, children: _jsxs("div", { className: `hld-canvas${bubbleOpen ? " hld-canvas--bubble-open" : ""}`, children: [_jsx("style", { children: CSS }), _jsx("div", { className: "hld-flow", children: _jsxs(ReactFlow, { nodes: NODES, edges: FLOWS, nodeTypes: NODE_TYPES, edgeTypes: EDGE_TYPES, fitView: true, fitViewOptions: { padding: 0.02 }, minZoom: 0.15, maxZoom: 1.6, nodesDraggable: false, nodesConnectable: false, elementsSelectable: false, proOptions: { hideAttribution: false }, onNodeMouseEnter: (event, hoveredNode) => {
                            if (hoveredNode.type !== "component")
                                return;
                            scheduleHoverBubble(hoveredNode.id, event.currentTarget, {
                                x: event.clientX,
                                y: event.clientY,
                            });
                        }, onNodeMouseLeave: (_event, hoveredNode) => {
                            if (hoveredNode.type !== "component")
                                return;
                            leaveComponent(hoveredNode.id);
                        }, children: [_jsx(Background, { gap: 26, size: 1, color: "rgba(16,22,20,.09)" }), _jsx(Controls, { showInteractive: false })] }) }), _jsx("div", { className: "hld-legend", "aria-label": "Architecture flow legend", children: LEGEND.map((item) => (_jsxs("span", { children: [_jsx("i", { className: `hld-dot hld-dot--${item.cls}` }), item.label] }, item.cls))) }), activeDetail && typeof document !== "undefined"
                    ? createPortal(_jsx(KnowledgeBubble, { detail: activeDetail, open: bubbleOpen, position: bubblePosition, onPointerEnter: keepBubbleOpen, onPointerLeave: leaveBubble, onClose: closeBubble }), document.body)
                    : null] }) }));
}
