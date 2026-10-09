/* ============================================================
   Clinical Copilot Chat — content model
   ============================================================
   Everything the engine renders lives here: the question bank (Q),
   the seven stages (STAGES), the component contracts (COMPONENTS),
   and the rail order.

   Domain note: this describes an architecture pattern for a streaming,
   retrieval-grounded clinical Q&A assistant. Service names, routes,
   prompt text and payload shapes are generalised; every example value
   is synthetic. Latency figures are medians from five recorded
   execution-timeline traces of one deployment.
   ============================================================ */

/* ---------- pressure probes (question bank) ---------- */

const Q = {
  whyStream: {
    q: "Why hold a connection open for the whole answer? A normal JSON response is simpler to operate and simpler to retry.",
    a: "Because the thing being optimised is not total time, it is the time a clinician spends looking at nothing. The measured end-to-end is around two and a half seconds, and roughly two of those are spent before the first token exists — retrieval, context assembly, then the model's own time to first byte. Buffering the answer means the clinician waits the full duration staring at a spinner; streaming means they start reading at the point the model starts writing, and the remaining generation time disappears into their reading time. The honest cost is operational, and it is real: a streamed response cannot be retried transparently once bytes have left, so a failure mid-answer is visible to the user in a way a buffered failure is not. It also holds a worker for the life of the generation, it defeats ordinary HTTP caching and response-size limits, and it requires every proxy in the path to be configured not to buffer — one nginx default silently re-buffers the whole thing and converts the design back into the slow version without any error. Server-sent events rather than websockets because the channel is strictly one-directional and short-lived; a websocket would add a stateful connection lifecycle for a stream that ends in seconds and never receives anything back.",
  },
  historyCost: {
    q: "The conversation-history read is the single slowest call in the request — slower than the vector search. Why is it in the critical path at all?",
    a: "It is in the path because the answer genuinely depends on it: a follow-up like 'what about the extended-release version' is meaningless without the previous turn, so history is not an enrichment, it is part of the question. What is indefensible is that it costs what it costs. At around 1.18 seconds it is the widest single term in the pre-model budget, and it is a read of a bounded window of recent turns for one patient and one user — that is a small, hot, perfectly cacheable object, and the write path already maintains exactly such a cache. The reason the read is slow is that it goes to the durable store rather than that cache, so the system is paying document-store latency for data it has already staged in memory. The fix is not architectural, it is to read through the cache the writer is already populating and treat the document store as the cold path. Until that lands, this one call sets the floor for the entire concurrent phase, which means every other optimisation in retrieval or context assembly is invisible — they all finish inside its shadow.",
  },
  twoLanes: {
    q: "Retrieval and context assembly run concurrently. What does that actually buy, and what does it cost when something fails?",
    a: "It buys the difference between adding the two and taking the larger of them. Guideline retrieval runs about 1.05 seconds and context assembly about 1.22; run in sequence that is 2.27 seconds of pre-model latency, run together it is 1.22, so concurrency removes roughly 45% of the wait before the model is even called. That is the single largest structural saving in the request and it costs nothing in complexity beyond one gather. The cost shows up in failure. Because everything is awaited together, the slowest branch sets the latency floor for all of them — a degraded document store makes a healthy vector search irrelevant. And the failure semantics are uneven: guideline retrieval catches its own exception and degrades to an explicit 'no guidelines' sentinel, while a context fetch that throws takes the whole gather with it. That asymmetry is not deliberate design, it is two different error conventions meeting inside one await. The right shape is per-branch degradation everywhere, so a missing quality-measures formatter costs the prompt one section rather than costing the clinician the answer.",
  },
  citationStripping: {
    q: "Citation markers are stripped from the stream as it flows, character by character. Why not just let the model emit them and clean the text up at the end?",
    a: "Because there is no end to wait for. The text is being handed to the clinician as it is produced, so anything not removed before it is yielded has already been read — a post-processing pass can fix the stored transcript but cannot un-show a raw bracket to the person watching it appear. The mechanism has to be streaming for the same reason the response is. The subtlety is that the markers do not arrive whole: a citation can be split across chunk boundaries, arriving as an open bracket, then digits, then a closing bracket in three separate frames, so the processor holds back any trailing partial marker and re-joins it with the next chunk before deciding what is visible. What it buys beyond cosmetics is the reference list — the identifiers it captures on the way past are exactly the set the model actually used, which is what lets the closing References block name only cited sources instead of everything that was retrieved. The weakness is that the buffer makes the visible stream fractionally bursty, and the pattern is positional rather than semantic: a model that writes a bracketed number for a genuinely different reason, a dose range or a numbered list, has that text silently eaten.",
  },
  toolRecursion: {
    q: "The model can call a tool mid-stream, and the result goes back into a second model call. What stops that from looping?",
    a: "The second call is issued against a client that has no tools bound to it. That is the whole mechanism, and it is structural rather than instructional — the second model is not asked politely to stop calling tools, it is handed a client whose request carries no tool definitions, so a tool call is not a thing it can emit. One hop, always, by construction. The honest limitation is that this also caps genuine capability at one hop: a question that legitimately needs two lookups — check coverage, then check an interaction against what came back — cannot be served, and the model has no way to signal that it needed another turn. The design trades expressiveness for a hard bound on cost and latency, which is the right trade while there is exactly one tool, and becomes the wrong one the moment there are several that compose. What would need to change first is not the binding, it is the accounting: an iteration budget and a per-request tool-call ceiling, so a multi-hop loop terminates on a number rather than on the absence of a capability.",
  },
  failSoft: {
    q: "One retry, and then the half-written answer is deleted from the transcript. Defend deleting clinical content the user has already seen.",
    a: "The deletion is narrower than it sounds and the reasoning holds: what is deleted is the persisted record of a turn that failed mid-generation, so the transcript does not accumulate truncated answers that a later reader — or the model itself, on the next turn — would treat as complete clinical reasoning. A partial answer that stops mid-sentence is worse than no answer, because it reads as an answer. Leaving it in the history would also feed it back into the next prompt as though the assistant had said it. What is genuinely wrong is the seam between what the user saw and what was kept. The clinician has already watched those tokens appear; deleting the record does not remove them from the screen, so the system's state and the user's state disagree, and the interface has no explicit signal that the visible text was retracted. The fix is not to keep the partial turn, it is to mark it — a typed error state on the turn that the interface renders as failed, rather than a silent removal that leaves the user holding text the system has decided never happened.",
  },
  staleContext: {
    q: "Patient clinical data is served from a cache. In a clinical setting, how do you defend answering from anything but the source of truth?",
    a: "The defensible part is the shape: it is a read-through cache with an explicit refresh on miss, so a cold patient triggers a rebuild and a raise if that rebuild cannot produce data — the system fails rather than answering from nothing. It is also the difference between a sub-twenty-millisecond read and assembling a full clinical picture from several services on every turn of a conversation, which for multi-turn chat is the difference between usable and not. The part I would not defend is invalidation. Freshness is bounded by whatever the cache's own lifetime is, not by clinical events, which means the window that matters — a result posted, a medication changed, an allergy recorded during this same encounter — is exactly the window the cache can be wrong in, and nothing in the request path knows whether the data it is holding predates the thing the clinician is asking about. The right control is event-driven invalidation keyed on the clinical write path, so a posted result evicts that patient immediately. Absent that, the honest mitigation is to surface the as-of time in the answer, because a clinician can reason about data they know is twenty minutes old and cannot reason about data with no timestamp at all.",
  },
  promptInjection: {
    q: "Free-text clinical notes go into the prompt, and so do retrieved guideline documents. What stops content in either from being read as instruction?",
    a: "Structurally, less than there should be. Patient notes and retrieved guideline text are interpolated into the prompt as context, and the model has no reliable way to distinguish a sentence describing a patient from a sentence addressed to it. The realistic threat is not a malicious clinician, it is transcribed content — a note quoting a patient, a scanned document, a guideline PDF with boilerplate — containing text that reads as direction. The partial defences that exist are real but incidental: the context is inserted as prior conversation turns rather than as system instruction, the system prompt is fetched from a registry rather than assembled from user input, and the one tool available is narrow enough that the worst case is a wasted lookup rather than an action with consequences. What is missing is explicit delimiting of untrusted spans, and the fact that the tool surface is currently harmless is a property of there being one read-only tool, not a property of the design. The moment a tool writes anything, that has to become an authorisation boundary rather than a prompt convention.",
  },
  evaluation: {
    q: "How would you know if answer quality silently degraded after a prompt or model change?",
    a: "Today you would not, and that is the largest gap in the system. The instrumentation is thorough about latency and completely silent about correctness — every stage is timed, every model call publishes token usage, and nothing anywhere asks whether the answer was any good. The only quality signal in the product is a thumbs up or down on a turn, which is sparse, biased toward the annoyed, and arrives too late to gate a release. What it needs is not one number but three separate ones, because the failure modes are separable and an end-to-end score would move for reasons nobody can act on: retrieval measured on its own, as whether the guideline that should ground the answer appears in the retrieved set at all; grounding measured as whether the claims in the answer are supported by what was actually cited, which is the check that catches a confident answer built on retrieved text that did not say that; and a frozen regression set of real clinical questions with clinician-reviewed answers, scored per release. Retrieval first, because everything downstream is a choice within what it returned.",
  },
  historyPairing: {
    q: "Conversation history is re-paired into strict alternating turns and anything that does not pair is discarded. Why silently drop a clinician's own history?",
    a: "The mechanism is defensible; its silence is not. Turns can be orphaned legitimately — a generation that failed mid-stream leaves a question with no answer, and a stopped turn leaves the same — and a chat prompt that receives two user turns in a row with no assistant turn between them is a malformed conversation that degrades the model's response. Enforcing alternation is the cheap fix and it also strips the References block from prior answers, which matters more than it looks: stale citation numbers from an earlier turn would otherwise collide with the freshly assigned identifiers in the current one and the model would cite the wrong source with complete confidence. What is wrong is that discarding is invisible in both directions. The clinician sees the earlier exchange on screen and reasonably assumes the assistant can see it too, so a follow-up referring to a dropped turn gets an answer built on context that quietly does not include it. Repair would be better than deletion — an orphaned question can be kept with an explicit note that it was never answered, which is both true and more useful than its absence.",
  },
  costShape: {
    q: "Where does the time actually go, and what would you fix first?",
    a: "Measured across five traces the shape is consistent: about two and a half seconds end-to-end, of which roughly 63% is spent before the model produces a single token. Inside that, two calls dominate and they run concurrently — the conversation-history read at about 1.18 seconds and the guideline vector search at about 0.9 — so the floor is the larger of the two rather than their sum. Token acquisition adds about a quarter of a second sequentially after them, and the model contributes roughly 0.6 to first byte plus 1.3 of generation. The first fix is the history read, because it is the widest term and it is slow for an addressable reason rather than a fundamental one: the data is already being written to a cache that the read path ignores. The second is token acquisition, which is a network round trip to a quota service sitting between finished context and the model call, on the critical path, doing work that could overlap with retrieval since the token estimate does not depend on it. Neither of those is a model optimisation, which is the point — the model is the one part of this request already behaving reasonably.",
  },
  toolFlag: {
    q: "Tool calling is behind a feature flag and did not fire in any of the recorded traces. Is it real, or is it scaffolding?",
    a: "It is real code on a real path, and it is also not carrying production load, and both halves should be said plainly. The flag exists because tool calling changes the shape of the request materially — it binds a tool schema to the first call, adds an interrupt to the stream, and can double the model round trips — so it is gated to be rolled out and reverted independently of the surrounding pipeline, which is the correct way to introduce a branch that expensive. The consequence is that the well-exercised path and the interesting path are different paths, and the latency numbers describe only the first. A formulary question pays for both model calls plus the coverage lookup and the per-drug-class searches in between, and none of the recorded traces contain that, so the honest statement about tool-call latency is that it is unmeasured rather than acceptable. That is also the argument for keeping the flag until it is instrumented rather than defaulting it on because it works in testing.",
  },
  topologyChoice: {
    q: "Why a fixed pipeline with one optional tool hop rather than an agent that decides what it needs?",
    a: "Because a clinician is waiting, and the latency budget is the constraint everything else answers to. Every unnecessary model call is a full round trip added to a wait that is already at the edge of what feels responsive, and an agent's first act is to spend one deciding what to do — for a workflow where the answer is nearly always 'retrieve guidelines, load the patient, answer'. The fixed path also lets retrieval and context assembly start immediately and in parallel, before anything has been reasoned about, which is precisely the saving a planning step would forfeit by making those fetches conditional on its own output. And it bounds the failure surface: each stage degrades in a known way, and one stage's timeout is attributable to that stage rather than to a conversation trace. What would reverse the call is the question shape changing — if answers genuinely required chaining several lookups whose composition varies by question, the fixed path would start failing to answer things rather than merely answering them narrowly, and at that point a planning layer earns its latency. The current single tool hop is the pragmatic middle: one branch, structurally bounded to one iteration.",
  },
};

