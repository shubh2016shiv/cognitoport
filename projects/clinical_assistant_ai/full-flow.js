/* ============================================================
   Full HLD: horizontal, explorable React Flow canvas
   ============================================================
   One left-to-right story: a clinician's question arrives over an
   authenticated request, a stream opens before any work starts, evidence
   and patient context are fetched in two concurrent lanes, one prompt is
   staged and metered, and the model streams an answer back down the same
   channel — with one bounded branch into a formulary lookup. Phase
   backgrounds and their components share one colour family. Nodes never
   navigate away: hover and keyboard focus reveal a compact bubble instead.

   Phase keys reuse the stylesheet's existing colour families
   (inputs / knowledge / context / plan / execute / critique / post).
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType, BaseEdge } from "@xyflow/react";

const h = React.createElement;

const PHASES = {
  inputs:    { index: "01", title: "Request Admission", note: "Verify access, record the question, start the live response", x: 0,    y: 40,  w: 320, h: 1000 },
  knowledge: { index: "02", title: "Guideline Retrieval", note: "Search US clinical guidelines in parallel with patient context", x: 370,  y: 40,  w: 320, h: 1000 },
  context:   { index: "03", title: "Patient Context Assembly", note: "Fetch the clinical record, last 10 chat turns and current care measures together", x: 740,  y: 40,  w: 340, h: 1000 },
  plan:      { index: "04", title: "Prompt Assembly And Capacity", note: "Load instructions, build one grounded prompt and reserve model capacity", x: 1130, y: 40,  w: 340, h: 1000 },
  execute:   { index: "05", title: "Streaming Generation", note: "Start the live clinical answer, or pause for a formulary lookup", x: 1520, y: 40,  w: 360, h: 1000 },
  critique:  { index: "06", title: "Patient Formulary Lookup", note: "Find covered drugs for the requested classes, then complete the answer", x: 1930, y: 40,  w: 380, h: 1000 },
  post:      { index: "07", title: "Finalize, Save And Monitor", note: "Add supporting sources, finish the live response, save the chat and record operational outcomes", x: 2360, y: 40,  w: 700, h: 1000 },
};

const LAYOUT = {
  ASK:      { phase: "inputs", icon: "description", tag: "CLINICIAN QUESTION", x: 35,   y: 165, w: 250 },
  AUTH:     { phase: "inputs", icon: "guard", tag: "ACCESS CHECK", x: 35,   y: 395, w: 250 },
  TURN:     { phase: "inputs", icon: "database", tag: "QUESTION RECORDED", x: 35,   y: 620, w: 250 },
  SSE:      { phase: "inputs", icon: "runtime", tag: "LIVE RESPONSE", x: 35,   y: 845, w: 250, gate: true },

  EMB:      { phase: "knowledge", icon: "nuance", tag: "EMBEDDING CALL", x: 405,  y: 250, w: 250 },
  SRCH:     { phase: "knowledge", icon: "search", tag: "HYBRID + RERANK", x: 405,  y: 500, w: 250 },
  CITE:     { phase: "knowledge", icon: "contract", tag: "CITATION-READY GUIDELINES", x: 405,  y: 750, w: 250, gate: true },

  PCACHE:   { phase: "context", icon: "database", tag: "CLINICAL SUMMARY + RECORD", x: 775,  y: 250, w: 270 },
  HIST:     { phase: "context", icon: "queue", tag: "LAST 10 CHAT TURNS", x: 775,  y: 500, w: 270 },
  VIEWS:    { phase: "context", icon: "documents", tag: "RECOMMENDATIONS + PREVENTIVE CARE", x: 775,  y: 750, w: 270 },

  REG:      { phase: "plan", icon: "repository", tag: "VERSIONED CHATBOT INSTRUCTIONS", x: 1165, y: 205, w: 270 },
  STAGE:    { phase: "plan", icon: "assembly", tag: "GUIDELINES + PATIENT CONTEXT", x: 1165, y: 455, w: 270 },
  TOK:      { phase: "plan", icon: "gate", tag: "MODEL CAPACITY", x: 1165, y: 705, w: 270, gate: true },

  LLM1:     { phase: "execute", icon: "logic", tag: "STREAMING MODEL RESPONSE", x: 1555, y: 205, w: 290 },
  FIRST:    { phase: "execute", icon: "decision", tag: "ANSWER OR FORMULARY LOOKUP", x: 1555, y: 455, w: 290, gate: true },
  FILT:     { phase: "execute", icon: "runtime", tag: "LIVE RESPONSE TO CLINICIAN", x: 1555, y: 705, w: 290 },

  ARGS:     { phase: "critique", icon: "function", tag: "DRUG CLASSES + COVERAGE LIMITS", x: 1965, y: 250, w: 300 },
  FORM:     { phase: "critique", icon: "table", tag: "PATIENT PLAN + FORMULARY", x: 1965, y: 500, w: 300 },
  LLM2:     { phase: "critique", icon: "logic", tag: "FINAL ANSWER WITH COVERAGE", x: 1965, y: 750, w: 300, gate: true },

  REF:      { phase: "post", icon: "accept", tag: "SOURCES USED IN THIS ANSWER", x: 2400, y: 205, w: 280 },
  SAVE:     { phase: "post", tone: "success", icon: "runtime", tag: "LIVE RESPONSE COMPLETE", x: 2400, y: 455, w: 280 },
  DONE:     { phase: "post", tone: "artifact", icon: "artifact", tag: "SAVED CHAT TURN", x: 2400, y: 705, w: 280 },

  TRACE:    { phase: "post", icon: "report", tag: "REQUEST TIMINGS", x: 2740, y: 205, w: 280 },
  METRIC:   { phase: "post", icon: "evaluate", tag: "USAGE + CONVERSATION EVENTS", x: 2740, y: 455, w: 280 },
  GAP:      { phase: "post", icon: "gap", tag: "QUALITY MEASUREMENT GAP", x: 2740, y: 705, w: 280 },
};

const DETAILS = {
  ASK: {
    title: "The Clinician Asks A Question",
    sub: "Free text, a patient in view, and a conversation already in progress",
    paragraphs: [
      "A clinician types a question while looking at one patient's chart. What arrives is the question text, a reference to that patient, and — often — an existing thread identifier, because this is rarely the first thing they asked. That last part matters more than it looks: a question like 'and the extended-release version?' carries almost no meaning on its own, and the pipeline has to reconstruct the rest from the conversation it can load.",
      "This is an interactive request with a person waiting on it, which is the constraint every later decision answers to. There is no queue absorbing bursts and no tolerance for a deliberation step that spends a model call deciding what to do — the budget is roughly two and a half seconds end-to-end, and about two of those are already committed before a single token of answer exists.",
    ],
  },
  AUTH: {
    title: "Authenticate Clinician Access",
    sub: "Verify who is asking before any patient information is loaded",
    paragraphs: [
      "The clinician's access token is verified before the chatbot loads patient information or starts answering. A failed check stops the request at this boundary.",
      "Authentication confirms who is asking. Patient-level authorization is a separate responsibility and must also be enforced before protected information is exposed.",
    ],
  },
  TURN: {
    title: "Record The Question",
    sub: "Save what was asked before the chatbot starts generating an answer",
    paragraphs: [
      "The clinician's turn is written to the transcript before generation is attempted. If the model call fails, if the process dies mid-stream, if retrieval throws — the record still shows what was asked. Writing it afterwards would mean the only trace of a failed question is an error log.",
      "The saved question also gives the eventual answer a stable conversation turn to attach to, keeping the transcript coherent when the response completes or fails.",
    ],
  },
  SSE: {
    title: "Open The Response Stream",
    sub: "Show progress while retrieval and answer generation are still running",
    paragraphs: [
      "A server-sent event stream is opened and a status frame is pushed straight away, before retrieval or context assembly begin. The two seconds of pre-model work then happen behind a live connection that is already reporting progress, rather than behind a request that has not visibly started.",
      "Transport headers are set to stop intermediaries buffering the response — and this is the fragile part of the design. Every header can be correct and the stream can still arrive as one block because a single proxy in the path re-buffers it. The application cannot detect that: from the server's side the response streamed perfectly, and only the clinician sees the pause.",
    ],
  },

  EMB: {
    title: "Embed The Question",
    sub: "One model call on the critical path, before the search can be issued",
    paragraphs: [
      "The question text is converted to a vector using the same embedding deployment the guideline index was built with. Configuration rather than a literal, so the search-time embedding cannot silently diverge from the index-time one — a mismatch that would degrade every result without producing a single error.",
      "The limitation is that it embeds the question as asked, not as meant. A follow-up that depends on the previous turn embeds as though it were a standalone question, so conversational context — which the prompt will later receive in full — is absent from the thing that decides what evidence gets retrieved.",
    ],
  },
  SRCH: {
    title: "Hybrid Search The Guideline Corpus",
    sub: "Keyword and vector in one query, semantically reranked — about 0.9 seconds",
    paragraphs: [
      "A single query combines lexical matching over the document text with nearest-neighbour search over embeddings, then reranks the combined result semantically and returns a bounded set of passages with extractive captions. One query rather than two searches merged afterwards, because the reranking needs to see both signals together.",
      "At roughly 0.9 seconds this is the dominant cost of its lane and the second-widest call in the request. The result ceiling is fixed at the query rather than adjusted by relevance, which keeps prompt size predictable regardless of how many passages could plausibly have matched.",
      "A miss here is undetectable downstream. If the guideline that should ground the answer ranks below five near-misses, the model answers from parametric knowledge and the reference list simply omits it — which looks exactly like an answer that needed no citation.",
    ],
  },
  CITE: {
    title: "Prepare Guidelines For Citation",
    sub: "Give each retrieved guideline source a stable citation number before the model answers",
    paragraphs: [
      "Retrieved passages are grouped by guideline source and given stable citation numbers for this answer. Existing citation markers are removed first so they cannot be confused with the new source numbers.",
      "This lets the model cite a specific guideline while answering and lets the chatbot build a final reference list containing only the sources the answer actually used.",
    ],
  },

  PCACHE: {
    title: "Load Patient Clinical Summary, Labs And Vitals",
    sub: "Also includes profile, medications, conditions, allergies, notes, lifestyle, procedures, appointments, ASCVD risk and immunizations",
    paragraphs: [
      "The chatbot loads the patient summary plus the clinical record fields passed into the model: profile, labs, vitals, medications, conditions, clinical notes, lifestyle factors, allergies, procedures, appointments, ASCVD risk and immunizations.",
      "The record is served from a read-through cache for speed. The key risk is freshness: a newly posted result or medication change can be newer than the cached view used for the answer.",
    ],
  },
  HIST: {
    title: "Fetch Last 10 Chat History",
    sub: "Up to 10 recent clinician–chatbot turns used to understand follow-up questions",
    paragraphs: [
      "The configured history window is 10 conversation turns, read as up to 20 user and assistant messages. Only complete user–assistant pairs are carried forward, so a follow-up such as 'what about the extended-release version?' retains its earlier meaning.",
      "Previous reference lists are removed before reuse so old citation numbers cannot be mistaken for sources retrieved for the current answer. This fetch is also the slowest input in the phase and currently determines when the combined context is ready.",
    ],
  },
  VIEWS: {
    title: "Load Clinical Recommendations And Preventive Care Measures",
    sub: "Existing clinical recommendations, preventive-care needs and quality measures",
    paragraphs: [
      "The chatbot brings in care insights that already exist for this patient. It does not create or reprioritize them here; it carries them forward as supporting context for the answer.",
      "Recommendations, preventive-care needs and quality measures are loaded independently. A missing insight can be omitted without discarding the patient record or recent conversation.",
    ],
  },

  REG: {
    title: "Load Versioned Chatbot Instructions",
    sub: "Select the system instructions for standard chat or formulary-enabled chat",
    paragraphs: [
      "The chatbot loads a versioned system prompt at runtime. Standard chat and formulary-enabled chat use different instruction versions so the available behavior matches the model capabilities for this request.",
      "Keeping instructions outside the application makes them independently reviewable and replaceable. The trade-off is cache freshness: a corrected prompt may not reach an already-running process until its cached copy is refreshed.",
    ],
  },
  STAGE: {
    title: "Build One Grounded Clinical Prompt",
    sub: "Combine chatbot instructions, citable US guidelines, patient context, chat history and the clinician's question",
    paragraphs: [
      "The versioned instructions receive the citation-ready guideline block. Patient summary, recommendations, preventive care and quality measures are added as established conversation, followed by the last 10 chat turns and the clinician's current question.",
      "Treating patient content as conversation rather than system instruction separates what the chatbot should do from the clinical information it should reason about. Clinical text can still contain instruction-like language, so that boundary reduces rather than eliminates prompt-injection risk.",
    ],
  },
  TOK: {
    title: "Reserve Capacity For The Model Call",
    sub: "Estimate prompt tokens and wait for available shared model capacity — about 0.27s",
    paragraphs: [
      "The completed prompt is measured for token usage, then the chatbot waits for a client from the shared model quota. The formulary tool is attached only when that capability is enabled for the request.",
      "Central capacity control prevents concurrent chatbot requests from exceeding the shared model allowance. This reservation is a sequential network call on the clinician's wait path and currently adds about 0.27 seconds.",
    ],
  },

  LLM1: {
    title: "Stream The Clinical Response",
    sub: "Wait up to 10 seconds for the first response, then receive each answer fragment as it is generated",
    paragraphs: [
      "The grounded clinical prompt is sent to the model as a streaming request. The chatbot waits up to 10 seconds for the first response and retries once if the model does not begin or the stream fails.",
      "After the first response arrives, later fragments are processed as they are generated. Streaming improves the clinician's time to first visible text even though it does not reduce the model's total generation time.",
    ],
  },
  FIRST: {
    title: "Route Answer Or Formulary Lookup",
    sub: "Continue the live answer, or pause it when the model requests patient-specific formulary data",
    paragraphs: [
      "The chatbot inspects the model response before displaying it. Normal answer text continues toward the clinician. A formulary request sends an interrupt signal, withholds answer text and branches to the patient's coverage lookup.",
      "Formulary arguments can arrive across several response fragments, so the chatbot collects them until the request is complete. If the model stalls after its first response, this stage has no later-fragment timeout.",
    ],
  },
  FILT: {
    title: "Stream The Answer To The Clinician",
    sub: "Send each answer fragment through the already-open live response channel as soon as it is ready",
    paragraphs: [
      "Each generated answer fragment is wrapped as a server-sent event and delivered through the response channel opened during Request Admission. The clinician can begin reading while the model is still generating the rest of the answer.",
      "Before a fragment is sent, internal numeric citation markers are hidden from the visible prose and their guideline IDs are retained. When generation finishes, those IDs are used to append the supporting references, followed by the stream completion signal.",
    ],
  },

  ARGS: {
    title: "Collect Drug Classes And Coverage Limits",
    sub: "Capture the requested drug classes and any prior-authorization, quantity, step-therapy or supply limits",
    paragraphs: [
      "The model's formulary request can arrive across several streamed fragments. The chatbot joins them into one request containing the relevant drug classes and any explicitly requested prior-authorization, quantity-limit, step-therapy or non-extended-supply restrictions.",
      "The patient identifier and requested classes are validated before coverage services are called. An incorrect drug class inferred from an ambiguous question can still produce a valid but irrelevant lookup.",
    ],
  },
  FORM: {
    title: "Find Covered Drugs In The Patient's Plan",
    sub: "Resolve the patient's formulary, search requested drug classes in parallel, then return tiers and restrictions",
    paragraphs: [
      "The patient's plan and formulary are resolved, then the covered-drug list is searched once per requested drug class, concurrently. Details are fetched in bounded batches and rendered deterministically as a table — no model involved in the formatting.",
      "Every row originates in the plan's own covered-drug list, so the second model call cannot name a product this patient's plan does not cover. A failed lookup produces an explicit empty result rather than an unmarked absence.",
      "The table is accurate about coverage and silent about everything else. It states what the plan pays for, not what is clinically appropriate — and presented as a list of options, coverage reads as endorsement.",
    ],
  },
  LLM2: {
    title: "Complete The Answer With Formulary Coverage",
    sub: "Add the coverage results to the original clinical context and stream the final answer without another lookup",
    paragraphs: [
      "The tool result is appended to the original staged prompt and sent to a second model call — issued against a client with no tool definitions attached. A further tool call is not something that model can emit, so the loop is bounded at one hop by construction rather than by a counter someone has to maintain.",
      "The final answer streams through the identical filtering and retry path as the first pass, so citation handling and failure behaviour do not diverge between the branches.",
      "The bound caps genuine capability too. A question that legitimately needed a second lookup gets an answer built on one, and neither the model nor the response has any way to signal that the information it needed was one hop further away. This whole branch sits behind a feature flag and appears in none of the recorded traces, so its latency is unmeasured rather than acceptable.",
    ],
  },

  REF: {
    title: "Append Supporting Guideline References",
    sub: "List only the guideline sources actually cited in this answer, not every source retrieved",
    paragraphs: [
      "The identifiers observed while filtering the stream are intersected with the retrieved evidence set, and only genuinely cited sources are appended as a reference list. Sources that were retrieved but never referenced are dropped.",
      "Listing everything retrieved would overstate the evidence behind the answer. Building the list from observed use makes it a record of what the answer drew on rather than a claim about what was available.",
      "Citation presence is still not grounding. An answer can cite a source accurately, in the right place, for a claim that source does not actually support — the list records that the model pointed at a document, never that the document said what the sentence claims.",
    ],
  },
  SAVE: {
    title: "Finish The Live Response",
    sub: "Send the completion signal after the final answer and supporting references",
    paragraphs: [
      "After the answer and its supporting references have been streamed, the chatbot sends the terminal completion event. This tells the clinician's interface that no more response fragments are coming.",
      "The live connection ends when the response generator finishes. The final assistant turn is saved immediately after the completion event is emitted.",
    ],
  },
  DONE: {
    title: "Save The Completed Chat Turn",
    sub: "Store the assistant answer in chat history and publish the completed conversation event",
    paragraphs: [
      "The complete answer is saved as the assistant's turn with its patient, conversation, request and user identifiers. It becomes part of the chat history used to understand future follow-up questions.",
      "A completed-conversation event is then published for downstream consumers. If generation ended with a terminal streaming error, the failed turn is removed instead of being reused as a complete answer.",
    ],
  },

  TRACE: {
    title: "Record Time Spent In Each Phase",
    sub: "Keep the full request path together under its conversation and request identifiers",
    paragraphs: [
      "Per-stage durations are recorded and published against the request's correlation identifiers, so one request's full path is reconstructable across services after the fact — including the branches that deliberately produced nothing.",
      "This instrumentation is what produced the figures on this canvas: five recorded traces, consistent shape, two dominant concurrent calls and a model that is already behaving reasonably.",
    ],
  },
  METRIC: {
    title: "Publish Model Usage And Chat Events",
    sub: "Report model timing and token use, plus the completed conversation event",
    paragraphs: [
      "Each model call publishes its token counts and timing for attribution, and turn-level events are emitted to the event stream for product analytics. Publication never blocks the response, and a failed metrics write never fails a completed answer.",
    ],
  },
  GAP: {
    title: "Clinical Answer Quality Is Not Measured",
    sub: "The system measures speed and usage, but does not automatically verify that the answer is clinically correct",
    paragraphs: [
      "Every stage is timed and no stage is scored. The instrumentation can tell you precisely how long a clinically wrong answer took to produce, and contains no signal that would reveal it was wrong at all. The only quality feedback in the product is an optional thumbs up or down — sparse, biased toward the annoyed, and far too late to gate a release.",
      "What it needs is three separate measures rather than one score, because the failure modes are separable and an end-to-end number would move for reasons nobody can act on: retrieval measured alone, as whether the guideline that should ground the answer was returned at all; grounding measured as whether cited claims are actually supported by the cited text; and a frozen regression set of real clinical questions with clinician-reviewed answers, scored per release.",
      "Retrieval first, because everything downstream is a choice within what it returned.",
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
  decision: [
    ["path", { d: "m12 3 8 8-8 8-8-8zM12 19v3M4 11H1M20 11h3" }],
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

/* The two admission branches travel through the open band above their target
   nodes. Their labels sit in that reserved whitespace instead of relying on
   React Flow's midpoint placement, which can land on top of a node. */
function AdmissionForkEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style, label, data }) {
  const exitX = data?.exitX ?? sourceX + 60;
  const viaY = data?.viaY ?? targetY - 70;
  const labelX = data?.labelX ?? targetX;
  const labelY = data?.labelY ?? viaY;
  const labelWidth = Math.min(300, Math.max(110, (label?.length || 0) * 6.7 + 24));
  const path = `M ${sourceX},${sourceY} L ${exitX},${sourceY} L ${exitX},${viaY} L ${targetX},${viaY} L ${targetX},${targetY}`;

  return h(
    React.Fragment,
    null,
    h(BaseEdge, { id, path, markerEnd, style }),
    label
      ? h(
          "g",
          { className: "hld-flow-label", transform: `translate(${labelX} ${labelY})` },
          h("rect", { x: -labelWidth / 2, y: -12, width: labelWidth, height: 24, rx: 8, ry: 8 }),
          h("text", { x: 0, y: 1, textAnchor: "middle", dominantBaseline: "middle" }, label)
        )
      : null
  );
}

/* Cross-phase evidence bypasses the Patient Context cards through the narrow
   gutters between phases, then uses the empty band below the final context
   card. This keeps both the connector and its label away from every node. */
function LowerCorridorEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style, label, data }) {
  const leftRailX = data?.leftRailX ?? sourceX + 60;
  const rightRailX = data?.rightRailX ?? targetX - 48;
  const corridorY = data?.corridorY ?? Math.max(sourceY, targetY) + 120;
  const labelX = data?.labelX ?? (leftRailX + rightRailX) / 2;
  const labelY = data?.labelY ?? corridorY;
  const labelWidth = Math.min(280, Math.max(110, (label?.length || 0) * 6.7 + 24));
  const path = `M ${sourceX},${sourceY} L ${leftRailX},${sourceY} L ${leftRailX},${corridorY} L ${rightRailX},${corridorY} L ${rightRailX},${targetY} L ${targetX},${targetY}`;

  return h(
    React.Fragment,
    null,
    h(BaseEdge, { id, path, markerEnd, style }),
    label
      ? h(
          "g",
          { className: "hld-flow-label", transform: `translate(${labelX} ${labelY})` },
          h("rect", { x: -labelWidth / 2, y: -12, width: labelWidth, height: 24, rx: 8, ry: 8 }),
          h("text", { x: 0, y: 1, textAnchor: "middle", dominantBaseline: "middle" }, label)
        )
      : null
  );
}

