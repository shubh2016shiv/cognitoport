/* ============================================================
   Full HLD: horizontal, explorable React Flow canvas
   ============================================================
   One left-to-right story: a clinical recommendation enters, benefits are
   resolved, drug actions are isolated, a model names a therapeutic class,
   the covered-drug index produces a finite candidate set, and a second
   constrained call chooses from it. Phase backgrounds and their components
   share one colour family. Nodes never navigate away: hover and keyboard
   focus reveal a compact explanatory bubble instead.

   Phase keys reuse the stylesheet's existing colour families
   (inputs / knowledge / context / plan / execute / critique / post).
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType, BaseEdge } from "@xyflow/react";

const h = React.createElement;

const PHASES = {
  inputs:    { index: "01", title: "Inputs And Sources", note: "What arrives on the topic, and the patient data it unlocks", x: 0,    y: 40, w: 300, h: 960 },
  knowledge: { index: "02", title: "Coverage Resolution", note: "Which plan this patient has, and whether that plan is even known", x: 350,  y: 40, w: 300, h: 960 },
  context:   { index: "03", title: "Pharmacological Recommendation Extraction", note: "Filtering the clinical recommendations down to drug therapy alone", x: 700,  y: 40, w: 300, h: 960 },
  plan:      { index: "04", title: "Drug Class Identification", note: "Clinical knowledge only — no coverage data in the prompt", x: 1050, y: 40, w: 360, h: 960 },
  execute:   { index: "05", title: "Formulary Retrieval", note: "Search the plan’s covered-drug list, one call per drug class", x: 1460, y: 40, w: 380, h: 960 },
  critique:  { index: "06", title: "Relevance Selection", note: "Batch the candidates, then let a constrained model choose from them", x: 1890, y: 40, w: 430, h: 960 },
  post:      { index: "07", title: "Synthesis And Governance", note: "Combine the results, save the update, and record how every step went", x: 2370, y: 40, w: 700, h: 960 },
};

const LAYOUT = {
  PAT:      { phase: "inputs", icon: "ingestion", tag: "KAFKA EVENT", x: 35,   y: 175, w: 230 },
  RECS:     { phase: "inputs", icon: "documents", tag: "CLINICAL INPUT", x: 35,   y: 430, w: 230 },
  PLAN:     { phase: "knowledge", icon: "table", tag: "API LOOKUP", x: 385,  y: 300, w: 230 },
  COV:      { phase: "knowledge", icon: "gate", tag: "STOP IF MISSING", x: 385,  y: 530, w: 230, gate: true },

  PATH:     { phase: "context", icon: "search", tag: "DECLARATIVE FILTER", x: 735,  y: 300, w: 230 },
  ACTS:     { phase: "context", icon: "package", tag: "DRUG ACTIONS ONLY", x: 735,  y: 530, w: 230, gate: true },

  PROMPT:   { phase: "plan", icon: "contract", tag: "PROMPT REGISTRY", x: 1095, y: 145, w: 270 },
  PFETCH:   { phase: "plan", icon: "database", tag: "RUNTIME FETCH", x: 1095, y: 345, w: 270 },
  CLS:      { phase: "plan", icon: "logic", tag: "MODEL · CONSTRAINED", x: 1095, y: 545, w: 270 },
  RETRY:    { phase: "plan", icon: "guard", tag: "BOUNDED RETRY", x: 1095, y: 745, w: 270, gate: true },

  SKIP:     { phase: "execute", icon: "gate", tag: "SAFETY CHECK", x: 1515, y: 175, w: 270, gate: true },
  IDX:      { phase: "execute", icon: "repository", tag: "PARALLEL · POOL BOUND", x: 1515, y: 380, w: 270 },
  MRG:      { phase: "execute", icon: "assembly", tag: "COMBINE WITH RECOMMENDATION", x: 1515, y: 585, w: 270 },
  CAND:     { phase: "execute", icon: "scaffold", tag: "SAFETY BOUNDARY", x: 1515, y: 775, w: 270, gate: true },

  VIA:      { phase: "critique", icon: "gate", tag: "EMPTY-SET CHECK", x: 1940, y: 175, w: 290, gate: true },
  BAT:      { phase: "critique", icon: "scaffold", tag: "FIXED BATCH COUNT", x: 1940, y: 375, w: 290 },
  TBL:      { phase: "critique", icon: "table", tag: "NO MODEL INVOLVED", x: 1940, y: 565, w: 290 },
  SEL:      { phase: "critique", icon: "logic", tag: "MODEL · CONSTRAINED", x: 1940, y: 755, w: 290 },

  AGG:      { phase: "post", icon: "accept", tag: "ISOLATED FAILURES", x: 2420, y: 175, w: 270, gate: true },
  SYN:      { phase: "post", tone: "artifact", icon: "artifact", tag: "IDENTIFIER MAP", x: 2420, y: 420, w: 270 },
  OUT:      { phase: "post", tone: "success", icon: "runtime", tag: "DATABASE WRITE-BACK", x: 2420, y: 665, w: 270 },

  TRC:      { phase: "post", icon: "report", tag: "CROSS-CUTTING", x: 2760, y: 175, w: 270 },
  TOK:      { phase: "post", icon: "evaluate", tag: "CROSS-CUTTING", x: 2760, y: 420, w: 270 },
  MET:      { phase: "post", icon: "decision", tag: "CROSS-CUTTING", x: 2760, y: 665, w: 270 },
};

const DETAILS = {
  PAT: {
    title: "Kafka Event Trigger",
    sub: "An event on the topic starts the run — no request-response call",
    paragraphs: [
      "This pipeline is event-driven, not invoked directly. A message lands on a Kafka topic carrying a patient reference and a run identifier, a consumer picks it up, and that single event is what starts formulary intelligence for this patient. There is no caller waiting on a response — the event is fire-and-forget, and everything the pipeline needs beyond those two values, it fetches for itself downstream.",
      "That shape absorbs bursts the way a synchronous API cannot: patients needing enrichment can arrive faster than any single run completes, and the topic buffers that pressure instead of forcing a caller to block or the service to reject work. A failed run is not lost either — an unacknowledged or errored event is retried from the topic rather than silently dropped.",
      "The run identifier is the thread that ties everything after it together. Every trace record, every retrieval call and every model call across the pipeline is stamped with it, which is what makes one run's activity reconstructable afterwards — including the branches that deliberately produced nothing.",
    ],
  },
  RECS: {
    title: "Clinical Recommendations",
    sub: "The full recommendation set for this patient — not just drug actions",
    paragraphs: [
      "A clinical reasoning stage upstream has already produced a recommendation set for this patient: diagnoses, each carrying actions of several kinds — follow-up, screening, referral, counselling, and drug therapy. This pipeline pulls in the whole set as it stands; nothing has been filtered down to drug actions yet, that happens explicitly in the next phase.",
      "The set is read, never rewritten here. This pipeline does not generate clinical recommendations, re-order them, or judge whether they are appropriate — it takes them as given, and it exists only to answer one narrower question about the pharmacological interventions buried inside them: which specific product will this patient's plan actually pay for.",
      "That framing carries forward: the eventual answer is written back against this same recommendation set, keyed by the identifier each action already carries. Nothing arriving later in the pipeline is free to lose that identifier.",
    ],
  },

  PLAN: {
    title: "Look Up the Patient's Plan",
    sub: "Which formulary, which payer, effective as of when",
    paragraphs: [
      "A plain API call to the patient service, asking one question: which formulary applies to this patient right now. The answer, when there is one, carries the formulary identifier itself plus the surrounding plan and payer context and the date it took effect. No model is involved and nothing is inferred — this is account lookup, not reasoning.",
      "It runs before any clinical work starts because the answer decides what every later stage is even allowed to do. Nothing about drug classes or candidate drugs can be resolved against a formulary that hasn't been identified yet.",
      "Failure here is absorbed rather than thrown: a lookup error returns a well-shaped empty result and is traced, so a benefits-system outage degrades this one patient's run instead of crashing it.",
    ],
  },
  COV: {
    title: "Formulary Found?",
    sub: "No formulary on file ends this patient's run right here",
    paragraphs: [
      "This is the fork the lookup above sets up. When a formulary identifier came back, it moves forward as the one thing retrieval will search against later — a specific plan's covered-drug list, not a generic one. When it didn't, there is nothing to enrich against, and the run stops immediately: no drug classes are identified, no candidates are retrieved, nothing further executes for this patient.",
      "The gap worth naming: that stop is silent from the outside. The two situations that land here — 'this plan doesn't cover formulary drugs' and 'we don't actually know this patient's plan' — are traced internally but reach a caller as the same empty result. Those are different problems and only one of them is actionable by support staff.",
    ],
  },

  PATH: {
    title: "Filter Out Drug Actions",
    sub: "One path expression across every diagnosis and every action",
    paragraphs: [
      "A single declarative path query flattens the entire clinical recommendation set and yields every action inside it, regardless of how deeply the diagnoses are nested. Every action is then filtered down to the pharmacological ones — the only kind this pipeline exists to enrich. Follow-up, screening, referral and counselling actions are read past and go no further.",
      "Declarative rather than nested loops, because the upstream payload grows: a path expression tolerates unrelated schema additions that hand-written traversal would break on. The cost is that the type filter matches a fixed set of strings, so a genuinely new pharmacotherapy type is dropped silently rather than rejected loudly.",
    ],
  },
  ACTS: {
    title: "Pharmacological Actions",
    sub: "Just the drug-therapy actions, reduced to an ID and a name",
    paragraphs: [
      "What survives the filter is the pharmacological subset of the original recommendation set, and each one is reduced to two fields: an identifier and a human-readable action name. This pair is the unit of work for the whole remainder of the pipeline — everything from here on operates on drug actions only.",
      "The identifier matters more than it looks. Retrieval and selection both fan out into parallel work that completes out of order, and every one of those results rejoins on this identifier rather than on position — which is what makes concurrency safe here, and what lets the final answer be written back onto the exact action it came from.",
    ],
  },

  PROMPT: {
    title: "Prompt Registry",
    sub: "Versioned, fetched at runtime, cached per process",
    paragraphs: [
      "Prompts are not string literals compiled into the service. They are versioned artifacts held in an external registry, each addressable by a name drawn from a fixed enumeration, and cached for the lifetime of the process once first fetched.",
      "This makes prompt changes a registry operation rather than a deployment, which is the right trade for content that clinical reviewers need to read and approve. The cost is that the cache is unbounded in time: a prompt corrected after a bad release does not reach a running process until it restarts, so the fix can be deployed and not yet in effect.",
    ],
  },
  PFETCH: {
    title: "Fetch Drug Class Identification Prompt",
    sub: "This step's specific system and user prompt, by name",
    paragraphs: [
      "This is the concrete call against the registry above, made for this step alone: it asks for the one prompt version enumerated for drug class identification, and gets back the system prompt and the user prompt template that the next step will send to the model.",
      "The action list extracted upstream is substituted into that user prompt template here, producing the actual input the model will see. Nothing about drug classes is decided in this step — it only assembles the question.",
    ],
  },
  CLS: {
    title: "Drug Class Identification",
    sub: "One constrained call for every action",
    paragraphs: [
      "Every extracted action is sent in a single call whose decoding is bound to a declared schema. The model returns a therapeutic drug class for each action, keyed by the action identifier.",
      "The prompt contains no formulary data at all, and that is the central design decision. Coverage is not something a model can recall — it is something a plan file states. By withholding it, the question becomes purely clinical, and confabulated coverage becomes structurally impossible at this stage rather than merely discouraged.",
    ],
  },
  RETRY: {
    title: "Validate And Retry",
    sub: "Well-formed and usable are different properties",
    paragraphs: [
      "Constrained decoding guarantees the response parses into the declared schema. It does not guarantee a response arrives, and it does not guarantee the parsed object is usable — a schema permitting a list permits an empty one. This loop covers that gap: it re-checks the type after parsing and retries a bounded number of times before returning empty.",
      "What it does not yet do is distinguish retryable from terminal failure. A rate limit and a content filter consume the same budget with no delay between attempts, so a transient failure that a short backoff would clear is retried instantly into the same limit.",
    ],
  },

  SKIP: {
    title: "Skip Unresolved Classes",
    sub: "No valid drug class, no network call — the cheapest call is the one never made",
    paragraphs: [
      "Before any action's drug class is sent out to search, it is checked against a fixed set of invalid or unresolved values. An action that never got a usable drug class cannot produce a useful search, so spending a service call on it only adds latency and load for a result that was already known to be empty.",
      "Every skip is traced with its action and reason, which is what makes a later empty result attributable to classification rather than to search. The check matches a fixed set of known invalid strings, so a model expressing uncertainty in new words would slip past it and reach search anyway.",
    ],
  },
  IDX: {
    title: "Search Covered Drugs By Class",
    sub: "One search per drug class, run in parallel, pool bounded",
    paragraphs: [
      "Each distinct therapeutic class that survived the check above is searched against the plan's covered-drug list — a vector similarity search, not a keyword match. Classes are independent of one another, so they fan out across a bounded worker pool rather than running one after another — with ten distinct classes and a pool of five, wall time drops from ten sequential calls to two rounds.",
      "The pool is bounded deliberately. The search service is shared across every patient's run, and unbounded fan-out from many concurrent patients is the failure mode that takes it down. Transport failures retry with backoff at the client boundary; an empty result is traced distinctly from a failed call.",
    ],
  },
  MRG: {
    title: "Combine Retrieved Drugs With Their Pharmacological Recommendation",
    sub: "Parallel searches finish out of order and rejoin by the recommendation's own ID",
    paragraphs: [
      "Searches complete out of order, so each result is matched back to the specific pharmacological recommendation it was searched for, by that action's identifier rather than by position. The retrieved products are then attached directly onto that recommendation as an identifier-to-name dictionary.",
      "The reduction is keyed by product identifier, which means two rows that are genuinely the same drug in different strengths both survive as distinct candidates. The merge is correct and it inflates the candidate list with near-duplicates that enlarge the selection prompt without enlarging the real choice.",
    ],
  },
  CAND: {
    title: "Covered Drug Candidates",
    sub: "The complete list of drugs this pipeline can ever recommend",
    paragraphs: [
      "The output of search is a dictionary of identifier to drug name, per action. This is the single most important artifact in the pipeline: it is the complete set of things the system is able to recommend for this patient.",
      "Nothing that failed to arrive here can ever be recommended, which is the strong half of the safety argument. The weak half is that containment is only as good as this list — if the right class was never searched, selection will choose the best of a wrong candidate list and nothing downstream can detect it.",
    ],
  },

  VIA: {
    title: "Skip Recommendations With No Candidates",
    sub: "Nothing to choose from is recorded, not sent to the model",
    paragraphs: [
      "Every pharmacological recommendation entering this phase is checked for an empty drug class or an empty candidate list. One that has neither is excluded before any model call, and each exclusion is traced with its own specific reason rather than collapsed into one.",
      "Sending a recommendation with no candidates to the model would be asking an unanswerable question and paying for it. The gap is that the exclusion is traced but not returned, so a consumer counting recommendations against actions sees a discrepancy with no explanation in the response itself.",
    ],
  },
  BAT: {
    title: "Group Recommendations Into Batches",
    sub: "One call covers several recommendations, at a fixed batch count",
    paragraphs: [
      "Surviving recommendations are partitioned into a fixed number of batches so one model call covers several of them at once, amortising the system prompt and the round trip across all of them. With twelve recommendations, a per-recommendation design issues twelve calls; batching brings the same work down to a handful.",
      "The control variable is wrong, though. Fixing the batch count rather than the batch size makes size a function of patient complexity — the same configuration produces small batches for a simple patient and large ones for a complex patient, so the patients with the most at stake get the largest prompts. A token budget is the right bound.",
    ],
  },
  TBL: {
    title: "Render Candidates As A Table",
    sub: "Plain code turns the candidate dictionary into markdown — no model involved",
    paragraphs: [
      "Each batch is rendered into compact markdown tables by ordinary code. No model is asked to shape its own input, and nothing is filtered, ranked or summarised — rendering changes presentation only, never the contents of the candidate list.",
      "That invariant is what lets the caller validate the response against the same dictionary it rendered from. The residual risk is positional: a faithful rendering of a very long candidate list is still a very long prompt, and position within it measurably affects what gets chosen.",
    ],
  },
  SEL: {
    title: "Select Relevant Drugs",
    sub: "Returns only the drug identifiers it was handed, nothing invented",
    paragraphs: [
      "One schema-constrained call per batch, issued in parallel. The model selects the relevant products for each recommendation and returns their identifiers — identifiers drawn only from the dictionary it was given.",
      "This is containment by structure rather than by instruction. A prompt asking the model not to invent drugs is a request; a schema accepting only identifiers the caller already holds is a guarantee that survives model changes, prompt drift and adversarial input. What it guarantees is the shelf, never that it was the right shelf.",
    ],
  },

  AGG: {
    title: "Combine Batch Results",
    sub: "One failed batch costs that batch, not the patient",
    paragraphs: [
      "Batch results are collected as they complete and combined into one result set. Each batch handles and traces its own failure, so a single malformed response degrades one batch rather than the whole patient's results.",
      "The ambiguity to fix: a failed batch and a batch that legitimately selected nothing both contribute an empty list. The difference exists in the trace and not in the value the next stage receives.",
    ],
  },
  SYN: {
    title: "Map Recommendations To Covered Drugs",
    sub: "Attach chosen drug identifiers to each recommendation — nothing clinical is touched",
    paragraphs: [
      "The selected drugs are reduced to their identifiers and attached to the recommendation they belong to, keyed by the identifier minted back in extraction. The result is a plain map — one recommendation's ID to a list of covered-drug IDs — alongside the plan name and formulary details this run resolved earlier. No drug names, no clinical text, and no rendering happen at this step.",
      "A recommendation that was skipped or whose enrichment failed simply has no entry in this map; its original clinical content elsewhere is never touched or blocked by that absence. This is the rule the whole pipeline is built around: formulary intelligence makes a clinical recommendation more useful and is never permitted to make it absent.",
    ],
  },
  OUT: {
    title: "Save The Recommendation Update",
    sub: "Written back to the patient's record — nothing is returned to a caller",
    paragraphs: [
      "This pipeline started from an event, not a request, so there is no caller waiting on a response to hand this back to. The finished map is instead persisted onto the same recommendation record it was read from at the start — the identifiers attached, the clinical content untouched.",
      "Whatever a prescriber eventually sees is assembled later, by whatever system reads that updated record — outside this pipeline entirely. The boundary matters here too: this step writes coverage identifiers, never a ranked clinical preference, and never anything resembling a prescribing decision.",
    ],
  },

  TRC: {
    title: "Trace Writer",
    sub: "Skips recorded as deliberately as results, at every step of the run",
    paragraphs: [
      "Every branch across the whole pipeline — not only this final step — writes a structured record: a message plus a structured payload, keyed to the patient and the run. Successes, skips with their reason, and failures with their error all land in the same store.",
      "In a pipeline that degrades rather than raising, the interesting events are the ones that produced nothing, and a trace recording only successful work cannot explain an empty response. Writes are gated by configuration and their failures are swallowed, so a tracing outage can never become a clinical outage — which is also why a store that is silently rejecting writes looks exactly like a pipeline with nothing to say.",
    ],
  },
  TOK: {
    title: "Token Budget",
    sub: "Every model call in this pipeline acquires a slot before it proceeds",
    paragraphs: [
      "Tokens are counted for a prospective call and a slot is acquired against a shared budget before the call is issued, then released after — for every constrained model call in this pipeline, not only the ones near the end. Acquisition and release are paired so an abandoned call cannot leak a slot.",
      "The budget governs calls, but concurrency is decided before any call is made — each request fans out into its own pool with no ceiling shared across patients. Pressure therefore arrives as queuing at the very end, where it is hardest to attribute back to the fan-out that caused it.",
    ],
  },
  MET: {
    title: "Usage Metrics",
    sub: "How much and how fast, across every model call — not whether it is right",
    paragraphs: [
      "Per-call model usage — identity, token counts, timing — is published asynchronously to a metrics stream for aggregate attribution, for every model call this pipeline makes. Metrics describe the call and deliberately carry no clinical content.",
      "This is where the system's honest gap sits. Everything here is instrumented for tracing and operations, and nothing for correctness: a release that degrades drug-class accuracy changes no metric on this panel. Spend, latency and volume all look entirely normal while the answers get worse.",
    ],
  },
};

function PhasePanel({ data }) {
  return h(
    "div",
    { className: `hld-phase hld-phase--${data.phase}` },
    h("div", { className: "hld-phase-heading" },
      data.index ? h("span", { className: "hld-phase-index" }, data.index) : null,
      h("div", null,
        h("p", { className: "hld-phase-title" }, data.title),
        h("p", { className: "hld-phase-note" }, data.note)
      )
    )
  );
}

const HLD_ICONS = {
  description: [
    ["rect", { x: 5, y: 3, width: 14, height: 18, rx: 2 }],
    ["path", { d: "M9 8h6M9 12h6M9 16h4" }],
  ],
  documents: [
    ["path", { d: "M8 6V3h11v14h-3" }],
    ["rect", { x: 5, y: 6, width: 11, height: 15, rx: 2 }],
    ["path", { d: "M8 11h5M8 15h5" }],
  ],
  code: [
    ["path", { d: "m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" }],
  ],
  ingestion: [
    ["path", { d: "M4 4h16l-6.5 7.5v5.5L10 20v-8.5z" }],
  ],
  database: [
    ["ellipse", { cx: 12, cy: 5, rx: 7, ry: 3 }],
    ["path", { d: "M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" }],
  ],
  queue: [
    ["rect", { x: 3, y: 5, width: 13, height: 4, rx: 1 }],
    ["rect", { x: 3, y: 11, width: 13, height: 4, rx: 1 }],
    ["rect", { x: 3, y: 17, width: 13, height: 4, rx: 1, opacity: 0.45 }],
    ["path", { d: "M19 8v11m0 0-3-3m3 3 3-3" }],
  ],
  search: [
    ["circle", { cx: 10, cy: 10, r: 5.5 }],
    ["path", { d: "m14.2 14.2 5.3 5.3M7.5 10h5" }],
  ],
  package: [
    ["path", { d: "m4 7 8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10" }],
  ],
  table: [
    ["rect", { x: 3, y: 4, width: 18, height: 16, rx: 2 }],
    ["path", { d: "M3 9h18M9 9v11M15 9v11" }],
  ],
  logic: [
    ["circle", { cx: 5, cy: 6, r: 2 }],
    ["circle", { cx: 19, cy: 6, r: 2 }],
    ["circle", { cx: 12, cy: 18, r: 2 }],
    ["path", { d: "M7 6h10M6.5 7.5l4.2 8.7M17.5 7.5l-4.2 8.7" }],
  ],
  gate: [
    ["path", { d: "m12 3 9 9-9 9-9-9z" }],
    ["path", { d: "m8.5 12 2.2 2.2 4.8-4.8" }],
  ],
  gap: [
    ["circle", { cx: 12, cy: 12, r: 9 }],
    ["path", { d: "M8.5 8.5l7 7M15.5 8.5l-7 7" }],
  ],
  scaffold: [
    ["rect", { x: 3, y: 4, width: 18, height: 16, rx: 2 }],
    ["path", { d: "M3 9h18M8 9v11M8 14h13" }],
  ],
  function: [
    ["path", { d: "M11 4H9.5A2.5 2.5 0 0 0 7 6.5V18M4.5 10H11M14 9l6 6M20 9l-6 6" }],
  ],
  assembly: [
    ["rect", { x: 3, y: 4, width: 8, height: 7, rx: 1.5 }],
    ["rect", { x: 13, y: 4, width: 8, height: 7, rx: 1.5 }],
    ["rect", { x: 8, y: 14, width: 8, height: 7, rx: 1.5 }],
    ["path", { d: "M7 11v1.5h10V11M12 12.5V14" }],
  ],
  contract: [
    ["rect", { x: 5, y: 4, width: 14, height: 17, rx: 2 }],
    ["path", { d: "M9 4V2h6v2M8.5 12l2 2 5-5M9 18h6" }],
  ],
  reviewers: [
    ["circle", { cx: 12, cy: 8, r: 3 }],
    ["circle", { cx: 5.5, cy: 10, r: 2 }],
    ["circle", { cx: 18.5, cy: 10, r: 2 }],
    ["path", { d: "M6 20c.4-4 2.4-6 6-6s5.6 2 6 6M2.5 19c.2-2.7 1.4-4.2 3.6-4.5M21.5 19c-.2-2.7-1.4-4.2-3.6-4.5" }],
  ],
  decision: [
    ["path", { d: "m12 3 8 8-8 8-8-8zM12 19v3M4 11H1M20 11h3" }],
  ],
  fix: [
    ["path", { d: "M8 6h12M8 12h8M8 18h10M4 6h.01M4 12h.01M4 18h.01" }],
  ],
  patch: [
    ["path", { d: "M7 17 17 7M7.5 7.5l9 9" }],
    ["circle", { cx: 9.5, cy: 9.5, r: 4.5 }],
    ["circle", { cx: 14.5, cy: 14.5, r: 4.5 }],
  ],
  guard: [
    ["path", { d: "M12 3 20 6v5c0 5-3.2 8.5-8 10-4.8-1.5-8-5-8-10V6z" }],
    ["path", { d: "m8.5 12 2.2 2.2 4.8-4.8" }],
  ],
  nuance: [
    ["circle", { cx: 12, cy: 12, r: 8 }],
    ["circle", { cx: 12, cy: 12, r: 3 }],
    ["path", { d: "M12 2v3M12 19v3M2 12h3M19 12h3" }],
  ],
  evaluate: [
    ["path", { d: "M4 20V10M10 20V4M16 20v-7M22 20H2" }],
  ],
  accept: [
    ["circle", { cx: 12, cy: 12, r: 9 }],
    ["path", { d: "m8 12 2.7 2.7L16.5 9" }],
  ],
  artifact: [
    ["path", { d: "M4 7h16v13H4zM3 3h18v4H3zM9 11h6" }],
  ],
  repository: [
    ["path", { d: "M3 6h7l2 2h9v12H3z" }],
    ["path", { d: "M8 13h8M12 10v6" }],
  ],
  pipeline: [
    ["circle", { cx: 5, cy: 6, r: 2.5 }],
    ["circle", { cx: 19, cy: 12, r: 2.5 }],
    ["circle", { cx: 5, cy: 18, r: 2.5 }],
    ["path", { d: "M7.5 6h3.5a3 3 0 0 1 3 3v0a3 3 0 0 0 3 3M7.5 18H11a3 3 0 0 0 3-3v0a3 3 0 0 1 3-3" }],
  ],
  runtime: [
    ["rect", { x: 3, y: 4, width: 18, height: 16, rx: 2 }],
    ["path", { d: "M3 9h18M7 14l3 2-3 2M13 18h4" }],
  ],
  report: [
    ["path", { d: "M6 3h9l4 4v14H6zM15 3v5h4" }],
    ["path", { d: "M9 17v-3M12.5 17v-6M16 17v-8" }],
  ],
};

function HldIcon({ name }) {
  const shapes = HLD_ICONS[name] || HLD_ICONS.description;
  return h(
    "svg",
    { viewBox: "0 0 24 24", focusable: "false", "aria-hidden": "true" },
    ...shapes.map(([element, props], index) => h(element, { ...props, key: index }))
  );
}

function StepCard({ data }) {
  const classes = [
    "hld-node",
    `hld-node--${data.phase}`,
    data.tone ? `hld-node--tone-${data.tone}` : "",
    data.gate ? "hld-node--gate" : "",
    data.blocked ? "hld-node--blocked" : "",
  ].filter(Boolean).join(" ");

  return h(
    "div",
    {
      className: classes,
      tabIndex: 0,
      role: "group",
      "aria-label": `${data.title}. ${data.sub || ""}`,
      onFocus: (event) => data.onHover(event.currentTarget, data.id, true),
      onBlur: (event) => data.onLeave(event.currentTarget),
    },
    h(Handle, { type: "target", position: Position.Left, id: "left", className: "hld-handle" }),
    h(Handle, { type: "target", position: Position.Top, id: "top", className: "hld-handle" }),
    h("span", { className: "hld-node-icon", "aria-hidden": "true" }, h(HldIcon, { name: data.icon })),
    h("span", { className: "hld-node-tag" }, data.tag),
    h("p", { className: "hld-node-title" }, data.title),
    data.sub ? h("p", { className: "hld-node-sub" }, data.sub) : null,
    data.comparison?.length
      ? h(
          "div",
          { className: "hld-node-comparison", "aria-label": "Pass rate comparison" },
          ...data.comparison.map((metric) => h(
            "div",
            { className: "hld-comparison-row", key: metric.label },
            h("span", null, metric.label),
            h("strong", null, metric.display || `${metric.value}%`),
            h("i", { "aria-hidden": "true" }, h("b", { style: { width: `${metric.value}%` } }))
          ))
        )
      : null,
    h(Handle, { type: "source", position: Position.Right, id: "right", className: "hld-handle" }),
    h(Handle, { type: "source", position: Position.Bottom, id: "bottom", className: "hld-handle" })
  );
}

function OuterLoopEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style, label, data }) {
  const viaY = data?.viaY ?? Math.max(sourceY, targetY) + 80;
  const viaX = data?.viaX ?? Math.min(sourceX, targetX) - 40;
  const path = `M ${sourceX},${sourceY} L ${sourceX},${viaY} L ${viaX},${viaY} L ${viaX},${targetY} L ${targetX},${targetY}`;
  const labelX = (sourceX + viaX) / 2;
  const labelY = viaY - 13;
  const labelWidth = Math.max(62, (label?.length || 0) * 7.4 + 20);
  return h(
    React.Fragment,
    null,
    h(BaseEdge, { id, path, markerEnd, style }),
    label
      ? h(
          "g",
          { className: "hld-loop-label", transform: `translate(${labelX} ${labelY})` },
          h("rect", { x: -labelWidth / 2, y: -12, width: labelWidth, height: 24, rx: 8, ry: 8 }),
          h("text", { x: 0, y: 1, textAnchor: "middle", dominantBaseline: "middle" }, label)
        )
      : null
  );
}

const NODE_TYPES = { phase: PhasePanel, step: StepCard };
const EDGE_TYPES = { outerLoop: OuterLoopEdge };

function flowEdge(id, source, target, options = {}) {
  const palette = {
    main: { color: "#50615a", dash: undefined, width: 1.8 },
    evidence: { color: "#55758a", dash: "5 5", width: 1.45 },
    loop: { color: "#8a5574", dash: "7 5", width: 2 },
    blocked: { color: "#9d4b41", dash: "5 4", width: 1.7 },
  }[options.kind || "main"];

  return {
    id,
    source,
    target,
    sourceHandle: options.sourceHandle || "right",
    targetHandle: options.targetHandle || "left",
    type: options.type || "smoothstep",
    label: options.label,
    labelStyle: { fill: "#e2bc88", fontSize: 12.5, fontWeight: 750, letterSpacing: "0.035em" },
    labelBgStyle: { fill: "#101614", fillOpacity: 0.98 },
    labelBgPadding: [9, 6],
    labelBgBorderRadius: 8,
    markerEnd: { type: MarkerType.ArrowClosed, width: 17, height: 17, color: palette.color },
    style: { stroke: palette.color, strokeWidth: palette.width, strokeDasharray: palette.dash },
    data: options.data,
    zIndex: options.zIndex ?? (options.label ? 4 : 0),
  };
}


function buildElements(onHover, onLeave) {
  const nodes = Object.entries(PHASES).map(([phase, box]) => ({
    id: `phase-${phase}`,
    type: "phase",
    position: { x: box.x, y: box.y },
    style: { width: box.w, height: box.h },
    data: { phase, index: box.index, title: box.title, note: box.note },
    draggable: false,
    selectable: false,
    focusable: false,
    zIndex: 0,
  }));

  Object.entries(LAYOUT).forEach(([id, layout]) => {
    const detail = DETAILS[id];
    nodes.push({
      id,
      type: "step",
      position: { x: layout.x, y: layout.y },
      style: { width: layout.w },
      data: { id, ...detail, ...layout, onHover, onLeave },
      draggable: false,
      selectable: false,
      zIndex: 2,
    });
  });

  const edges = [
    /* Inputs -> coverage */
    flowEdge("pat-plan", "PAT", "PLAN"),
    flowEdge("plan-cov", "PLAN", "COV", { sourceHandle: "bottom", targetHandle: "top" }),

    /* Clinical input -> extraction */
    flowEdge("recs-path", "RECS", "PATH"),
    flowEdge("path-acts", "PATH", "ACTS", { sourceHandle: "bottom", targetHandle: "top" }),

    /* Extraction -> classification */
    flowEdge("acts-cls", "ACTS", "CLS"),
    flowEdge("prompt-pfetch", "PROMPT", "PFETCH", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("pfetch-cls", "PFETCH", "CLS", { sourceHandle: "bottom", targetHandle: "top", kind: "evidence" }),
    flowEdge("cls-retry", "CLS", "RETRY", { sourceHandle: "bottom", targetHandle: "top" }),

    /* Classification -> retrieval */
    flowEdge("retry-skip", "RETRY", "SKIP", { label: "class identified", zIndex: 4 }),
    flowEdge("cov-idx", "COV", "IDX", { kind: "evidence", label: "formulary", zIndex: 4 }),
    flowEdge("skip-idx", "SKIP", "IDX", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("idx-mrg", "IDX", "MRG", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("mrg-cand", "MRG", "CAND", { sourceHandle: "bottom", targetHandle: "top" }),

    /* Retrieval -> selection */
    flowEdge("cand-via", "CAND", "VIA", { label: "closed set", zIndex: 4 }),
    flowEdge("via-bat", "VIA", "BAT", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("bat-tbl", "BAT", "TBL", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("tbl-sel", "TBL", "SEL", { sourceHandle: "bottom", targetHandle: "top" }),

    /* Selection -> synthesis */
    flowEdge("sel-agg", "SEL", "AGG"),
    flowEdge("agg-syn", "AGG", "SYN", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("syn-out", "SYN", "OUT", { sourceHandle: "bottom", targetHandle: "top" }),

    /* Cross-cutting governance */
    flowEdge("syn-trc", "SYN", "TRC", { kind: "evidence" }),
    flowEdge("syn-tok", "SYN", "TOK", { kind: "evidence" }),
    flowEdge("syn-met", "SYN", "MET", { kind: "evidence" }),
  ];

  return { nodes, edges };
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderBubbleBlocks(blocks) {
  return blocks.map((block) => {
    if (block.type === "paragraph") return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === "heading") return `<h4>${escapeHtml(block.text)}</h4>`;
    if (block.type === "code") return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    const tag = block.type === "ordered" ? "ol" : "ul";
    const items = (block.items || []).map((item) => {
      if (typeof item === "string") return `<li>${escapeHtml(item)}</li>`;
      const separator = item.separator === undefined ? ":" : item.separator;
      return `<li><strong>${escapeHtml(item.label)}${escapeHtml(separator)}</strong> ${escapeHtml(item.text)}</li>`;
    }).join("");
    return `<${tag}>${items}</${tag}>`;
  }).join("");
}

const BUBBLE_HOVER_DELAY = 1000;
let bubbleShowTimer = null;
let bubbleHideTimer = null;

function cancelBubbleShow() {
  if (bubbleShowTimer) window.clearTimeout(bubbleShowTimer);
  bubbleShowTimer = null;
}

function keepBubbleOpen() {
  if (bubbleHideTimer) window.clearTimeout(bubbleHideTimer);
  bubbleHideTimer = null;
}

function hideBubble(delay = 110) {
  cancelBubbleShow();
  const bubble = document.getElementById("fullFlowBubble");
  if (!bubble) return;
  keepBubbleOpen();
  bubbleHideTimer = window.setTimeout(() => {
    bubble.classList.remove("is-open");
    window.setTimeout(() => {
      if (!bubble.classList.contains("is-open")) bubble.hidden = true;
    }, 140);
  }, delay);
}

function showBubble(nodeElement, detail) {
  cancelBubbleShow();
  const shell = document.getElementById("fullFlowShell");
  const bubble = document.getElementById("fullFlowBubble");
  if (!shell || !bubble || !nodeElement || !detail) return;
  keepBubbleOpen();

  const points = detail.points?.length
    ? `<ul>${detail.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>`
    : "";
  const example = detail.example
    ? `<p class="full-flow-bubble-example">${escapeHtml(detail.example)}</p>`
    : "";
  const body = detail.blocks?.length
    ? `<div class="full-flow-bubble-copy">${renderBubbleBlocks(detail.blocks)}</div>`
    : detail.paragraphs?.length
      ? `<div class="full-flow-bubble-copy">${detail.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>`
      : `<p>${escapeHtml(detail.summary)}</p>`;

  bubble.innerHTML = `
    <span>${escapeHtml(detail.tag || "Component detail")}</span>
    <h3>${escapeHtml(detail.title)}</h3>
    ${body}
    ${points}
    ${example}
  `;
  bubble.onpointerenter = keepBubbleOpen;
  bubble.onpointerleave = () => hideBubble();
  bubble.onwheel = (event) => event.stopPropagation();
  bubble.hidden = false;

  const shellRect = shell.getBoundingClientRect();
  const nodeRect = nodeElement.getBoundingClientRect();
  const bubbleRect = bubble.getBoundingClientRect();
  const gutter = 16;
  let left = nodeRect.right - shellRect.left + 14;
  if (left + bubbleRect.width > shellRect.width - gutter) {
    left = nodeRect.left - shellRect.left - bubbleRect.width - 14;
  }
  left = Math.max(gutter, Math.min(left, shellRect.width - bubbleRect.width - gutter));
  let top = nodeRect.top - shellRect.top + nodeRect.height / 2 - bubbleRect.height / 2;
  top = Math.max(gutter, Math.min(top, shellRect.height - bubbleRect.height - gutter));
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
  requestAnimationFrame(() => bubble.classList.add("is-open"));
}

function scheduleBubble(nodeElement, detail) {
  cancelBubbleShow();
  bubbleShowTimer = window.setTimeout(() => {
    bubbleShowTimer = null;
    showBubble(nodeElement, detail);
  }, BUBBLE_HOVER_DELAY);
}

function FullHldFlow() {
  const onHover = React.useCallback((nodeElement, nodeId, immediate = false) => {
    const detail = DETAILS[nodeId];
    if (!detail) return;
    const bubbleDetail = { ...detail, tag: LAYOUT[nodeId]?.tag };
    if (immediate) showBubble(nodeElement, bubbleDetail);
    else scheduleBubble(nodeElement, bubbleDetail);
  }, []);
  const onLeave = React.useCallback(() => hideBubble(), []);
  const { nodes, edges } = React.useMemo(() => buildElements(onHover, onLeave), [onHover, onLeave]);

  const handleMouseEnter = React.useCallback((event, node) => {
    if (node.type !== "phase") onHover(event.currentTarget || event.target, node.id);
  }, [onHover]);
  const handleMouseLeave = React.useCallback(() => onLeave(), [onLeave]);

  return h(
    ReactFlow,
    {
      nodes,
      edges,
      nodeTypes: NODE_TYPES,
      edgeTypes: EDGE_TYPES,
      defaultViewport: { x: 28, y: 12, zoom: 0.78 },
      minZoom: 0.32,
      maxZoom: 1.5,
      nodesDraggable: false,
      nodesConnectable: false,
      elementsSelectable: false,
      panOnScroll: true,
      panOnScrollMode: "free",
      panOnScrollSpeed: 0.9,
      zoomOnScroll: false,
      zoomOnPinch: true,
      zoomOnDoubleClick: false,
      panOnDrag: true,
      preventScrolling: true,
      proOptions: { hideAttribution: false },
      onNodeMouseEnter: handleMouseEnter,
      onNodeMouseLeave: handleMouseLeave,
      onMoveStart: () => hideBubble(0),
    },
    h(Background, { gap: 24, size: 1, color: "rgba(16, 22, 20, 0.07)" }),
    h(Controls, { showInteractive: false, position: "bottom-right" })
  );
}

let root = null;

window.mountFullFlowReactFlow = function mountFullFlowReactFlow() {
  const container = document.getElementById("fullFlowReactFlow");
  if (!container) return;
  if (!root) root = createRoot(container);
  root.render(h(FullHldFlow));
};

window.unmountFullFlowReactFlow = function unmountFullFlowReactFlow() {
  hideBubble();
  if (!root) return;
  root.unmount();
  root = null;
};