/* ---------- level 2: stages ---------- */

const STAGES = {
  ingress: {
    rail: { index: "01", tag: "Admit", name: "Request Admission", desc: "Authenticate, then open the channel" },
    eyebrow: "01 · Request admission",
    title: "Take the question, and start showing progress before there is an answer.",
    reveal: "The channel opens before any work begins. The clinician sees activity, not a spinner over a closed request.",
    summary:
      "The request is authenticated, feature flags are resolved, and correlation identifiers are minted. The clinician's question is written to the transcript before generation starts, and a streaming channel is opened immediately — carrying a status frame while the expensive retrieval work is still running.",
    decisionHead: "Persist the question first, open the stream second, work third",
    decisionBody:
      "Writing the turn before generation means a crash mid-answer still leaves a record of what was asked. Opening the channel before retrieval starts means the two seconds of pre-model work happen behind a live connection that is already reporting status, rather than behind a request that has not visibly begun.",
    failure: "A clinician watching an unresponsive interface for two seconds with no indication the system received the question, and a failed generation leaving no trace of what was asked.",
    tradeoff: "Holding a connection open for the whole generation consumes a worker for the duration and forfeits transparent retry. Once bytes have left, a failure is visible to the user rather than recoverable behind the scenes.",
    talk: "The first design decision is not about the model at all. It is that the expensive part of this request happens after the connection is open, so the wait is observable instead of blank.",
    questions: [Q.whyStream, Q.failSoft],
    steps: [
      { label: "Authenticate and resolve flags", meta: "Bearer token, then the flags that decide this request's shape", kind: "deterministic", component: "auth-gate" },
      { label: "Mint correlation identifiers", meta: "Thread, run and turn identifiers — the join key for every trace after this", kind: "deterministic" },
      { label: "Persist the question", meta: "Written to the transcript before any generation is attempted", kind: "deterministic" },
      { label: "Open the stream", meta: "Channel established and reporting status while retrieval runs", kind: "gate", component: "stream-open" },
    ],
  },

  retrieval: {
    rail: { index: "02", tag: "Ground", name: "Guideline Retrieval", desc: "Find the guidance to answer from" },
    eyebrow: "02 · Guideline retrieval",
    title: "Fetch the clinical guidance this answer will have to stand on.",
    reveal: "The model is given sourced guidance and identifiers to cite. What it was never handed, it cannot cite.",
    summary:
      "The question is embedded and issued against the clinical guideline index as a single hybrid query — keyword and vector together, with semantic reranking. Returned passages are grouped by source document, stripped of any citation markers they already carried, and assigned stable identifiers the model is instructed to cite by.",
    decisionHead: "Retrieve and number the evidence before the model sees the question",
    decisionBody:
      "Grounding is only checkable if the evidence set is fixed before generation and each passage carries an identifier the answer can be traced back to. Assigning those identifiers here — rather than letting the model name sources — is what makes the closing reference list a record of what was used rather than a claim about it.",
    failure: "A clinically confident answer with no traceable source, and citation numbers colliding with markers that were already present in the retrieved text.",
    tradeoff: "A retrieval miss is undetectable downstream. If the passage that should ground the answer was never returned, the model answers from parametric knowledge and the reference list simply omits it — which looks identical to an answer that needed no citation.",
    talk: "This stage decides what the answer is allowed to be grounded in. Everything after it is a choice within this set, which is why retrieval quality is the thing I would measure before anything else.",
    questions: [Q.evaluation, Q.promptInjection, Q.twoLanes],
    steps: [
      { label: "Embed the question", meta: "One embedding call before the search is issued", kind: "deterministic", component: "embed-query" },
      { label: "Hybrid search", meta: "Keyword and vector in one query, semantically reranked", kind: "deterministic", component: "hybrid-search" },
      { label: "Group and number sources", meta: "Passages grouped per document; pre-existing markers stripped", kind: "deterministic", component: "citation-builder" },
      { label: "Numbered evidence set", meta: "Identifier to passage — the citable set for this answer", kind: "gate" },
    ],
  },

  context: {
    rail: { index: "03", tag: "Assemble", name: "Patient Context Assembly", desc: "Load the record and the conversation" },
    eyebrow: "03 · Patient context assembly",
    title: "Load who this patient is, and what was already said.",
    reveal: "Six fetches, one await. The slowest of them sets the floor for all of them.",
    summary:
      "Running concurrently with retrieval: the patient's clinical picture from a read-through cache, the recent conversation history, and the formatted recommendation, preventive-care and quality-measure views. History is the slowest call in the entire request and is re-shaped into strict alternating turns before it can enter the prompt.",
    decisionHead: "Fan out every independent fetch, and treat history as part of the question",
    decisionBody:
      "None of these six depend on each other, so awaiting them together makes the cost the largest rather than the sum. Conversation history is loaded on the same critical path as the clinical record because a follow-up question is not answerable without it — it is not enrichment, it is the question.",
    failure: "Serial fetches turning six independent reads into six sequential waits, and a follow-up question answered without the turn it refers to.",
    tradeoff: "The concurrency is uniform but the failure handling is not. Retrieval degrades to an explicit sentinel; a context fetch that raises takes the whole gather with it. And the cache that makes this fast is bounded by its own lifetime rather than by clinical events.",
    talk: "This is where the request actually spends its time, and the slowest call in it is a conversation-history read that the write path has already cached elsewhere. That is the first thing I would fix.",
    questions: [Q.historyCost, Q.staleContext, Q.historyPairing],
    steps: [
      { label: "Patient clinical picture", meta: "Read-through cache; rebuild on miss, raise if unavailable", kind: "source", component: "patient-cache" },
      { label: "Conversation history", meta: "Bounded recent window — the widest single call in the request", kind: "source", component: "history-assembly" },
      { label: "Formatted care views", meta: "Recommendations, preventive care and quality measures, pre-rendered", kind: "source", component: "formatter-fanout" },
      { label: "Assembled context", meta: "Everything the prompt will be built from, awaited together", kind: "gate" },
    ],
  },

  prompt: {
    rail: { index: "04", tag: "Compose", name: "Prompt Assembly", desc: "Build the prompt, acquire capacity" },
    eyebrow: "04 · Prompt assembly and capacity",
    title: "Compose one prompt, then buy the capacity to send it.",
    reveal: "Patient context enters as prior conversation, not as instruction. The model reads it as something already established.",
    summary:
      "A registry-held system prompt receives the numbered evidence set. Patient context is injected as synthetic exchanges — the assistant appearing to have already stated the clinical picture — followed by the real conversation history and the live question. The assembled prompt is costed, and a rate-limited client is acquired before the call.",
    decisionHead: "Stage context as established conversation, and meter capacity centrally",
    decisionBody:
      "Framing patient data as turns the assistant already gave makes it read as settled fact rather than as an instruction competing with the system prompt. Acquiring the client from a shared quota service rather than holding credentials per stage keeps one policy for spend and rate limits across every model call in the system.",
    failure: "Clinical context being interpreted as instruction, and uncoordinated concurrent requests exhausting a shared model deployment's rate limit.",
    tradeoff: "Capacity acquisition is a sequential network round trip on the critical path, sitting between finished context and the model call, doing work that does not depend on the context it waits for.",
    talk: "The prompt is not a template with fields, it is a staged conversation. That framing is what keeps a patient's notes from reading as directions to the model.",
    questions: [Q.promptInjection, Q.costShape],
    steps: [
      { label: "Resolve the system prompt", meta: "Fetched by version from a registry, not compiled in", kind: "source", component: "prompt-registry" },
      { label: "Stage the context", meta: "Patient views injected as prior exchanges, then real history", kind: "deterministic", component: "template-fill" },
      { label: "Acquire capacity", meta: "Token estimate, then a rate-limited client from the quota service", kind: "gate", component: "token-manager" },
      { label: "Callable chain", meta: "One prompt, one metered client, tools bound only if enabled", kind: "gate" },
    ],
  },

  generation: {
    rail: { index: "05", tag: "Stream", name: "Streaming Generation", desc: "Emit tokens, watch the first chunk" },
    eyebrow: "05 · Streaming generation",
    title: "Send tokens as they are written — and read the first one carefully.",
    reveal: "The first chunk decides everything. It is either the start of an answer or the start of a tool call.",
    summary:
      "The model is invoked as a stream. The first chunk is awaited under a timeout and inspected: content means the answer has begun and flows to the clinician through a citation filter; a tool call means the visible stream is interrupted and the branch into tooling begins. Subsequent chunks are untimed.",
    decisionHead: "Time out the first chunk only, and decide the branch from it",
    decisionBody:
      "A model that has not started in ten seconds is not going to produce a usable answer, but a model mid-sentence should never be interrupted by a timer — so the deadline covers the decision to respond, not the response. Reading the branch from the first chunk means a tool call never leaks a partial answer to the screen.",
    failure: "Raw citation markers and function-call syntax reaching a clinician, and a stalled model holding a connection open indefinitely.",
    tradeoff: "One retry, then the turn is abandoned and its record removed. The clinician has already seen the tokens that were emitted, so the transcript and the screen disagree with no explicit signal that the answer was retracted.",
    talk: "The interesting engineering here is the first chunk. It carries the branch decision, the timeout boundary and the first citation fragment, and all three have to be handled before a single character is shown.",
    questions: [Q.whyStream, Q.citationStripping, Q.failSoft],
    steps: [
      { label: "Bounded first chunk", meta: "Deadline on starting to answer; none on continuing", kind: "gate", component: "first-chunk-timeout" },
      { label: "Inspect for a tool call", meta: "Content, or a function call — the branch is decided here", kind: "gate", component: "tool-sniffer" },
      { label: "Filter citations inline", meta: "Markers removed and recorded as the text flows past", kind: "deterministic", component: "citation-processor" },
      { label: "Tokens to the clinician", meta: "Emitted as produced, not buffered to completion", kind: "gate" },
    ],
  },

  tooling: {
    rail: { index: "06", tag: "Branch", name: "Formulary Tool Loop", desc: "Interrupt, look up, re-enter" },
    eyebrow: "06 · Formulary tool loop",
    title: "Stop the stream, go and find out, then answer properly.",
    reveal: "The second call is handed a client with no tools bound. One hop is not a policy, it is the absence of a capability.",
    summary:
      "When the first chunk carries a tool call, streamed argument fragments are reassembled, the formulary skill resolves the patient's plan and searches it per drug class in parallel, and the results are rendered as a table. That table is appended to the original prompt and sent to a second model call — one that cannot call tools.",
    decisionHead: "Bound the loop structurally, not by instruction",
    decisionBody:
      "The second call is issued against a client with no tool definitions attached, so a further tool call is not something it can emit. The iteration bound is a property of what the second model was given rather than of a counter someone has to maintain correctly.",
    failure: "An unbounded tool-calling loop compounding latency and spend on a request a clinician is actively waiting on, and a drug recommendation naming products the patient's plan does not cover.",
    tradeoff: "One hop is a hard ceiling on capability as well as on cost. A question that legitimately needs a second lookup cannot be served, and the model has no way to signal that it needed one.",
    talk: "This branch is gated by a flag and did not appear in any recorded trace, so I would describe its latency as unmeasured rather than acceptable. The containment argument stands on its own; the performance claim does not exist yet.",
    questions: [Q.toolRecursion, Q.toolFlag, Q.costShape],
    steps: [
      { label: "Reassemble arguments", meta: "Streamed fragments merged into one call by index", kind: "deterministic", component: "argument-reassembly" },
      { label: "Resolve coverage and search", meta: "Plan lookup, then one parallel search per drug class", kind: "deterministic", component: "formulary-skill" },
      { label: "Render the result", meta: "A deterministic table; no model involved in formatting", kind: "deterministic" },
      { label: "Second call, no tools bound", meta: "Original prompt plus tool result; recursion structurally impossible", kind: "reasoning", component: "second-pass" },
    ],
  },

  settle: {
    rail: { index: "07", tag: "Settle", name: "Citation and Persistence", desc: "Reconcile, persist, record" },
    eyebrow: "07 · Citation, persistence and telemetry",
    title: "Close the answer with the sources it actually used.",
    reveal: "Retrieved but uncited sources are dropped. The reference list is a record of use, not of retrieval.",
    summary:
      "The identifiers captured while filtering the stream are intersected with the retrieved evidence set, and only genuinely cited sources are appended as references. The completed answer is persisted to the transcript and the cache the next turn will read, and the request's stage timings and token usage are published.",
    decisionHead: "Cite from what was used; degrade the record before degrading the answer",
    decisionBody:
      "Listing everything retrieved would overstate the evidence behind the answer, so the reference list is built from observed use. On failure the ordering inverts: an answer that could not complete is removed from the record rather than persisted as though it were whole.",
    failure: "A reference list that implies sources the answer never drew on, and truncated answers accumulating in a transcript that later turns read as established clinical reasoning.",
    tradeoff: "Everything here is instrumented for latency and nothing for correctness. Stage timings and token counts are published per request; whether the answer was clinically sound is recorded only as an optional thumbs up or down.",
    talk: "The closing move is the honest one to volunteer in an interview: this system knows exactly how fast it was and has no idea whether it was right.",
    questions: [Q.evaluation, Q.failSoft, Q.historyPairing],
    steps: [
      { label: "Reconcile citations", meta: "Observed identifiers intersected with the retrieved set", kind: "deterministic", component: "citation-reconciler" },
      { label: "Persist or discard", meta: "Complete answers stored; failed generations removed", kind: "gate", component: "persistence-gate" },
      { label: "Publish telemetry", meta: "Stage timings, token usage and turn events", kind: "deterministic", component: "telemetry-emit" },
      { label: "Closed turn", meta: "Transcript, cache and metrics consistent for the next question", kind: "gate" },
    ],
  },

  /* ---- off-rail foundations, reachable by deep link ---- */

  orchestration: {
    foundation: { mark: "⌁", name: "Model orchestration", desc: "Provider routing · quota · metrics" },
    eyebrow: "Shared foundation · model orchestration",
    title: "One policy for every model call in the system.",
    reveal: "Stages ask for a capability. Infrastructure decides how it is served and whether it may proceed.",
    summary:
      "A factory resolves a provider implementation by name, so the same stage code runs against either deployment. Behind it, one shared path owns token estimation, quota acquisition, client construction, tool binding and usage publication — the things no individual stage should be deciding for itself.",
    decisionHead: "Centralise credentials, quota and metrics; let stages choose only the shape of the call",
    decisionBody:
      "No stage holds credentials or decides its own rate-limit policy. A stage chooses whether it wants tools bound and what prompt to send; everything about how the call is made, metered and accounted for belongs to one layer.",
    failure: "Every stage drifting into its own retry and quota policy, and model spend that cannot be attributed to a request or a feature.",
    tradeoff: "A shared layer is a shared dependency and a shared queue: one routing defect reaches every stage at once, and quota acquisition sits on the critical path of a request a clinician is waiting on.",
    talk: "This is a deployment-swapping abstraction more than a vendor-swapping one. It centralises quota and metrics genuinely well; it has not been proven against a fundamentally different provider.",
    questions: [Q.costShape, Q.toolRecursion],
    steps: [
      { label: "Resolve a provider", meta: "Implementation selected by name at construction", kind: "source" },
      { label: "Estimate and acquire", meta: "Token cost estimated, then a quota slot taken", kind: "gate" },
      { label: "Bind capability", meta: "Tools attached only where the caller asked for them", kind: "deterministic" },
      { label: "Publish usage", meta: "Timing and token counts emitted per call", kind: "deterministic" },
    ],
  },

  topology: {
    eyebrow: "Foundational decision · pipeline topology",
    title: "A fixed path, two concurrent lanes, one optional hop.",
    reveal: "A clinician is waiting. Every model call spent deciding what to do is a call not spent answering.",
    summary:
      "The system chooses a fixed streaming pipeline over a planning agent. Retrieval and context assembly start immediately and in parallel, before anything has been reasoned about; the model is called once, with one structurally bounded branch into a single tool hop. The resource being protected is a clinician's attention, not worker throughput.",
    decisionHead: "Spend the latency budget on answering, not on deciding",
    decisionBody:
      "The path is the same for nearly every question, so a planner would spend a round trip rediscovering it — and would forfeit the largest saving in the request, which is that both retrieval lanes can start before any reasoning happens. Conditional fetches cannot be prefetched.",
    failure: "An interactive request paying for deliberation it does not need, and parallel prefetching becoming impossible because the fetches depend on a planner's output.",
    tradeoff: "The pipeline answers narrowly rather than failing loudly. A question needing two chained lookups gets a one-hop answer with no signal that it was insufficient.",
    talk: "This is deliberately not an agent. It is a grounded, streaming pipeline with one constrained branch — and for an interactive clinical assistant with a two-second budget, I would defend that as the right shape.",
    questions: [Q.topologyChoice, Q.twoLanes, Q.whyStream],
    steps: [
      { label: "Deterministic admission", meta: "Auth, flags and transcript write — no model involved", kind: "deterministic" },
      { label: "Concurrent grounding", meta: "Evidence and patient context fetched in parallel, unconditionally", kind: "deterministic" },
      { label: "One streamed call", meta: "Answer begins as soon as the model produces its first token", kind: "reasoning" },
      { label: "One bounded branch", meta: "A single tool hop, capped by the absence of a capability", kind: "reasoning" },
      { label: "Degrade, never stall", meta: "Missing evidence changes the answer's grounding, not its arrival", kind: "gate" },
    ],
  },
};