const NODE_TYPES = { phase: PhasePanel, step: StepCard };
const EDGE_TYPES = {
  outerLoop: OuterLoopEdge,
  admissionFork: AdmissionForkEdge,
  lowerCorridor: LowerCorridorEdge,
};

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
    /* Admission — strictly ordered, and the stream opens last */
    flowEdge("ask-auth", "ASK", "AUTH", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("auth-turn", "AUTH", "TURN", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("turn-sse", "TURN", "SSE", { sourceHandle: "bottom", targetHandle: "top" }),

    /* The fork: both lanes start once the channel is open */
    flowEdge("sse-emb", "SSE", "EMB", {
      type: "admissionFork",
      targetHandle: "top",
      label: "US Clinical Guideline Search (Parallel)",
      data: { viaY: 185 },
      zIndex: 4,
    }),
    flowEdge("sse-pcache", "SSE", "PCACHE", {
      type: "admissionFork",
      targetHandle: "top",
      label: "Fetch Patient Context (Parallel)",
      data: { viaY: 130 },
      zIndex: 4,
    }),

    /* Lane A — guideline retrieval */
    flowEdge("emb-srch", "EMB", "SRCH", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("srch-cite", "SRCH", "CITE", { sourceHandle: "bottom", targetHandle: "top" }),

    /* Patient context inputs are independent. Their vertical arrangement is
       a compact list, not an execution sequence, so no arrows connect them. */

    /* The join — both lanes feed one prompt */
    flowEdge("cite-stage", "CITE", "STAGE", {
      type: "lowerCorridor",
      label: "Citable US guideline evidence",
      data: { leftRailX: 715, rightRailX: 1118, corridorY: 930 },
      zIndex: 4,
    }),
    flowEdge("views-stage", "VIEWS", "STAGE", {
      type: "admissionFork",
      targetHandle: "top",
      kind: "evidence",
      label: "Clinical record + last 10 chats + care measures",
      data: { exitX: 1095, viaY: 390 },
      zIndex: 4,
    }),
    flowEdge("reg-stage", "REG", "STAGE", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("stage-tok", "STAGE", "TOK", {
      sourceHandle: "bottom",
      targetHandle: "top",
      label: "Grounded prompt ready",
      zIndex: 4,
    }),

    /* Generation */
    flowEdge("tok-llm1", "TOK", "LLM1", {
      type: "admissionFork",
      targetHandle: "top",
      label: "Send grounded prompt to model",
      data: { exitX: 1495, viaY: 140 },
      zIndex: 4,
    }),
    flowEdge("llm1-first", "LLM1", "FIRST", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("first-filt", "FIRST", "FILT", { sourceHandle: "bottom", targetHandle: "top", label: "Live answer fragments" }),

    /* The bounded branch */
    flowEdge("first-args", "FIRST", "ARGS", { kind: "loop", label: "Formulary lookup", zIndex: 5 }),
    flowEdge("args-form", "ARGS", "FORM", { sourceHandle: "bottom", targetHandle: "top", kind: "loop" }),
    flowEdge("form-llm2", "FORM", "LLM2", { sourceHandle: "bottom", targetHandle: "top", kind: "loop" }),

    /* Both paths settle the same way */
    flowEdge("filt-ref", "FILT", "REF", {
      type: "lowerCorridor",
      label: "Completed answer + cited sources",
      data: { leftRailX: 1905, rightRailX: 2335, corridorY: 960, labelX: 2115 },
      zIndex: 4,
    }),
    flowEdge("llm2-ref", "LLM2", "REF", {
      type: "admissionFork",
      targetHandle: "top",
      kind: "loop",
      label: "Answer with formulary coverage",
      data: { exitX: 2335, viaY: 140, labelX: 2540 },
      zIndex: 5,
    }),
    flowEdge("ref-save", "REF", "SAVE", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("save-done", "SAVE", "DONE", { sourceHandle: "bottom", targetHandle: "top" }),

    /* Cross-cutting observability */
    flowEdge("done-trace", "DONE", "TRACE", { kind: "evidence" }),
    flowEdge("done-metric", "DONE", "METRIC", { kind: "evidence" }),
    flowEdge("done-gap", "DONE", "GAP", { kind: "blocked" }),
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