/* ---------- level 3: components ---------- */

const COMPONENTS = {
  ingress: {
    "auth-gate": {
      eyebrow: "Admission · identity and flags",
      title: "Authenticate And Resolve Flags",
      reveal: "Two things are settled before any work starts: who is asking, and which shape this request takes.",
      owns: "Validating the caller's token, establishing the acting user, and resolving the feature flags that decide whether tool calling and detailed timing are active for this request.",
      forbidden: "Deciding clinical access scope for the patient in question, or falling back to a default flag set when the flag service is unreachable in a way that silently changes the request's shape.",
      receives: "A bearer token, the patient reference, the API version, and the question itself.",
      validated: "The token is verified before the handler body executes, and the resolved flags are recorded against the request identifier so a request's behaviour can be reconstructed from its trace.",
      wrong: "A token can be valid, current and correctly scoped to a real clinician, and still belong to someone with no relationship to this patient. Authentication answers who is asking, not whether they should be asking about this person, and nothing in this path re-checks that.",
      questions: [Q.promptInjection],
    },
    "stream-open": {
      eyebrow: "Admission · channel",
      title: "Open The Stream",
      reveal: "The connection is established while the expensive work is still ahead of it, not after.",
      owns: "Establishing the event stream, emitting the first status frame, and setting the transport headers that keep intermediaries from buffering the response.",
      forbidden: "Waiting for retrieval or context to complete before responding, and buffering generated text to send it as one payload.",
      receives: "The correlation identifiers and a generator that will produce status frames and content chunks.",
      validated: "The first frame leaves before retrieval begins, so a connected client is observable from the start rather than inferred from an eventual response.",
      wrong: "Every header can be set correctly and the stream still arrive as a single block, because one proxy in the path re-buffers it. Nothing in the application can detect that — the server's view is a perfectly streamed response, and only the clinician sees the two-second pause.",
      questions: [Q.whyStream],
    },
  },

  retrieval: {
    "embed-query": {
      eyebrow: "Retrieval · vectorisation",
      title: "Embed The Question",
      reveal: "One model call before the search, on the critical path, for a string that repeats often.",
      owns: "Converting the clinician's question into a vector using the embedding deployment that matches the index.",
      forbidden: "Rewriting, expanding or summarising the question before embedding it, and substituting a different embedding model from the one the index was built with.",
      receives: "The raw question text.",
      validated: "The deployment identifier is configuration rather than a literal, so the embedding used for search cannot silently diverge from the one used to build the index.",
      wrong: "The embedding can be perfectly correct for the question as asked, and wrong for the question as meant — a follow-up like 'and the extended-release one?' embeds as a question about drug formulations with no indication of the condition it refers to, because the conversation it depends on is not part of what gets embedded.",
      questions: [Q.costShape],
    },
    "hybrid-search": {
      eyebrow: "Retrieval · index query",
      title: "Hybrid Search",
      reveal: "Keyword and vector in a single query, then reranked. Not two searches merged afterwards.",
      owns: "Issuing one query that combines lexical matching over the document text with nearest-neighbour search over embeddings, and returning a bounded set of reranked passages with extractive captions.",
      forbidden: "Expanding the result count to compensate for weak matches, and returning passages from documents outside the approved clinical guideline corpus.",
      receives: "The question text and its embedding, with a fixed result ceiling.",
      validated: "The result count is bounded at the query, so prompt size stays predictable regardless of how many passages could plausibly match.",
      wrong: "The search can return five highly relevant passages and miss the one that mattered — a guideline whose vocabulary differs from the clinician's phrasing ranks below five near-misses, and nothing downstream can tell. The answer is then grounded in real, retrieved, genuinely related text that is not the guidance that should have applied.",
      questions: [Q.evaluation],
    },
    "citation-builder": {
      eyebrow: "Retrieval · source numbering",
      title: "Group And Number Sources",
      reveal: "Markers already present in the source text are stripped before new ones are assigned.",
      owns: "Grouping returned passages by source document, removing any citation markers the source text already contained, and assigning each document a stable identifier for this request.",
      forbidden: "Letting the model choose its own source numbering, and carrying a source's original numbering into the prompt.",
      receives: "The reranked passages with their document titles.",
      validated: "Identifiers are assigned from a single sequence per request, so a number in the answer resolves to exactly one document in the evidence set.",
      wrong: "Numbering is stable within a request and meaningless across them. A clinician who asks a follow-up sees a fresh set of numbers over a fresh set of documents, so source three in one answer and source three in the next are unrelated — and nothing in the interface indicates the renumbering.",
      questions: [Q.citationStripping],
    },
  },

  context: {
    "patient-cache": {
      eyebrow: "Context · clinical picture",
      title: "Patient Cache Read",
      reveal: "A cache miss rebuilds and re-reads. If that still fails, the request fails rather than answering blind.",
      owns: "Serving the patient's assembled clinical picture — labs, medications, conditions, vitals, allergies, procedures, notes and risk scores — from cache, triggering a rebuild on miss.",
      forbidden: "Returning a partial clinical picture as though it were complete, and continuing with no patient data when a rebuild fails.",
      receives: "The patient reference and the request version.",
      validated: "A miss triggers an explicit rebuild and a second read; exhausting that path raises rather than returning an empty record, so an answer is never generated against silently absent clinical data.",
      wrong: "Every field can be present, well-formed and internally consistent, and describe the patient as they were before this morning's result was posted. The read succeeds, the data is real, and it predates the reason the clinician is asking.",
      questions: [Q.staleContext],
    },
    "history-assembly": {
      eyebrow: "Context · conversation",
      title: "Conversation History",
      reveal: "The widest single call in the request, for data the write path has already cached elsewhere.",
      owns: "Loading a bounded window of recent turns for this patient and user, re-pairing them into strict alternating exchanges, and removing reference blocks from previous answers.",
      forbidden: "Returning unpaired turns, carrying prior citation numbering into the current prompt, and growing the window beyond its bound to preserve more context.",
      receives: "The patient reference, the user identifier and the configured window size.",
      validated: "The result is strictly alternating by construction, so the prompt cannot receive two consecutive turns from the same speaker.",
      wrong: "The pairing logic is correct and discards silently. A turn whose generation failed leaves an orphaned question, that question is dropped, and the clinician — who can still see it on screen — asks a follow-up that refers to context the model was never given.",
      questions: [Q.historyCost, Q.historyPairing],
    },
    "formatter-fanout": {
      eyebrow: "Context · care views",
      title: "Formatted Care Views",
      reveal: "Pre-rendered by upstream services. This stage fetches text, it does not compose it.",
      owns: "Retrieving the recommendation, preventive-care and quality-measure views for this patient, already rendered as prose by the services that own them.",
      forbidden: "Generating or re-ordering clinical recommendations, and blocking the request when an individual view is unavailable.",
      receives: "The patient reference.",
      validated: "Each view is fetched independently, so one unavailable view costs the prompt a section rather than costing the request its answer.",
      wrong: "A view can be fetched successfully and be stale relative to the patient record loaded beside it, because each is produced on its own schedule. The prompt then presents two internally consistent pictures of the same patient that disagree with each other, and the model has no way to know which is current.",
      questions: [Q.twoLanes, Q.staleContext],
    },
  },

  prompt: {
    "prompt-registry": {
      eyebrow: "Composition · prompt source",
      title: "Prompt Registry Fetch",
      reveal: "Prompts are versioned artifacts fetched at runtime, not strings compiled into the service.",
      owns: "Fetching the system prompt for a named version from an external registry, and selecting the version that matches the capabilities enabled for this request.",
      forbidden: "Editing prompt content in code, and falling back to an inline default when the registry cannot be reached.",
      receives: "A prompt version identifier drawn from a fixed enumeration.",
      validated: "The registry is the single source of truth and the version is enumerated rather than constructed, so an unknown version fails at the call site rather than quietly fetching nothing.",
      wrong: "A cached prompt is correct when fetched and unbounded afterwards. A prompt corrected in the registry after a bad release does not reach a running process until it restarts, so the fix is deployed and not in effect — and the trace cannot distinguish the two states.",
      questions: [Q.promptInjection],
    },
    "template-fill": {
      eyebrow: "Composition · context staging",
      title: "Stage The Context",
      reveal: "Patient data enters as exchanges the assistant appears to have already given.",
      owns: "Substituting the numbered evidence into the system prompt and staging each patient view as a synthetic question-and-answer pair, followed by real history and the live question.",
      forbidden: "Placing patient content inside the system instruction, and reordering real conversation history relative to the current question.",
      receives: "The system prompt, the evidence set, every context view, and the paired history.",
      validated: "Context enters through the conversation channel rather than the instruction channel, which keeps a fixed boundary between what the model is told to do and what it is told about.",
      wrong: "The staging is structurally correct and semantically fragile. Content inside a clinical note that reads as an instruction still arrives as conversation the model treats as established, and nothing marks where untrusted text begins and ends.",
      questions: [Q.promptInjection],
    },
    "token-manager": {
      eyebrow: "Composition · capacity",
      title: "Acquire Capacity",
      reveal: "A network round trip between finished context and the model call, on the critical path.",
      owns: "Estimating the prompt's token cost, acquiring a slot against the shared model quota, returning a metered client, and releasing the slot once the call is under way.",
      forbidden: "Issuing a model call without a slot, and holding a slot for the duration of a stream rather than releasing it once the request is accepted.",
      receives: "The assembled prompt and the target model identifier.",
      validated: "Acquisition precedes the call and release follows it, so concurrent requests against a shared deployment are serialised by the quota service rather than by rate-limit errors.",
      wrong: "The estimate can be accurate and the slot correctly granted while the request still fails, because the quota this service protects is not the only limit — the deployment enforces its own, and a burst that satisfies the local budget can still exceed the remote one.",
      questions: [Q.costShape],
    },
  },

  generation: {
    "first-chunk-timeout": {
      eyebrow: "Generation · deadline",
      title: "Bounded First Chunk",
      reveal: "The deadline covers starting to answer, never continuing to answer.",
      owns: "Awaiting the model's first chunk under a fixed timeout, and allowing every subsequent chunk to arrive untimed.",
      forbidden: "Applying a deadline to a generation already in progress, and retrying more than once before abandoning the turn.",
      receives: "The streaming call and the retry budget.",
      validated: "Timeout and exception paths both route through the same bounded retry, so no failure mode can produce unlimited attempts.",
      wrong: "A model that answers within the deadline and then stalls mid-sentence is not covered at all. The first chunk arrived, so the timeout has already been satisfied, and the connection can hang indefinitely with a half-written clinical answer on screen.",
      questions: [Q.failSoft],
    },
    "tool-sniffer": {
      eyebrow: "Generation · branch decision",
      title: "Inspect For A Tool Call",
      reveal: "The branch is read from the first chunk, before anything is shown.",
      owns: "Examining the first chunk for tool-call fragments, emitting a status change when one is found, and suppressing visible output for the remainder of that stream.",
      forbidden: "Emitting partial content once a tool call is detected, and surfacing internal control markers to the client.",
      receives: "The raw chunk stream from the model.",
      validated: "Content and tool-call paths are mutually exclusive from the first chunk onward, so a tool call never produces user-visible text from the first model pass.",
      wrong: "Detection assumes the decision is visible in the first chunk. A model that emits a token of preamble before deciding to call a tool has already had that token forwarded, and the interruption then arrives after the clinician has seen the beginning of an answer that will never be finished.",
      questions: [Q.toolRecursion],
    },
    "citation-processor": {
      eyebrow: "Generation · inline filter",
      title: "Filter Citations Inline",
      reveal: "A marker split across three chunks is still one marker. The filter holds the fragment back.",
      owns: "Removing citation markers from text as it streams, buffering incomplete markers across chunk boundaries, and recording every identifier it removes.",
      forbidden: "Emitting a partial marker while waiting for its remainder, and passing recorded identifiers on as anything other than observed use.",
      receives: "Each raw chunk in order.",
      validated: "Output is a strict subset of input with markers removed, and the recorded identifier set is what the closing reference list is built from.",
      wrong: "The pattern is positional, not semantic. A bracketed number the model wrote for a different reason — a dose range, a numbered list — is removed from the visible answer and recorded as a citation of a source that was never used.",
      questions: [Q.citationStripping],
    },
  },

  tooling: {
    "argument-reassembly": {
      eyebrow: "Tooling · fragment merge",
      title: "Reassemble Arguments",
      reveal: "Tool arguments arrive as a stream of fragments, not as one object.",
      owns: "Merging streamed argument deltas by call index into complete tool invocations, and discarding internal control markers before they can reach the client.",
      forbidden: "Executing a tool before its arguments are complete, and forwarding malformed arguments to the skill rather than failing the branch.",
      receives: "The accumulated tool-call fragments from the interrupted stream.",
      validated: "Fragments are keyed by index rather than by arrival order, so concurrent tool calls cannot interleave into one another's arguments.",
      wrong: "Reassembly can produce syntactically perfect arguments that are clinically wrong — a drug class the model inferred from an ambiguous question. The arguments parse, the lookup runs, and it searches the plan for entirely the wrong category of drug.",
      questions: [Q.toolRecursion],
    },
    "formulary-skill": {
      eyebrow: "Tooling · coverage lookup",
      title: "Resolve Coverage And Search",
      reveal: "Coverage first, then one search per drug class, in parallel and in batches.",
      owns: "Resolving the patient's plan and formulary, searching the covered-drug list once per requested drug class concurrently, fetching details in bounded batches, and rendering the result as a table.",
      forbidden: "Inferring coverage when the plan lookup returns nothing, and naming drugs that did not come back from the plan's own list.",
      receives: "The patient reference and the drug classes extracted from the tool arguments.",
      validated: "Every row rendered originates in the plan's covered-drug list, and a failed lookup produces an explicit empty result rather than an unmarked absence.",
      wrong: "The table can be accurate about coverage and silent about everything else. It states what the plan pays for, not what is clinically appropriate for this patient — and presented as a list of options, coverage reads as endorsement.",
      questions: [Q.toolFlag],
    },
    "second-pass": {
      eyebrow: "Tooling · bounded re-entry",
      title: "Second Call, No Tools Bound",
      reveal: "Recursion is prevented by what the client lacks, not by what the prompt asks.",
      owns: "Appending the tool result to the original prompt, acquiring a client with no tools attached, and streaming the final answer through the same filtering and retry path as the first call.",
      forbidden: "Binding tools to this call, and using a different citation or retry path from the first pass.",
      receives: "The original staged prompt, the tool-call record and the rendered tool result.",
      validated: "The absence of tool definitions on the client makes a further tool call structurally unavailable rather than discouraged.",
      wrong: "The bound is enforced and unexplained. A question that genuinely required a second lookup gets an answer built on one, and neither the model nor the response has any way to indicate that the information it needed was one hop further away.",
      questions: [Q.toolRecursion, Q.toolFlag],
    },
  },

  settle: {
    "citation-reconciler": {
      eyebrow: "Settle · reference list",
      title: "Reconcile Citations",
      reveal: "Retrieved and cited are different sets. Only the second one is printed.",
      owns: "Intersecting the identifiers observed during streaming with the retrieved evidence set, and appending only genuinely cited sources as a reference list.",
      forbidden: "Listing retrieved sources that were never cited, and printing an identifier that has no matching document.",
      receives: "The observed identifier set and the numbered evidence set.",
      validated: "The reference list is derived from observed use rather than from retrieval, so it cannot overstate the evidence behind the answer.",
      wrong: "Citation presence is not grounding. An answer can cite source two accurately, in the right place, for a claim source two does not actually support — the reference list records that the model pointed at a document, never that the document said what the sentence claims.",
      questions: [Q.evaluation],
    },
    "persistence-gate": {
      eyebrow: "Settle · transcript",
      title: "Persist Or Discard",
      reveal: "A failed generation is removed from the record rather than stored half-written.",
      owns: "Detecting failure markers in the completed stream, removing the turn when generation failed, and otherwise writing the answer to both the transcript and the cache the next turn reads.",
      forbidden: "Storing a truncated answer as a complete turn, and writing to the transcript without updating the cache the next request will read from.",
      receives: "The accumulated answer, the failure markers and the turn's identifiers.",
      validated: "Transcript and cache are written together, so the next turn's history cannot disagree with the durable record.",
      wrong: "Deletion is correct for the record and invisible to the person. The clinician watched those tokens appear and has no signal that they were retracted, so the system's state and the user's memory of the conversation diverge with nothing marking where.",
      questions: [Q.failSoft],
    },
    "telemetry-emit": {
      eyebrow: "Settle · observability",
      title: "Publish Telemetry",
      reveal: "Every stage is timed. No stage is scored.",
      owns: "Publishing per-stage timings, token usage per model call, and turn-level events to the metrics and event streams.",
      forbidden: "Blocking the response on telemetry publication, and failing a completed answer because a metrics write failed.",
      receives: "The stage timing record, token counts and the completed turn.",
      validated: "Publication is stamped with the request's correlation identifiers, so one request's full path is reconstructable across services after the fact.",
      wrong: "The instrumentation is thorough and answers the wrong question. It can tell you precisely how long a clinically wrong answer took to produce, and there is no signal anywhere in it that would reveal the answer was wrong at all.",
      questions: [Q.evaluation],
    },
  },
};

const RAIL_ORDER = ["ingress", "retrieval", "context", "prompt", "generation", "tooling", "settle"];

/* Stage-level React Flow diagrams are added per stage. Stages absent from this
   map render through the standard ladder panel. A stage listed here replaces
   its judgment, push and component sections with the diagram. */
const DIAGRAM_STAGES = {
  ingress: {
    engine: "reactflow",
    reactFlowMount: "mountAdmissionReactFlow",
    eyebrow: "01 · Request admission — low-level design",
    title: "How a clinician's question gets let in",
    intro:
      "Follow one question from arrival to handoff: authenticate the clinician, audit and identify the request, save the question, then open a live response before guideline and patient-context loading begins.",
    label: "Low-level design",
    flowTitle: "Request admission",
    rule:
      "Nothing touches patient data until the clinician is verified — and the question is saved before any attempt is made to answer it.",
    notes: [
      ["No AI involved", "Every step in this phase is a plain check, lookup or write. The model is not called until much later in the request."],
      ["The order is deliberate", "Identity first, then the audit record, settings and saved question, then the live stream — so a failure at any point leaves an honest record of how far the request got."],
      ["What was measured", "Request preparation took about 0.02–0.03 seconds in the recorded traces. Token verification and the settings lookup happen before that timer starts, so they are not included in the figure."],
    ],
    details: {
      ASK: {
        eyebrow: "Input",
        title: "Receive the clinician's question",
        body: "The request identifies the patient in the URL and carries the question text plus an existing conversation ID when this is a follow-up. It does not carry the patient's clinical record; later stages load that only after authentication succeeds.",
      },
      VERIFY: {
        eyebrow: "Access check",
        title: "Authenticate the clinician",
        body: "Before the chat endpoint runs, its bearer token is validated and converted into a known clinician identity. A clinician can arrive in one of two ways, and each is verified differently.",
        sections: [
          {
            title: "Launched from the EHR",
            body: "When the chat is opened from inside the electronic health record, the EHR's own token is verified and the clinician is matched to a known user. A valid token for a user the system doesn't recognise is rejected.",
          },
          {
            title: "Signed in directly",
            body: "Otherwise the service's own sign-in token is checked first, and if that doesn't match, a Microsoft sign-in token is tried instead. Either way, the clinician's email and user ID come from the verified token.",
          },
        ],
      },
      AUTH_GATE: {
        eyebrow: "Decision",
        title: "Was the clinician verified?",
        body: "One outcome decides the rest of the request: a verified identity continues, anything else stops here.",
        sections: [
          {
            title: "What this does not check",
            body: "Verification confirms who is asking. It does not confirm that this clinician is allowed to see this particular patient — that is a separate question, and it is not answered at this step.",
          },
        ],
      },
      STOP_AUTH: {
        eyebrow: "No",
        title: "Reject the request",
        body: "A missing, expired or invalid token is rejected as unauthorized; a valid EHR token for an unrecognised user is rejected as a bad request. No audit event, saved question or live response is created, and no patient record is loaded.",
      },
      AUDIT: {
        eyebrow: "Audit",
        title: "Publish the clinician request audit event",
        body: "The clinician's identity, called endpoint, request details, HTTP method and timestamp are published as a user-activity event. This happens after authentication and before the chat request is prepared.",
        sections: [
          {
            title: "Why it sits here",
            body: "It runs as soon as identity is known, so every attempt to ask a question is on record — including ones that fail later on.",
          },
        ],
      },
      FLAGS: {
        eyebrow: "Settings",
        title: "Load chatbot feature flags",
        body: "The request reads whether the model may pause for a patient-formulary lookup and whether detailed execution timing should be recorded for this request.",
        sections: [
          {
            title: "Worth knowing",
            body: "This lookup has no fallback. If the settings service is unavailable, the request fails here — before the live response opens — so the clinician sees an error rather than a stalled stream.",
          },
        ],
      },
      IDS: {
        eyebrow: "Tracking",
        title: "Create conversation and request IDs",
        body: "The request receives a thread ID for the conversation, a run ID for this execution, and a question-response ID for this turn. A supplied thread ID is reused for a follow-up; otherwise a new one is created. Later logs, timings and saved messages carry these identifiers.",
      },
      SAVE: {
        eyebrow: "Chat history",
        title: "Save the clinician's question",
        body: "The question is written to chat history before any answer is attempted. If retrieval fails or the model times out, there is still a record of what was asked — and the eventual answer has a saved question to attach to.",
      },
      STREAM: {
        eyebrow: "Live response",
        title: "Prepare the live response channel with Server-Sent Events (SSE)",
        body: "The service returns a server-sent event response and keeps it open until the answer is finished. No-cache, keep-alive and no-buffering headers tell intermediaries to forward each event instead of waiting for the complete answer.",
        sections: [
          {
            title: "The trade-off",
            body: "An open stream ties up a server worker for the whole answer, and text that has already been shown can't be quietly retried. That cost is accepted so the clinician isn't looking at a blank screen.",
          },
        ],
      },
      GO: {
        eyebrow: "Handoff",
        title: "Start guideline and patient-context loading",
        body: "Admission is complete. The chatbot engine is initialized for the configured model provider, then guideline retrieval and patient-context assembly begin as independent concurrent lanes carrying the request identifiers.",
      },
    },
  },

  retrieval: {
    engine: "reactflow",
    reactFlowMount: "mountRetrievalReactFlow",
    eyebrow: "02 · Guideline retrieval — low-level design",
    title: "How the question finds relevant guidelines in Milvus",
    intro:
      "Follow the question through one Milvus retrieval path: combine semantic and keyword matching, handle the search outcome, then prepare numbered guideline sources for the clinical answer.",
    label: "Low-level design",
    flowTitle: "Guideline retrieval",
    rule:
      "The search never blocks the answer. If nothing is found or the search fails, the request continues — only the guideline section of the prompt changes.",
    notes: [
      ["Runs alongside patient context", "This lane starts at the same moment as patient-context loading. The slower of the two decides when the prompt can be built."],
      ["The search is not the slow part", "In the recorded traces the database search itself took about 5 milliseconds. Most of this lane's roughly one second goes to turning the question into a meaning vector and to network hops between services."],
      ["An honest gap", "Nothing checks whether the right guideline was found. A guideline the search missed looks exactly like a question that needed no guideline."],
    ],
    details: {
      Q: {
        eyebrow: "Input",
        title: "Use the clinician's question as the search query",
        body: "Only the question text is used for the search. The conversation so far is not included, so a follow-up like “and the extended-release one?” is searched on those words alone.",
      },
      MILVUS: {
        eyebrow: "Hybrid search",
        title: "Run hybrid search in the Milvus vector database",
        body: "The vector manager turns the question into an embedding and combines semantic similarity with keyword matching against the Milvus vector database. It returns the most relevant guideline passages with the file metadata needed for citation preparation.",
        sections: [
          {
            title: "Where the time goes",
            body: "Inside the service, turning the question into a meaning vector took about 0.25–0.37 seconds and connecting to the database about 0.1 seconds. The search itself took about 5 milliseconds. Seen from the chat service, the whole call took about 0.9 seconds — mostly the embedding and the network, not the search.",
          },
        ],
      },
      FOUND: {
        eyebrow: "Decision",
        title: "Did Milvus return guideline passages?",
        body: "The request continues whatever the answer is. What changes is what the model is told about guidelines.",
      },
      NONE: {
        eyebrow: "Nothing found",
        title: "No matching guideline passages",
        body: "No passages matched. The prompt gets no guideline section at all, so the model isn't asked to cite anything and the answer has no references.",
      },
      FAILED: {
        eyebrow: "Error",
        title: "Milvus guideline search failed",
        body: "If the search or the formatting fails, the request does not fail with it. The prompt instead says guidelines couldn't be retrieved and asks for general medical advice.",
        sections: [
          {
            title: "Worth knowing",
            body: "The clinician is not told separately. Whether the answer mentions that guidelines were missing depends on how the model words it.",
          },
        ],
      },
      NAME: {
        eyebrow: "Naming",
        title: "Resolve each guideline's official title",
        body: "Every passage comes from a PDF file. Its readable name — the guideline's official title — is looked up in the citation library, which is loaded once for the request.",
        sections: [
          {
            title: "Worth knowing",
            body: "A passage whose file isn't listed in the citation library has no display name and is silently dropped. A relevant passage can be found by the search and still never reach the model.",
          },
        ],
      },
      GROUP: {
        eyebrow: "Numbering",
        title: "Prepare numbered guideline sources",
        body: "Passages are grouped under their guideline name, so parts of the same guideline — even from different PDF files — become one source. Sources are then numbered 1, 2, 3 in alphabetical order.",
        sections: [
          {
            title: "Why the numbers matter",
            body: "The model is told to cite by these numbers. When the answer finishes, only the numbers it actually used are listed as references.",
          },
        ],
      },
      GO: {
        eyebrow: "Handoff",
        title: "Send citation-ready guidelines to prompt assembly",
        body: "Numbered sources — or nothing, or an ‘unavailable’ notice — are passed on. They wait there until patient-context loading finishes, because the two run at the same time.",
        sections: [
          {
            title: "Measured",
            body: "This whole lane took about 1.05 seconds in the recorded traces.",
          },
        ],
      },
    },
  },

  context: {
    engine: "reactflow",
    reactFlowMount: "mountContextReactFlow",
    eyebrow: "03 · Patient context assembly — low-level design",
    title: "How the chatbot assembles patient context and clinical evidence",
    intro:
      "Follow four parallel inputs — the patient's clinical record, the last 10 chat turns, care recommendations, and clinical guideline chunks retrieved from the current question — then add the patient's coverage plan before prompt assembly.",
    label: "Low-level design",
    flowTitle: "Patient context assembly",
    rule:
      "The patient's clinical record is required. Empty chat history, missing care measures, or no matching guideline chunks are valid results and do not prevent an answer.",
    notes: [
      ["Four inputs start together", "The clinical-record fetch, chat-history fetch, care-summary fetches and question-driven Milvus guideline search run concurrently, so this stage takes as long as its slowest input."],
      ["Cache misses are handled", "A missing clinical record triggers a record-cache rebuild. Missing chat history is loaded from MongoDB and written to Redis. Optional care inputs return empty content when unavailable."],
      ["An honest gap", "Cached data is only as fresh as the cache. A lab result posted minutes ago may not yet be in the record the chatbot reads."],
    ],
    details: {
      IN: {
        eyebrow: "Input",
        title: "Use the patient, clinician and question inputs",
        body: "The patient ID selects the clinical record and care information. Patient and clinician IDs together select this clinician's conversation with that patient. The current question selects the most relevant clinical guideline chunks.",
        sections: [
          {
            title: "Runs in parallel",
            body: "The three patient-context fetch groups and the question-driven guideline search all start together, so the slowest input — not their total — decides how long this stage takes.",
          },
        ],
      },
      CACHE: {
        eyebrow: "Clinical record",
        title: "Load the patient clinical record",
        body: "The patient's clinical picture — profile, labs, medications, conditions, vitals, allergies, lifestyle factors, procedures, appointments, immunizations, clinical notes and cardiovascular risk score — is read from the cache in a single lookup.",
        sections: [
          {
            title: "Measured",
            body: "About 0.01–0.02 seconds in the recorded traces.",
          },
        ],
      },
      REFRESH: {
        eyebrow: "Cache miss",
        title: "Rebuild a missing clinical-record cache",
        body: "If this patient's record isn't in the cache, the record service is asked to rebuild it, and the cache is read one more time.",
        sections: [
          {
            title: "If it still fails",
            body: "There is no fallback to a partial record. If the cache is still empty — or switched off — the request stops rather than answering without the patient's clinical data.",
          },
        ],
      },
      HIST: {
        eyebrow: "Conversation",
        title: "Fetch the last 10 chat turns",
        body: "Up to 10 recent question-and-answer turns between this clinician and patient are read from Redis. On a cache miss, up to 20 messages are loaded from MongoDB and cached for the next request.",
        sections: [
          {
            title: "Conversation preparation",
            body: "Only complete question-answer pairs are retained. Unanswered questions are dropped, and reference lists are removed from previous answers so old source numbers cannot leak into the current response.",
          },
          {
            title: "Measured",
            body: "About 1.18 seconds in the recorded traces — the slowest step in the whole request. Those runs logged it against the database, which fits a cache that was empty at the time. A warm cache should be much faster, but that case wasn't measured.",
          },
        ],
      },
      CARE: {
        eyebrow: "Care summaries",
        title: "Load clinical recommendations and preventive care measures",
        body: "Four pre-written summaries are fetched: the patient summary and top recommendations from the cache, and preventive care and quality measures from the database.",
        sections: [
          {
            title: "Never blocking",
            body: "A missing summary is simply left out of the prompt. Recommendations, preventive care and quality measures also return nothing if their lookup fails.",
          },
          {
            title: "Measured",
            body: "Each took between about 0.002 and 0.11 seconds in the recorded traces.",
          },
        ],
      },
      GUIDE: {
        eyebrow: "Clinical evidence",
        title: "Retrieve relevant clinical guideline chunks",
        body: "The clinician's current question is sent through the hybrid Milvus search flow. It returns the most relevant clinical guideline passages as citation-ready evidence for the answer.",
        sections: [
          {
            title: "Why it appears in this phase",
            body: "Phase 2 explains how retrieval works. This card appears here because guideline retrieval is the fourth input in the same concurrent gather as the patient record, chat history and care summaries.",
          },
        ],
      },
      WAIT: {
        eyebrow: "Decision",
        title: "Have all four parallel inputs completed?",
        body: "All four inputs are awaited together. The clinical record must be available because later prompt fields read directly from it. Empty chat history, missing optional care content and no matching guideline chunks are valid results.",
      },
      STOP: {
        eyebrow: "No",
        title: "Required patient context failed",
        body: "If the clinical-record cache cannot be read or rebuilt, the request stops and no answer is attempted. A technical failure while loading another parallel input also stops the shared fetch operation.",
      },
      COVER: {
        eyebrow: "Insurance",
        title: "Load the patient's coverage and formulary plan",
        body: "One more lookup, after the others finish, fetches the patient's insurance plan and formulary names. They're added to the clinical record, and the plan is also added as an extra numbered source the answer can cite.",
        sections: [
          {
            title: "Never blocking",
            body: "If the lookup fails, the plan fields come back empty and the request continues.",
          },
          {
            title: "Worth knowing",
            body: "This lookup runs by itself after the parallel fetches, and it isn't separately timed in the recorded traces.",
          },
        ],
      },
      GO: {
        eyebrow: "Handoff",
        title: "Send patient context and guideline evidence to prompt assembly",
        body: "The clinical record, prepared chat history, care recommendations, question-matched guideline chunks and coverage-plan information move to prompt assembly together.",
        sections: [
          {
            title: "Measured",
            body: "This whole stage took about 1.22 seconds in the recorded traces — almost all of it the conversation history.",
          },
        ],
      },
    },
  },
  prompt: {
    engine: "reactflow",
    reactFlowMount: "mountPromptReactFlow",
    eyebrow: "04 · Prompt assembly and capacity — low-level design",
    title: "How patient context becomes one grounded model request",
    intro:
      "Follow the exact order used to build the model conversation: load the right clinical instructions, add patient data and guideline evidence, preserve the recent chat, place the current question last, then reserve model capacity.",
    label: "Low-level design",
    flowTitle: "Prompt assembly and capacity",
    rule:
      "The clinician's current question is always the final message. Model capacity is reserved only after the complete prompt can be counted.",
    notes: [
      ["Message order carries meaning", "Clinical evidence belongs in the system instructions, prepared care summaries appear as earlier question-answer exchanges, real chat history follows, and the current question stays last."],
      ["The prompt is versioned", "The chatbot loads either the standard clinical prompt or the formulary-enabled prompt. Updating those instructions does not require changing this orchestration code."],
      ["Capacity follows prompt size", "The finished input is counted before the token manager reserves a metered model client. The formulary lookup capability is attached only when its feature is enabled."],
    ],
    details: {
      IN: {
        eyebrow: "Input",
        title: "Receive the completed context and current question",
        body: "Prompt assembly begins only after the clinical record, prepared care summaries, recent chat history and question-matched guideline evidence are ready. It also receives the clinician's current question and the formulary-tool setting for this request.",
      },
      TEMPLATE: {
        eyebrow: "Clinical instructions",
        title: "Load the correct versioned clinical instructions",
        body: "The prompt service returns a centrally managed instruction template by version. The standard version is used for normal answering; a formulary-enabled version is selected when the request may use the coverage lookup tool.",
        sections: [
          {
            title: "Why this is separate",
            body: "Clinical behavior and citation rules can be revised centrally without recompiling the chatbot's request pipeline.",
          },
        ],
      },
      GROUND: {
        eyebrow: "Grounding",
        title: "Add clinical record fields and guideline evidence",
        body: "The numbered guideline excerpts are inserted into the clinical instructions. The prompt is also filled with the patient's profile, labs, vitals, medications, conditions, allergies, notes, lifestyle factors, procedures, appointments, immunizations, coverage details, current date and cardiovascular risk score.",
        sections: [
          {
            title: "When guidelines are absent",
            body: "No matches produce no guideline section. A retrieval failure produces an explicit unavailable notice so the model knows it is answering without retrieved guidance.",
          },
        ],
      },
      CARE: {
        eyebrow: "Prepared context",
        title: "Present care summaries as earlier conversation",
        body: "Preventive care, top recommendations, the patient summary and quality measures are added as synthetic clinician questions followed by assistant answers. Missing sections are omitted instead of producing empty messages.",
        sections: [
          {
            title: "Why use prior exchanges",
            body: "This framing presents the prepared care information as context already established in the conversation, while keeping the live clinician question distinct at the end.",
          },
        ],
      },
      HISTORY: {
        eyebrow: "Real conversation",
        title: "Append the last 10 real chat turns",
        body: "The prepared history is inserted after the care-summary exchanges. This preserves the clinician's real follow-up context and keeps it closer to the current question than the generated background material.",
      },
      QUESTION: {
        eyebrow: "Final message",
        title: "Place the clinician's current question last",
        body: "The current question is appended as the final human message. The ordered conversation is now complete, so the model can interpret the request using both the patient context and the immediately preceding chat.",
      },
      TOKENS: {
        eyebrow: "Capacity estimate",
        title: "Count the completed prompt tokens",
        body: "The provider counts the complete model input after every placeholder has been filled. That count is used to size the capacity request rather than relying on a fixed estimate for every question.",
      },
      CLIENT: {
        eyebrow: "Shared quota",
        title: "Reserve a metered model client",
        body: "The token manager receives the selected model and prompt-token count, reserves shared capacity, and returns the client used for the call. If formulary lookup is enabled, that tool is attached to the first model call here.",
        sections: [
          {
            title: "Why it is on the critical path",
            body: "The chatbot cannot begin generation until shared capacity is granted, so this network call happens after prompt assembly and immediately before streaming.",
          },
        ],
      },
      GO: {
        eyebrow: "Handoff",
        title: "Start streaming generation with the grounded prompt",
        body: "The ordered model conversation and the metered client move together into the first streamed model call. The next phase watches the first response chunk to distinguish a direct answer from a formulary tool request.",
      },
    },
  },
  generation: {
    engine: "reactflow",
    reactFlowMount: "mountGenerationReactFlow",
    eyebrow: "05 · Streaming generation using SSE — low-level design",
    title: "How the answer reaches the clinician while it is being written",
    intro:
      "Follow the grounded prompt into a streamed model call, route a formulary request before answer text is shown, and deliver every visible answer chunk through the SSE response channel opened during Request Admission.",
    label: "Low-level design",
    flowTitle: "Streaming generation using SSE",
    rule:
      "The browser receives only display-ready answer text through SSE. Tool-call instructions and internal citation markers never appear in the clinician's answer.",
    notes: [
      ["SSE is already connected", "Request Admission opened a server-sent event response with caching and proxy buffering disabled. This phase keeps writing events to that same one-way server-to-browser connection."],
      ["Only startup is timed", "The first model chunk must arrive within 10 seconds. The chatbot retries once after three seconds, but does not impose the same deadline on every later chunk."],
      ["Sources are tracked while text flows", "Citation IDs are remembered as chunks pass through, including markers split across chunk boundaries. Their readable guideline titles are appended before the stream is marked complete."],
    ],
    details: {
      IN: {
        eyebrow: "Input",
        title: "Receive the grounded prompt and metered model client",
        body: "Streaming Generation receives the ordered model conversation and the client reserved in Prompt Assembly. The HTTP response is already configured as an SSE connection, so progress and answer events can be sent immediately.",
        sections: [
          {
            title: "SSE response settings",
            body: "The response uses text/event-stream, disables caching and proxy buffering, and keeps the connection alive while answer events are produced.",
          },
        ],
      },
      CALL: {
        eyebrow: "Streamed inference",
        title: "Start the first model call as a stream",
        body: "The chatbot invokes the model asynchronously and consumes its response chunk by chunk. It does not wait for the complete answer before beginning delivery to the clinician.",
      },
      FIRST: {
        eyebrow: "Startup deadline",
        title: "Did the first model chunk arrive within 10 seconds?",
        body: "Only the first chunk has a 10-second deadline. If it times out or raises an error, the chatbot reports a retry through SSE, waits three seconds and makes one more attempt. Later chunks continue without this startup timer.",
      },
      FAILED: {
        eyebrow: "Two attempts failed",
        title: "Send an SSE error and stop",
        body: "After the retry also fails, an error marker is sent through the open SSE response. The incomplete turn is not retained as though it were a finished clinical answer.",
      },
      ROUTE: {
        eyebrow: "First-chunk decision",
        title: "Is the model starting a formulary lookup?",
        body: "When tool calling is enabled, the response is inspected before any answer text is displayed. Normal content enters the direct-answer SSE path; streamed tool-call arguments interrupt that visible answer and enter Phase 06.",
      },
      TOOL: {
        eyebrow: "Tool handoff",
        title: "Pause the answer and run the formulary branch",
        body: "The clinician receives a processing status instead of partial answer text. Phase 06 rebuilds the streamed tool arguments, performs the coverage lookup, and starts a second model call whose final text returns through this same display path.",
      },
      ANSWER: {
        eyebrow: "Happy path",
        title: "Continue with direct answer text",
        body: "Once the response is known to be answer content, the first text and every later model chunk move through the same preparation and SSE delivery steps.",
      },
      CITATIONS: {
        eyebrow: "Readable answer and source tracking",
        title: "Track sources while preparing each chunk for display",
        body: "The stream processor remembers every numbered guideline source the model cites while keeping the internal bracketed IDs out of the prose shown to the clinician. A small buffer handles a citation marker even when it is split across two model chunks.",
        sections: [
          {
            title: "Why the IDs are not displayed inline",
            body: "They are internal links to the retrieved evidence set. The clinician receives readable guideline titles together in the References section when generation finishes.",
          },
        ],
      },
      SSE: {
        eyebrow: "SSE encoding",
        title: "Package the visible text as an SSE event",
        body: "Each display-ready chunk is prefixed with the conversation ID, encoded as an SSE data event, and terminated with the blank line required to separate one event from the next. Line breaks inside the answer are escaped for transport.",
      },
      DISPLAY: {
        eyebrow: "Live delivery",
        title: "Push each SSE event to the clinician's browser",
        body: "The server yields the event immediately through the already-open HTTP response. The browser can append the new text as it arrives, so the clinician sees the answer grow without waiting for full generation.",
      },
      DONE: {
        eyebrow: "Stream complete",
        title: "Finish the SSE response",
        body: "After the model stops, only the guideline sources actually cited are rendered as readable References and sent through SSE. A final [DONE] event tells the browser that no more answer chunks are coming; Phase 07 then settles the completed turn.",
      },
    },
  },
  tooling: {
    engine: "reactflow",
    reactFlowMount: "mountToolingReactFlow",
    eyebrow: "06 · Formulary tool loop — low-level design",
    title: "How the chatbot checks this patient's covered medications",
    intro:
      "Follow the model's formulary request from streamed arguments to a patient-specific coverage table, then through one bounded follow-up model call whose final answer returns over the existing SSE connection.",
    label: "Low-level design",
    flowTitle: "Formulary tool loop",
    rule:
      "Search only the patient's own formulary, and allow only one lookup pass. The follow-up model execution cannot enter another tool loop.",
    notes: [
      ["This branch is optional", "It runs only when formulary tool calling is enabled and the first model response asks for patient-specific drug coverage. Direct answers bypass the entire phase."],
      ["Coverage is not clinical suitability", "The lookup reports which drugs the patient's plan covers, their tiers and plan restrictions. It does not decide which medication is clinically appropriate."],
      ["Failures become explicit tool results", "Malformed arguments, a missing plan and no matching drugs are represented in the tool result so the follow-up model can answer honestly instead of inventing coverage."],
    ],
    details: {
      IN: {
        eyebrow: "Tool handoff",
        title: "Receive the interrupted formulary tool request",
        body: "Streaming Generation paused the visible answer after detecting a formulary function call. This phase receives the accumulated tool-call fragments, the patient ID, the original grounded prompt and the available guideline sources.",
      },
      ARGS: {
        eyebrow: "Request interpretation",
        title: "Reassemble the requested drug classes and coverage filters",
        body: "Tool-call fragments are grouped by call index and joined into one JSON argument set. The request must identify at least one specific drug class. It may also ask for prior authorization, quantity limit, step therapy or non-extended-supply restrictions.",
        sections: [
          {
            title: "Fail clearly",
            body: "Malformed JSON or missing drug classes produces an explicit unavailable result instead of starting an unbounded correction conversation with the model.",
          },
        ],
      },
      PLAN: {
        eyebrow: "Patient coverage",
        title: "Load the patient's insurance and formulary plan",
        body: "The patient ID is used to resolve the patient's coverage plan and its formulary identifier. That identifier limits every following search to the medications covered by this patient's plan.",
        sections: [
          {
            title: "If no plan is found",
            body: "The lookup returns that the patient's formulary details are unavailable. It does not substitute another plan or infer coverage.",
          },
        ],
      },
      SEARCH: {
        eyebrow: "Parallel formulary search",
        title: "Search the patient's formulary for each drug class in parallel",
        body: "Each requested drug class is searched independently against the patient's formulary through the vector-manager service. The searches run concurrently and return formulary row identifiers for matching covered medications.",
        sections: [
          {
            title: "Partial results can continue",
            body: "A failed or empty search for one drug class is logged and omitted while matches from the other requested classes continue.",
          },
        ],
      },
      DETAILS: {
        eyebrow: "Coverage details",
        title: "Load the matching drugs' coverage details",
        body: "The matched row identifiers are fetched from the formulary-details service in batches of up to 100. Large result sets use concurrent batches. When the clinician explicitly requested a restriction, results are filtered for PA, QL, ST or NDS before formatting.",
        sections: [
          {
            title: "Restriction meanings",
            body: "PA is prior authorization, QL is quantity limit, ST is step therapy, and NDS is non-extended day supply.",
          },
        ],
      },
      TABLE: {
        eyebrow: "Deterministic result",
        title: "Build a clear formulary coverage table",
        body: "Code—not another model—formats the insurance name, formulary name, drug name, tier and plan requirements into a consistent table. If nothing matched, the table states that no preferred formulary drugs were found.",
      },
      PROMPT: {
        eyebrow: "Follow-up context",
        title: "Add the formulary result to the original grounded conversation",
        body: "The original system instructions, patient context, guideline evidence, conversation history and current question are preserved. The first model's tool request and the formulary result are appended so the follow-up model can explain the coverage information in context.",
      },
      SECOND: {
        eyebrow: "Bounded follow-up",
        title: "Start the one allowed follow-up model call",
        body: "The follow-up call uses the same prepared inputs but runs through an execution path with tool-call handling disabled. Even if another lookup would be useful, this request cannot recurse into a second formulary loop.",
        sections: [
          {
            title: "Architectural boundary",
            body: "The one-hop ceiling protects latency and model spend, but it also means a question genuinely requiring a second lookup must be answered with the information already returned.",
          },
        ],
      },
      GO: {
        eyebrow: "SSE handoff",
        title: "Stream the final answer through the existing SSE channel",
        body: "The follow-up answer reuses the normal Streaming Generation path: first-chunk timeout, citation tracking, display-safe chunks, SSE delivery and the final completion event. The browser does not need a second connection.",
      },
    },
  },
  settle: {
    engine: "reactflow",
    reactFlowMount: "mountSettleReactFlow",
    eyebrow: "07 · Citation, persistence and telemetry — low-level design",
    title: "How the chatbot closes an answer and prepares the next turn",
    intro:
      "Follow the completed answer through citation reconciliation, SSE completion, durable chat storage, conversation-cache refresh and operational telemetry—with a separate discard path for failed generation.",
    label: "Low-level design",
    flowTitle: "Citation, persistence and telemetry",
    rule:
      "List only guideline sources the answer actually cited, and never save a terminally failed generation as a completed conversation turn.",
    notes: [
      ["Retrieved is not the same as cited", "The final References section is built from the intersection of IDs observed in the answer and the guideline sources retrieved for this request. Unused search results are not shown."],
      ["The browser finishes before persistence", "References and the SSE [DONE] event are sent before the assistant answer is written to storage. The clinician sees completion first; persistence then settles the system record."],
      ["Performance is measured, correctness is not", "The system records model usage, tokens and stage latency. It does not automatically verify whether a cited guideline supports the claim or whether the clinical answer is correct."],
    ],
    details: {
      IN: {
        eyebrow: "Completed generation",
        title: "Receive the completed answer and cited source IDs",
        body: "The generation path returns the accumulated answer plus the set of numbered guideline IDs observed while chunks were prepared for display. The clinician's SSE connection remains open for the final references and completion event.",
      },
      MATCH: {
        eyebrow: "Citation reconciliation",
        title: "Match cited IDs to the retrieved guideline sources",
        body: "The IDs used by the model are intersected with the citation-ready guideline documents from retrieval. An unknown ID cannot become a reference, and a retrieved document the model never cited is left out.",
        sections: [
          {
            title: "Important limitation",
            body: "This confirms that the model pointed to a retrieved source. It does not verify that the cited source truly supports the sentence where the citation appeared.",
          },
        ],
      },
      REFS: {
        eyebrow: "Clinician-facing sources",
        title: "Append readable guideline titles as References",
        body: "The cited guideline documents are sorted by title and rendered as a readable References section. Because internal citation markers were withheld from the prose, this is where the clinician sees the source names behind the answer.",
      },
      SSE_DONE: {
        eyebrow: "SSE completion",
        title: "Send the References and [DONE] event through SSE",
        body: "The final References block is delivered through the existing server-sent event response. A separate [DONE] event tells the browser that it can stop waiting for additional answer chunks.",
      },
      CHECK: {
        eyebrow: "Persistence decision",
        title: "Did generation finish without a terminal stream error?",
        body: "Temporary retry markers are removed from the accumulated answer. A terminal stream-error marker means the model never produced a valid complete response and the turn must not be persisted as successful.",
      },
      DISCARD: {
        eyebrow: "Invalid turn",
        title: "Discard the failed turn",
        body: "The previously saved question for this conversation is deleted and no assistant response is inserted. This prevents a later prompt from treating a failed or partial answer as established chat history.",
        sections: [
          {
            title: "User-experience gap",
            body: "The browser may already have displayed partial text before failure. Removing the database record does not retract what the clinician has already seen on screen.",
          },
        ],
      },
      SAVE: {
        eyebrow: "Durable conversation",
        title: "Save the completed assistant answer to chat history",
        body: "A successful answer is stored in the chat-history database with the patient ID, clinician ID, conversation ID, request ID, question reference, completion time and stopped-state flag.",
        sections: [
          {
            title: "Ordering worth knowing",
            body: "The current implementation refreshes Redis immediately before inserting the durable database record. Those writes do not share a transaction, so a database failure could briefly leave the cache ahead of durable history.",
          },
        ],
      },
      CACHE: {
        eyebrow: "Next-turn context",
        title: "Refresh the last-10-turn conversation cache",
        body: "The completed question-answer pair is written to the Redis chat-history cache so the next request can load recent context quickly. If the clinician explicitly stopped the stream, the record remains durable but the cache is not updated.",
      },
      EVENT: {
        eyebrow: "User event",
        title: "Publish the completed chat-response event",
        body: "The final assistant answer and its patient, clinician, conversation and request identifiers are published to the Kafka user-events topic for downstream consumers.",
      },
      METRICS: {
        eyebrow: "Operational telemetry",
        title: "Record model usage and end-to-end stage timings",
        body: "Per model call, the system publishes the model name, estimated tokens, timestamps, input and output to the LLM traces stream. After a successful save, it also emits the consolidated stage timings and closes the request trace.",
        sections: [
          {
            title: "What this cannot tell us",
            body: "These records explain how long the request took and what model resources it used. They provide no automated clinical-correctness score.",
          },
        ],
      },
      DONE: {
        eyebrow: "Closed turn",
        title: "Turn complete",
        body: "The clinician has the final answer and references, durable chat history contains the completed response, the recent-history cache is ready when applicable, and operational records carry the same correlation identifiers.",
      },
    },
  },
};
