/* ============================================================
   Formulary Intelligence — content model
   ============================================================
   Everything the engine renders lives here: the question bank (Q),
   the seven stages (STAGES), the component contracts (COMPONENTS),
   and the rail order.

   Domain note: this describes an architecture pattern for coverage-aware
   pharmacotherapy recommendation. Service names, routes, prompt text and
   payload shapes are generalised; every example value is synthetic.
   ============================================================ */

/* ---------- pressure probes (question bank) ---------- */

const Q = {
  whyRetrieval: {
    q: "A drug class maps to the drugs in that class. That is a join, not a search. Why is there a retrieval step here at all?",
    a: "Because the two ends of that join do not speak the same language. What arrives is a clinical intervention written by a recommendation engine for a human reader — a phrase, not a code. What exists on the other side is a plan-specific formulary file: a list of covered products with descriptions, tiers and restrictions, where the same therapeutic category can be spelled a dozen ways across payers and refreshed on its own calendar. A deterministic join needs both sides normalised to a shared vocabulary, and the formulary side is the one you do not control. Retrieval is what absorbs that mismatch. The honest counterargument is that this is a mapping problem the industry already solved — if every intervention could be resolved to an ATC or USP class code, and every formulary row carried the same code, the correct design is a lookup table with a cache, and it would be faster, cheaper and exactly reproducible. That is the version to build the moment both sides are reliably coded. Retrieval here is a bridge over a vocabulary gap, not a claim that similarity is the right tool for a solved mapping.",
  },
  twoCalls: {
    q: "Why two model calls? One call could read the intervention and name the covered drug directly.",
    a: "Because the two calls answer questions that fail differently and have different evidence available. The first is pure clinical knowledge — what class of drug does this intervention call for — and it needs no formulary data at all. The second is a constrained choice among specific covered products, and it is impossible to ask before retrieval has run, because the candidate list does not exist yet. Collapsing them forces the model to recall which drugs a specific plan covers, which is exactly the thing it cannot know and will confabulate. The split also localises failure: a wrong class produces an empty or irrelevant candidate set, which is visible, whereas a wrong selection from a correct set is a different defect with a different fix. The cost is real — two calls, two round trips, and a lossy intermediate representation between them. A drug class is a narrower thing than the intervention that produced it, and nuance in the original phrasing does not survive the hop.",
  },
  closedSet: {
    q: "How do you prove this cannot recommend a drug the patient's plan does not cover?",
    a: "The selection call is never asked an open question. It receives a dictionary built from retrieval results — identifier to drug name — and its schema requires it to return identifiers. A drug that was never retrieved has no identifier to return, so the failure mode is not hallucinating a product but returning a malformed or unknown identifier, which is a comparison against a set the caller already holds. That is the structural half of the argument and it is the strong half. The weak half is that containment is only as good as the set: if retrieval missed the right class entirely, the model will select the best of a wrong candidate list and nothing in the selection step can detect that. Containment prevents inventing coverage; it does not prevent confidently choosing from the wrong shelf. Those are different guarantees and it is worth being precise about which one the design actually buys.",
  },
  failSoft: {
    q: "Every stage catches its exception and returns an empty result. In clinical decision support, is silent degradation safe — or is it the most dangerous failure mode you could have chosen?",
    a: "It is defensible only because of where this sits. This runs inside a wider recommendation pipeline whose clinical output does not depend on formulary enrichment; a drug the plan covers is added information on top of a recommendation that already stands. Under that framing, failing soft degrades to the unenriched recommendation a clinician would otherwise have received, and failing hard would suppress clinical guidance over a benefits lookup — the worse outcome. What is genuinely wrong with the current shape is that the two cases are indistinguishable downstream. 'This plan covers no drug in this class' and 'the retrieval service timed out' both arrive as an empty list, and the first is clinically meaningful while the second is an outage. The fix is not to stop failing soft, it is to make degradation typed and visible in the response rather than only in the trace — so a consumer can tell the difference and a clinician is never shown silence that looks like an answer.",
  },
  batching: {
    q: "The batch count is a fixed constant. What should actually determine it, and why batch at all rather than one call per action?",
    a: "Batching exists because the per-call overhead dominates the payload: one action carries a class name and a short candidate list, and issuing a separate round trip for each wastes far more on latency and fixed prompt cost than it saves. Grouping several into one call amortises the system prompt across all of them. But a fixed count is the wrong control variable, because it makes batch size a function of how many actions this patient happens to have — the same constant produces two-item batches for one patient and twenty-item batches for another, and the twenty-item batch is the one that degrades. The right control is a token budget: pack until the rendered candidate tables approach a ceiling, then start a new batch. That bounds worst-case prompt size, keeps per-batch quality stable across patients, and makes cost predictable. The reason to fix the count anyway is that it caps concurrency against a rate-limited deployment, which a token-budget scheme has to solve separately.",
  },
  threads: {
    q: "Threads, inside a Flask request served on a background thread. Defend that over asyncio.",
    a: "The defensible version is that every parallel unit here is a blocking HTTP call to another service, threads release the GIL while waiting on a socket, and the fan-out width is small — a handful of drug classes, a handful of batches. At that width the difference between a thread pool and an event loop is not measurable, and the thread pool composes with synchronous client libraries that the async version would require replacing. The weak point is not performance, it is control. The retrieval pool is bounded at a fixed worker count; the batch pool is created with no bound at all, so its width is whatever the batch split produced, and there is no shared ceiling across concurrent patients — a hundred simultaneous requests multiply their fan-outs against the same rate-limited model deployment with nothing coordinating them. That is the real argument for restructuring, and it is an argument for a shared semaphore or a work queue rather than for asyncio specifically.",
  },
  structuredOutput: {
    q: "Schema-constrained decoding already guarantees the shape. Why is there still a hand-written retry loop around it?",
    a: "Because the guarantee is narrower than it looks. Constrained decoding guarantees the response parses into the declared schema. It does not guarantee a response arrives — the call can fail on transport, rate limit, content filter, or truncation — and it does not guarantee the parsed object is usable, because a schema that permits a list permits an empty one, and a schema with a string field permits a refusal string in it. The retry loop covers the difference between 'well-formed' and 'present and usable', and it re-validates the type after parsing rather than trusting it. What the loop should do that it currently does not is distinguish retryable from terminal failures: a rate limit deserves a backed-off retry, a content filter deserves an immediate stop, and today both consume the same fixed attempt budget with no delay between attempts.",
  },
  classGranularity: {
    q: "The drug class is a lossy bottleneck. Everything the intervention said beyond the class is discarded before selection sees it. Is that acceptable?",
    a: "It is the sharpest weakness in the design and worth conceding directly. An intervention can carry contraindication context, prior therapy failures, renal dosing implications or an explicit exclusion, and none of that survives the hop into a single class string. Selection then chooses among covered products using only the class and the original action name, which means a genuinely relevant constraint can be silently dropped. There are two honest responses. The narrow one is that the class is a retrieval key, not the whole clinical picture — the action name is carried alongside it into selection, so some nuance does survive. The real one is that if clinical constraints must influence which product is chosen, they belong in the selection contract as explicit fields rather than left to leak through a free-text name, and the fact that they are not there today is a design gap rather than a defended trade-off.",
  },
  noCoverage: {
    q: "What happens when the patient has no formulary on file, and why is that not simply an error?",
    a: "Coverage resolution returns an empty identifier and the pipeline proceeds without formulary enrichment. That is correct rather than lenient: a missing formulary is a routine benefits state, not a fault. Cash-pay patients, newly enrolled members whose plan data has not propagated, and coverage types that carry no drug benefit all produce it legitimately. Treating it as an error would fail a clinically valid request over the absence of a benefits record. What matters is that the downstream consumer is told which happened, because 'this plan covers nothing in this class' and 'we do not know this patient's plan' warrant different presentation to a clinician — and that distinction currently lives only in the trace rather than in the response.",
  },
  humanLoop: {
    q: "Where is the human, and what is this system structurally forbidden from deciding?",
    a: "It is advisory throughout. It does not prescribe, does not write to a medication record, and does not rank clinical suitability between products — it narrows a class to the products a specific plan will pay for, and a prescriber decides. The boundary is worth stating precisely because the failure mode of systems like this is scope creep dressed as helpfulness: once a component ranks covered drugs, the ranking is read as a clinical recommendation whether or not it was meant as one, and the interface has to be explicit that the ordering reflects coverage and retrieval relevance rather than clinical preference. The deeper point is that formulary coverage and clinical appropriateness are different axes, and a system that only sees one of them must not present its output as if it saw both.",
  },
  evaluation: {
    q: "There is no evaluation harness in this pipeline. How would you know if it silently got worse after a model or prompt change?",
    a: "Today you would not, and that is the most consequential gap in the system — everything is instrumented for tracing and nothing for correctness. Traces record what happened, which answers 'why did this request behave this way' and cannot answer 'is this still as good as last month'. What it needs is a frozen set of interventions with pharmacist-adjudicated expected classes, scored per release on class accuracy as a straight classification metric; retrieval measured separately as whether the correct product appears anywhere in the candidate set, because a selection error and a retrieval miss demand different fixes and an end-to-end number cannot separate them; and a containment assertion that every returned identifier was present in the candidate set, which is cheap enough to run on live traffic rather than only in evaluation. Splitting class accuracy from retrieval recall is the part that matters most, because a single end-to-end score will move for reasons you cannot act on.",
  },
  costShape: {
    q: "What does one request actually cost, and which stage would you optimise first?",
    a: "Cost scales with the number of pharmacotherapy actions, not with patient complexity generally. One classification call covers all actions at once, retrieval issues one service call per distinct class in parallel, and selection issues one call per batch. So the dominant term is selection, and within selection it is the rendered candidate tables — a class with many covered products produces a large prompt, repeated for every action in that class. The first optimisation is therefore not a faster model, it is truncating and deduplicating the candidate list before it is rendered: most of those rows are different package sizes and strengths of the same product, and collapsing them to distinct products shrinks the prompt substantially without changing what can be selected. The second is caching classification by intervention text, which repeats heavily across patients.",
  },
  topologyChoice: {
    q: "Why a fixed five-stage pipeline rather than an agent with tools that decides its own path?",
    a: "Because the path never varies and the variance an agent would add is all downside. Every queued item needs coverage, then extraction, then classification, then retrieval, then selection, in that order, with no branch worth discovering at runtime — so a tool-calling loop would spend model calls rediscovering a fixed sequence, and its cost would become unbounded across a worker fleet that is provisioned for a known throughput, not for open-ended per-item deliberation. The fixed pipeline also makes each stage independently testable and each failure attributable to one stage, which a conversation trace does not give you. What would reverse the choice is the requirement changing shape: if the system had to handle open clinical questions where the next step genuinely depends on what the last step found, or if it had to decide between escalating to a pharmacist and continuing, a planning layer would start earning its cost. For one known workflow, the orchestrator already decides deterministically what an agent would spend tokens deciding.",
  },
};

/* ---------- level 2: stages ---------- */

const STAGES = {
  coverage: {
    rail: { index: "01", tag: "Eligibility", name: "Patient Coverage Resolution", desc: "Resolve what the plan pays for" },
    eyebrow: "01 · Coverage resolution",
    title: "Find out what this patient's plan will actually pay for.",
    reveal: "Coverage is resolved first, because it decides whether the rest of the pipeline has anything to filter against.",
    summary:
      "Before any clinical reasoning happens, the pipeline resolves the patient's benefits position: which formulary applies, under which plan, and as of which effective date. A patient with no formulary on file is a valid state, not a failure.",
    decisionHead: "Resolve benefits before reasoning, and treat absence as a state",
    decisionBody: "Coverage is a cheap deterministic lookup that changes what every later stage can do. Resolving it first means the expensive stages are never run against an unknown benefits position — and an absent formulary degrades the pipeline instead of stopping it.",
    failure: "Recommending a drug the patient cannot obtain, or failing a clinically valid request because a benefits record was missing.",
    tradeoff: "A missing formulary produces an unenriched result that looks similar to a covered result with nothing available. The two states are distinguishable in the trace but not yet in the response.",
    talk: "The first question is not clinical, it is economic. A recommendation the patient cannot fill is not a recommendation, and this stage establishes which shelf we are allowed to pick from.",
    questions: [Q.noCoverage, Q.failSoft],
    steps: [
      { label: "Patient benefits lookup", meta: "Formulary identifier, plan, payer, effective date", kind: "deterministic", component: "plan-lookup" },
      { label: "Clinical recommendations", meta: "Diagnoses and recommended actions for this patient", kind: "source", component: "insight-fetch" },
      { label: "Coverage context", meta: "Either a formulary to filter against, or an explicit absence", kind: "gate" },
    ],
  },

  extraction: {
    rail: { index: "02", tag: "Extract", name: "Pharmacological Intervention Extraction", desc: "Narrow to pharmacotherapy only" },
    eyebrow: "02 · Action extraction",
    title: "Keep only the recommendations a formulary can speak to.",
    reveal: "A clinical recommendation set is mostly not about drugs. This stage throws away everything else.",
    summary:
      "Recommendations arrive as a nested structure of diagnoses, each carrying actions of many kinds — follow-up, screening, referral, counselling, pharmacotherapy. A declarative path query flattens the tree and keeps only the pharmacological actions, each reduced to an identifier and a name.",
    decisionHead: "Filter declaratively, and make the identifier the unit of work",
    decisionBody: "A path expression over the payload is resilient to unrelated schema growth in a way that nested loops are not. Reducing each surviving action to an identifier plus a name establishes the unit that every later stage keys on, joins back to, and reports failure against.",
    failure: "Sending non-drug recommendations into a drug pipeline, or losing the link back to the originating recommendation once results return from parallel work.",
    tradeoff: "The action-type filter matches a fixed set of strings. A new pharmacotherapy type introduced upstream is silently dropped rather than loudly rejected.",
    talk: "This is the cheapest stage in the system and it sets up everything after it. Every parallel branch later rejoins on the identifier minted here.",
    questions: [Q.costShape],
    steps: [
      { label: "Flatten the recommendation tree", meta: "One declarative path across every diagnosis and action", kind: "deterministic" },
      { label: "Filter to pharmacotherapy", meta: "Match against known pharmacological action types", kind: "deterministic" },
      { label: "Reduce to a work unit", meta: "Identifier plus action name — the join key for everything downstream", kind: "gate" },
    ],
  },

  classification: {
    rail: { index: "03", tag: "Classify", name: "Drug Class Identification", desc: "Make clinical intent retrievable" },
    eyebrow: "03 · Drug class identification",
    title: "Turn a clinical sentence into something a formulary can be searched with.",
    reveal: "The model is asked for clinical knowledge here, and nothing about coverage. It cannot know this plan.",
    summary:
      "Every extracted action is sent to the model in a single schema-constrained call that returns a therapeutic drug class per action. The response is parsed into a typed object, the object is re-validated, and the whole call is wrapped in a bounded retry. Unresolvable actions come back with explicit sentinel values rather than a guess.",
    decisionHead: "Ask the model only what it can know from clinical training",
    decisionBody: "This call sees no formulary data, because coverage is not something a model can recall — it is something a plan file states. Keeping the question purely clinical is what makes the answer checkable and what keeps confabulated coverage structurally impossible at this stage.",
    failure: "A model asked to name a covered drug in one step inventing coverage it has no way to know, and a malformed response reaching retrieval as if it were a class.",
    tradeoff: "The class is a lossy intermediate. Nuance in the original intervention — prior failures, contraindications, exclusions — does not survive the reduction to a single class string.",
    talk: "This is the one place the system genuinely wants the model's clinical knowledge. Everything it must not guess at is deliberately withheld from the prompt.",
    questions: [Q.twoCalls, Q.classGranularity, Q.structuredOutput],
    steps: [
      { label: "Resolve the prompt", meta: "Fetched by version from an external prompt registry, cached", kind: "source", component: "prompt-resolution" },
      { label: "Schema-constrained call", meta: "One call for every action; decoding bound to a declared schema", kind: "reasoning", component: "structured-execution" },
      { label: "Validate and retry", meta: "Re-check the parsed type; bounded attempts before giving up", kind: "gate", component: "retry-loop" },
      { label: "Class per action", meta: "A therapeutic class, or an explicit sentinel for unresolvable input", kind: "gate" },
    ],
  },

  retrieval: {
    rail: { index: "04", tag: "Retrieve", name: "Formulary Drug Retrieval", desc: "Fan out to the covered-drug index" },
    eyebrow: "04 · Formulary retrieval",
    title: "Build the candidate set the model is allowed to choose from.",
    reveal: "Nothing that fails to arrive here can ever be recommended. The candidate set is the safety boundary.",
    summary:
      "Each identified class is resolved against the plan's covered-drug index in parallel, bounded by a fixed worker pool. Sentinel classes are discarded before any network call. Results are reduced to an identifier-to-name dictionary and merged back onto the originating action.",
    decisionHead: "Retrieve per class, in parallel, into a closed candidate set",
    decisionBody: "Classes are independent, so they fan out; the pool is bounded because the index is a shared service and unbounded fan-out from many concurrent patients is the failure that takes it down. Reducing results to an identifier map is what makes the next stage's answer space finite and checkable.",
    failure: "Serial retrieval making latency scale with the number of distinct classes, and unresolvable classes consuming service calls that can only return nothing.",
    tradeoff: "A retrieval miss is invisible to every later stage. If the right class was never retrieved, selection will confidently choose the best of a wrong candidate list and nothing downstream can detect it.",
    talk: "This stage decides what is possible to recommend. Everything after it is a choice within the set this stage produced, which is exactly why retrieval quality — not selection quality — is the thing to measure first.",
    questions: [Q.whyRetrieval, Q.closedSet, Q.threads],
    steps: [
      { label: "Discard sentinels", meta: "Unresolvable classes short-circuit before any call is made", kind: "deterministic", component: "sentinel-guard" },
      { label: "Parallel class resolution", meta: "One call per class against the plan's covered-drug index", kind: "deterministic", component: "index-call" },
      { label: "Merge on the work unit", meta: "Candidates rejoined to the action that produced them", kind: "deterministic", component: "result-merge" },
      { label: "Closed candidate set", meta: "Identifier to drug name — the finite answer space for selection", kind: "gate" },
    ],
  },

  selection: {
    rail: { index: "05", tag: "Select", name: "Relevant Drug Selection", desc: "Choose from a closed set" },
    eyebrow: "05 · Relevance selection",
    title: "Choose from the shelf, never from memory.",
    reveal: "The model returns identifiers it was handed. A drug it was not given has no identifier to return.",
    summary:
      "Actions carrying a class and a non-empty candidate set are partitioned into batches, rendered as compact tables, and sent to the model in parallel schema-constrained calls. The model returns identifiers drawn from the supplied set. Batches fail independently.",
    decisionHead: "Constrain the answer space rather than instructing against invention",
    decisionBody: "A prompt that asks the model not to invent drugs is a request. A schema that only accepts identifiers from a dictionary the caller holds is a structure. The second survives model changes, prompt drift and adversarial input; the first does not.",
    failure: "A recommended drug that the plan does not cover, and one malformed batch taking down an entire patient's results.",
    tradeoff: "Containment prevents inventing coverage; it does not prevent confidently choosing the best option from a wrong candidate list. The guarantee is narrower than it first appears.",
    talk: "This is the guardrail I would point at first. It is structural rather than instructional — the model is not trusted to comply, it is handed a finite set and a schema that only accepts members of it.",
    questions: [Q.closedSet, Q.batching, Q.humanLoop],
    steps: [
      { label: "Filter to viable actions", meta: "Empty class or empty candidate set is recorded and skipped", kind: "deterministic", component: "viability-filter" },
      { label: "Partition into batches", meta: "Amortise fixed prompt cost across several actions per call", kind: "deterministic", component: "batch-partition" },
      { label: "Render candidate tables", meta: "Deterministic markdown; no model involvement in formatting", kind: "deterministic", component: "table-render" },
      { label: "Parallel constrained calls", meta: "Schema requires identifiers from the supplied set", kind: "reasoning", component: "batch-inference" },
      { label: "Aggregate", meta: "Independent batch failure; partial results survive", kind: "gate", component: "aggregation" },
    ],
  },

  synthesis: {
    rail: { index: "06", tag: "Synthesize", name: "Final Recommendation Generation", desc: "Assemble the coverage-aware answer" },
    eyebrow: "06 · Recommendation synthesis",
    title: "Return a recommendation, with the coverage reasoning attached.",
    reveal: "The clinical recommendation was always going to be returned. This stage attaches what the plan will pay for.",
    summary:
      "Selected covered drugs are folded back onto the clinical recommendations that produced them and rendered into the response contract the caller expects. Actions that were skipped or that failed enrichment pass through carrying their original clinical content.",
    decisionHead: "Enrich the clinical answer; never gate it",
    decisionBody: "Formulary data is additive. A recommendation that could not be enriched is still clinically valid and is returned unenriched, which is why every upstream stage degrades rather than raising.",
    failure: "Suppressing valid clinical guidance because a benefits lookup or a retrieval call failed.",
    tradeoff: "Enriched and unenriched results are returned through the same shape, so a consumer cannot currently distinguish 'nothing covered' from 'enrichment unavailable' without reading the trace.",
    talk: "The design rule for the whole pipeline lands here: formulary intelligence makes a clinical recommendation more useful, and is never allowed to make it absent.",
    questions: [Q.failSoft, Q.humanLoop],
    steps: [
      { label: "Fold onto recommendations", meta: "Covered drugs rejoined by the identifier minted in stage 02", kind: "deterministic" },
      { label: "Render the response contract", meta: "Enriched and unenriched actions in one consistent shape", kind: "deterministic" },
      { label: "Coverage-aware recommendation", meta: "Clinical content, plus what the plan will pay for", kind: "gate" },
    ],
  },

  governance: {
    rail: { index: "07", tag: "Govern", name: "Governance and Observability", desc: "Record every decision and every skip" },
    eyebrow: "07 · Governance and observability",
    title: "Record the decisions, including the ones to do nothing.",
    reveal: "Skips are recorded as deliberately as results. A silent pipeline cannot be debugged or defended.",
    summary:
      "Every stage writes structured trace records keyed to the patient and run — successes, skips with their reason, and failures with their error. Stage timings are captured by decorator, model usage is published as metrics, and model calls pass through a shared token budget before they are allowed to proceed.",
    decisionHead: "Instrument the skips, not only the results",
    decisionBody: "In a pipeline that degrades rather than raising, the interesting events are the ones that produced nothing. A trace that records only successful work cannot explain an empty response, which is the exact case a clinician will ask about.",
    failure: "An empty recommendation that cannot be attributed to a missing formulary, an unresolvable class, an empty candidate set, or a failed call.",
    tradeoff: "Traces carry clinical identifiers and therefore inherit retention, access-control and audit obligations. This is observability with a compliance surface, not a log file.",
    talk: "The system is fully instrumented for tracing and not at all for correctness. It can explain any single request perfectly, and cannot yet tell you whether it got worse last Tuesday.",
    questions: [Q.evaluation, Q.failSoft],
    steps: [
      { label: "Structured trace records", meta: "Decisions, skips and errors, keyed to patient and run", kind: "deterministic", component: "trace-writer" },
      { label: "Stage timing", meta: "Execution time captured by decorator at stage boundaries", kind: "deterministic", component: "timing" },
      { label: "Token budget", meta: "Model calls acquire and release a shared quota slot", kind: "gate", component: "token-budget" },
      { label: "Usage metrics", meta: "Model usage published to a metrics stream", kind: "deterministic", component: "metrics" },
    ],
  },

  /* Reachable from the full-flow canvas and by deep link. */
  orchestration: {
    foundation: { mark: "⌁", name: "Model orchestration", desc: "Provider routing · quota · metrics" },
    eyebrow: "Shared foundation · model orchestration",
    title: "One policy for every model call in the system.",
    reveal: "Stages ask for a capability. Infrastructure decides how it is served and whether it may proceed.",
    summary:
      "A factory resolves a provider implementation by name. Two execution paths sit behind it: a chain-based path for open-ended generation, and a schema-constrained path used wherever a typed object is required. Both share token accounting, quota acquisition and metrics publication.",
    decisionHead: "Centralise the call policy; let stages choose only the shape of the answer",
    decisionBody: "No stage owns credentials, quota policy or metrics. A stage chooses between free-form and schema-constrained output, and infrastructure owns everything else about how the call is made.",
    failure: "Each stage drifting into its own retry, quota and credential policy, and model spend becoming unattributable.",
    tradeoff: "A shared layer is a shared dependency: one routing defect reaches every stage at once. The provider abstraction also spans one model family in practice, so it is thinner than the factory shape implies.",
    talk: "The honest framing is that this is a deployment-swapping abstraction, not a vendor-swapping one. It centralises quota and metrics well; it has not been proven against a genuinely different provider.",
    questions: [Q.structuredOutput, Q.costShape],
    steps: [
      { label: "Provider factory", meta: "Resolve an implementation by name", kind: "source" },
      { label: "Choose an execution path", meta: "Chain-based generation, or schema-constrained parsing", kind: "deterministic" },
      { label: "Acquire quota", meta: "Token accounting and a shared budget slot before the call", kind: "gate" },
      { label: "Publish usage", meta: "Metrics emitted per call for attribution", kind: "deterministic" },
    ],
  },

  topology: {
    eyebrow: "Foundational decision · pipeline topology",
    title: "A fixed sequence, two constrained model calls, one retrieval hop.",
    reveal: "The path never varies, so nothing spends a model call deciding what the path should be.",
    summary:
      "The system chooses a fixed deterministic pipeline with two schema-constrained model calls over a tool-calling agent that plans its own route. Stage order is known in advance, each stage is independently testable, and every failure is attributable to one stage. It also runs off a queue rather than inside a request-response cycle, so there is no per-call latency SLA to protect — the resource actually being spent is worker throughput.",
    decisionHead: "Predictable cost and attributable failure over open autonomy",
    decisionBody: "The workflow is identical for every queued item and runs on a worker fleet sized for steady-state throughput, not for a caller waiting on a response. A known sequence with validated handoffs is worth more than the ability to discover a coordination path that is always the same one.",
    failure: "An agent spending model calls rediscovering a fixed sequence, with unbounded per-item cost eating into the throughput the worker fleet was sized for, and failures attributable only to a conversation trace.",
    tradeoff: "The pipeline cannot handle a request shape it was not designed for. Anything outside 'enrich pharmacotherapy actions with coverage' requires a code change rather than a new tool.",
    talk: "This is deliberately not an agent. It is a retrieval-augmented pipeline with two constrained reasoning steps, running off a queue rather than a live request — and I would defend that as the right call for a fixed, high-volume, asynchronous workflow.",
    questions: [Q.topologyChoice, Q.twoCalls, Q.whyRetrieval],
    steps: [
      { label: "Deterministic context", meta: "Coverage and action extraction — no model involved", kind: "deterministic" },
      { label: "Constrained classification", meta: "Clinical knowledge only; no coverage data in the prompt", kind: "reasoning" },
      { label: "Retrieval", meta: "The candidate set, built from plan data rather than recall", kind: "deterministic" },
      { label: "Constrained selection", meta: "A choice within a finite, caller-held answer space", kind: "reasoning" },
      { label: "Degrade, never block", meta: "Any stage may produce nothing without failing the request", kind: "gate" },
    ],
  },
};

/* ---------- level 3: components ---------- */

const COMPONENTS = {
  coverage: {
    "plan-lookup": {
      eyebrow: "Coverage · benefits lookup",
      title: "Plan Lookup",
      reveal: "Absence of a formulary is an answer, not an error.",
      owns: "Resolving the patient's formulary identifier, plan and payer identifiers, and the effective date of the formulary version that applies.",
      forbidden: "Interpreting clinical content, judging whether a drug is appropriate, or deciding that a missing formulary should stop the request.",
      receives: "The patient identifier and the request version.",
      validated: "Either a formulary identifier is present and traced with its plan context, or its absence is traced explicitly with the coverage context that was found instead.",
      wrong: "A formulary identifier can be present, current and correct, and still be the wrong one to filter against — a patient whose coverage changed mid-encounter has a valid record for a plan that no longer applies. The lookup is right; the effective date is the only thing that would reveal it, and nothing downstream re-checks it.",
      questions: [Q.noCoverage],
    },
    "insight-fetch": {
      eyebrow: "Coverage · clinical input",
      title: "Recommendation Fetch",
      reveal: "The clinical thinking has already happened. This pipeline enriches it; it does not perform it.",
      owns: "Retrieving the diagnoses and recommended actions generated for this patient by the upstream clinical reasoning service.",
      forbidden: "Generating, ranking or modifying clinical recommendations. It reads a produced artifact and passes it on unchanged.",
      receives: "The patient identifier and the request version.",
      validated: "The payload is traversed declaratively by the next stage, so an unexpected shape yields no actions rather than a partial or corrupted extraction.",
      wrong: "A complete, well-formed recommendation set can contain pharmacotherapy expressed in a phrasing the downstream filter does not recognise. The fetch is correct, the payload is correct, and the drug recommendation silently never enters the pipeline.",
      questions: [Q.costShape],
    },
  },

  classification: {
    "prompt-resolution": {
      eyebrow: "Classification · prompt resolution",
      title: "Prompt Resolution",
      reveal: "Prompts are versioned artifacts fetched at runtime, not strings compiled into the service.",
      owns: "Fetching the system and user prompt for a named prompt version from an external registry, and caching the result for the process lifetime.",
      forbidden: "Editing prompt content, choosing a version dynamically, or falling back to an inline default when the registry is unreachable.",
      receives: "A prompt version identifier from a fixed enumeration.",
      validated: "The registry is the single source of truth, and the version identifier is drawn from an enumeration rather than constructed, so an unknown version fails at the call site rather than silently fetching nothing.",
      wrong: "A cached prompt is correct at fetch time and unbounded thereafter. A prompt corrected in the registry after a bad release does not reach a running process until it restarts, so the fix is deployed and not in effect — and nothing in the trace distinguishes the two.",
      questions: [Q.structuredOutput],
    },
    "structured-execution": {
      eyebrow: "Classification · constrained call",
      title: "Structured Execution",
      reveal: "Decoding is bound to a declared schema. The parse cannot produce a shape the caller did not ask for.",
      owns: "Issuing the model call with a declared response schema, acquiring a quota slot first, releasing it after, and emitting timing and usage.",
      forbidden: "Interpreting the returned content, deciding whether the answer is clinically sensible, or retrying on its own — it raises and lets the caller decide.",
      receives: "A system prompt, a rendered user prompt, and the schema the response must satisfy.",
      validated: "The response is parsed into the declared type by the provider, and the caller re-checks that type before using it rather than trusting the parse.",
      wrong: "A response can satisfy the schema completely and still be clinically wrong — a plausible, well-formed class that is simply not what the intervention called for. Schema conformance is a statement about shape and carries no information about correctness.",
      questions: [Q.structuredOutput, Q.twoCalls],
    },
    "retry-loop": {
      eyebrow: "Classification · bounded retry",
      title: "Validate And Retry",
      reveal: "Well-formed and usable are different properties. This checks the second one.",
      owns: "Re-validating the returned type, retrying a bounded number of times, clearing partial results between attempts, and returning an empty result once the budget is exhausted.",
      forbidden: "Retrying without limit, or converting exhaustion into an exception that would fail the wider request.",
      receives: "The call to execute and the accumulated results from any prior attempt.",
      validated: "Every attempt is traced with its error, and exhaustion is traced distinctly from success so an empty result is attributable.",
      wrong: "The loop treats every failure identically. A rate limit and a content filter consume the same budget with no delay between attempts — so a transient failure that a short backoff would clear is retried instantly into the same limit, and a permanent refusal burns the full budget before giving up.",
      questions: [Q.structuredOutput, Q.failSoft],
    },
  },

  retrieval: {
    "sentinel-guard": {
      eyebrow: "Retrieval · short-circuit",
      title: "Sentinel Guard",
      reveal: "The cheapest call is the one that is never made.",
      owns: "Recognising the sentinel values classification emits for unresolvable input and returning an empty result before any network call is issued.",
      forbidden: "Guessing a class for an unresolvable action, or substituting a default class to keep the pipeline populated.",
      receives: "A class assignment for one action.",
      validated: "Every short-circuit is traced with the action, the sentinel value and the reason, so an empty candidate set is attributable to classification rather than to retrieval.",
      wrong: "The guard matches a fixed set of sentinel strings. A model that expresses uncertainty in new words — a class of 'unclear' or an empty string variant — passes the guard, consumes a service call, and returns nothing. The guard is correct and the vocabulary it guards against is not closed.",
      questions: [Q.costShape],
    },
    "index-call": {
      eyebrow: "Retrieval · covered-drug index",
      title: "Index Call",
      reveal: "This is the only stage that knows what the plan actually covers.",
      owns: "Resolving one therapeutic class against the plan's covered-drug index and returning the matching products.",
      forbidden: "Ranking clinical suitability, filtering by anything other than the class and formulary it was given, or falling back to a different formulary when one returns nothing.",
      receives: "A therapeutic class, a formulary identifier, and a run identifier for correlation.",
      validated: "Transport failures are retried with backoff at the client boundary; an empty result is traced distinctly from a failed call.",
      wrong: "The index can return a perfectly valid set of covered products for a class that is adjacent to the one the intervention needed. Every row is real, every row is covered, and the whole set is the wrong shelf — and because selection only sees what arrived, nothing downstream can tell.",
      questions: [Q.whyRetrieval, Q.closedSet],
    },
    "result-merge": {
      eyebrow: "Retrieval · rejoin",
      title: "Result Merge",
      reveal: "Parallel work rejoins on the identifier minted in stage 02.",
      owns: "Matching each completed retrieval back to its originating action and reducing the returned products to an identifier-to-name dictionary.",
      forbidden: "Reordering, deduplicating or trimming candidates on clinical grounds, or inventing an entry for an action that returned nothing.",
      receives: "Completed retrieval results and the list of actions to merge onto.",
      validated: "The merge is keyed on the action identifier rather than on position, so completion order cannot misattribute a result to the wrong action.",
      wrong: "The dictionary is keyed by product identifier, so two rows that are genuinely the same drug in different strengths both survive as distinct candidates. The merge is correct and it inflates the candidate list with near-duplicates that make the selection prompt larger without making the answer better.",
      questions: [Q.costShape, Q.threads],
    },
  },

  selection: {
    "viability-filter": {
      eyebrow: "Selection · viability",
      title: "Viability Filter",
      reveal: "An action with nothing to choose from is removed here, with its reason recorded.",
      owns: "Separating actions that carry both a class and a non-empty candidate set from those that do not, and tracing each exclusion with its specific reason.",
      forbidden: "Sending an action with an empty candidate set to the model, or collapsing 'no class' and 'no candidates' into one reason.",
      receives: "The merged actions with whatever classification and retrieval produced.",
      validated: "Every excluded action is traced individually with a distinct reason, so downstream emptiness is attributable to the stage that caused it.",
      wrong: "Exclusion is traced but not returned. An action dropped here is simply absent from the result, and a consumer counting recommendations against actions sees a discrepancy with no accompanying explanation in the response itself.",
      questions: [Q.failSoft],
    },
    "batch-partition": {
      eyebrow: "Selection · partitioning",
      title: "Batch Partition",
      reveal: "Batching amortises fixed prompt cost. The count is fixed; the size is not.",
      owns: "Splitting viable actions into a configured number of batches and reconciling any remainder so the batch count is exactly what was configured.",
      forbidden: "Splitting one action's candidate set across batches, or reordering actions in a way that breaks the rejoin.",
      receives: "The viable actions and the configured batch count.",
      validated: "Every viable action lands in exactly one batch, and the final count matches the configuration.",
      wrong: "Fixing the count rather than the size makes batch size a function of patient complexity. The same configuration produces small batches for a simple patient and large ones for a complex patient, so the patients with the most at stake get the largest prompts and the most degraded selection quality.",
      questions: [Q.batching, Q.costShape],
    },
    "table-render": {
      eyebrow: "Selection · rendering",
      title: "Candidate Table Rendering",
      reveal: "Formatting is deterministic. No model is asked to shape its own input.",
      owns: "Turning a batch of actions and their candidate sets into compact markdown tables for the prompt.",
      forbidden: "Filtering, ranking, summarising or omitting candidates. It changes presentation only, never the contents of the answer space.",
      receives: "A batch of viable actions with their candidate dictionaries.",
      validated: "Every candidate present in the input appears in the rendered output, so the rendered set and the caller's validation set are identical.",
      wrong: "A faithful rendering of a very long candidate list is still a very long prompt. Rendering is correct and the position of a candidate within a large table measurably affects whether it is chosen — a presentation-layer decision with a selection-quality consequence.",
      questions: [Q.batching, Q.costShape],
    },
    "batch-inference": {
      eyebrow: "Selection · constrained choice",
      title: "Batch Inference",
      reveal: "The model returns identifiers it was handed. It has no vocabulary for a drug it was not given.",
      owns: "Issuing one schema-constrained call per batch and returning the selected identifiers for every action in it.",
      forbidden: "Introducing a drug not present in the supplied candidate set, or deciding that an action needs no drug at all.",
      receives: "The rendered batch, the selection prompt, and the schema the response must satisfy.",
      validated: "The response type is checked before use, and every returned identifier is drawn from a set the caller already holds and can compare against.",
      wrong: "The model can select the single most reasonable product from a candidate set that should never have been retrieved, and the answer will be structurally valid, schema-conformant, genuinely covered by the plan — and clinically beside the point. Containment guarantees the shelf, never that it was the right shelf.",
      questions: [Q.closedSet, Q.classGranularity],
    },
    aggregation: {
      eyebrow: "Selection · aggregation",
      title: "Aggregation",
      reveal: "One failed batch costs that batch, not the patient.",
      owns: "Collecting completed batch results as they finish and combining them into one result set.",
      forbidden: "Failing the whole stage because one batch failed, or reordering results in a way that breaks the rejoin to the originating action.",
      receives: "Completed batch futures, each either a result set or an empty list.",
      validated: "Each batch handles its own failure and traces it, so a partial result set is explainable batch by batch.",
      wrong: "A failed batch and a batch that legitimately selected nothing both contribute an empty list. The aggregate is correct and the two cases are indistinguishable in it — the difference exists only in the trace, not in the value the next stage receives.",
      questions: [Q.failSoft, Q.threads],
    },
  },

  governance: {
    "trace-writer": {
      eyebrow: "Governance · tracing",
      title: "Trace Writer",
      reveal: "Skips are recorded as deliberately as results.",
      owns: "Writing structured decision records — message plus structured content — keyed to the patient and run, at every branch in the pipeline.",
      forbidden: "Failing the pipeline when the trace store is unavailable. A tracing outage must not become a clinical outage.",
      receives: "A message and a structured content object from any stage.",
      validated: "Writes are gated by configuration and failures are swallowed and logged, so tracing can never propagate an exception into the request path.",
      wrong: "The property that makes it safe is the property that makes it unreliable. Because a failed write is swallowed, a trace store that is silently rejecting writes looks exactly like a pipeline that had nothing to say — and the absence of records is only discovered when someone needs them to explain a specific request.",
      questions: [Q.evaluation, Q.failSoft],
    },
    timing: {
      eyebrow: "Governance · timing",
      title: "Stage Timing",
      reveal: "Timing is applied at stage boundaries by decorator, not threaded through the logic.",
      owns: "Capturing wall-clock duration for each decorated stage and recording it alongside the stage's trace records.",
      forbidden: "Altering the behaviour, arguments or return value of the stage it wraps.",
      receives: "The stage call it decorates.",
      validated: "Timing is applied uniformly at the boundary, so coverage does not depend on each stage remembering to instrument itself.",
      wrong: "Boundary timing measures a fan-out stage as its slowest branch, so a stage that issued twenty parallel calls and one that issued one look similar. The number is accurate and it hides the distribution that would actually explain a latency regression.",
      questions: [Q.costShape, Q.threads],
    },
    "token-budget": {
      eyebrow: "Governance · quota",
      title: "Token Budget",
      reveal: "A model call acquires a slot before it is allowed to proceed.",
      owns: "Counting tokens for a prospective call and acquiring, then releasing, a slot against a shared budget.",
      forbidden: "Letting a call proceed without accounting, or holding a slot across work that is not the call itself.",
      receives: "The prospective call and its rendered prompt.",
      validated: "Acquisition precedes every model call and release is paired with it, so an abandoned call cannot leak a slot.",
      wrong: "The budget governs calls, and the pipeline's concurrency is decided before any call is made. A hundred concurrent patients each fan out to their own unbounded batch pool, and the budget throttles the result rather than the fan-out — so pressure arrives as queuing and latency at the very end, where it is hardest to attribute.",
      questions: [Q.threads, Q.batching],
    },
    metrics: {
      eyebrow: "Governance · metrics",
      title: "Usage Metrics",
      reveal: "Usage is published to a stream, separately from the traces.",
      owns: "Emitting per-call model usage — model identity, token counts, timing — to a metrics stream for aggregate attribution.",
      forbidden: "Carrying clinical content. Metrics describe the call, not what the call was about.",
      receives: "The completed call's usage and identity.",
      validated: "Publication is asynchronous and failure-tolerant, so a metrics outage cannot enter the request path.",
      wrong: "Metrics answer how much and how fast, and this pipeline's open question is whether it is still correct. A release that degrades class accuracy changes no metric here — spend, latency and volume all look normal while the answers get worse.",
      questions: [Q.evaluation],
    },
  },
};

const RAIL_ORDER = ["coverage", "extraction", "classification", "retrieval", "selection", "synthesis", "governance"];

/* Stage-level React Flow diagrams are added per stage. Stages absent from this
   map render through the standard ladder panel. A stage listed here replaces
   its judgment, push and component sections with the diagram. */
const DIAGRAM_STAGES = {
  coverage: {
    engine: "reactflow",
    eyebrow: "01 · Patient coverage resolution — low-level design",
    title: "How a Patient ID becomes a coverage decision",
    intro:
      "Follow one Patient ID through the coverage request, bounded retry, three lookup outcomes, normalization, and the final gate that decides whether formulary enrichment can continue.",
    label: "Low-level design",
    flowTitle: "Patient coverage resolution",
    rule:
      "The phase has one exit condition: a formulary identifier must be present before plan context can move to the next phase.",
    notes: [
      [
        "Why Patient ID is enough",
        "Coverage is fetched for one patient at a time. The phase does not require a plan identifier as input because resolving that identifier is its job.",
      ],
      [
        "Why retry is bounded",
        "Temporary benefits-system failures deserve another attempt, but an open-ended retry would stall the patient's run. The retry limit makes the failure path deterministic.",
      ],
      [
        "Why every outcome is normalized",
        "Success, legitimate absence, and technical failure produce one consistent result shape. The formulary identifier is then the single gate for downstream enrichment.",
      ],
    ],
    details: {
      PATIENT: {
        eyebrow: "Input",
        title: "Patient ID",
        body: "The phase starts with one Patient ID. It uses that value to request the patient's current coverage; it does not expect coverage fields to be supplied in advance.",
      },
      LOOKUP: {
        eyebrow: "Coverage request",
        title: "Request the patient's coverage plan",
        body: "The benefits system is asked for the active formulary associated with this Patient ID. This is a deterministic lookup, not a model decision.",
      },
      RETRY: {
        eyebrow: "Resilience",
        title: "Bounded retry for temporary failures",
        body: "Only temporary lookup failures are retried. The number of attempts is capped so one unavailable dependency cannot hold the patient's run indefinitely.",
      },
      ACTIVE: {
        eyebrow: "Outcome · found",
        title: "Active formulary found",
        body: "The coverage system returns an active formulary identifier together with the available plan context. This is the only branch that can pass the final gate.",
      },
      NONE: {
        eyebrow: "Outcome · unavailable",
        title: "No formulary available",
        body: "The request succeeds, but the patient has no active formulary. This is a valid coverage outcome rather than a technical failure.",
      },
      FAILED: {
        eyebrow: "Outcome · failed",
        title: "Coverage lookup failed",
        body: "The benefits lookup still fails after bounded retry. The phase preserves that outcome and does not invent a formulary identifier.",
      },
      NORMALIZE: {
        eyebrow: "Normalization",
        title: "Normalize the coverage result",
        body: "All three lookup outcomes are converted into the same coverage result shape so the downstream decision does not depend on branch-specific data handling.",
      },
      INPUT: {
        eyebrow: "Given",
        title: "This patient's identifier",
        body: "The one thing this step is handed. It does not receive a plan, a payer, or any prior benefits data — everything about coverage is fetched fresh, inside this step, for this one patient.",
        sections: [
          {
            title: "Why it matters",
            body: "Nothing cached or assumed enters here. Whatever this step returns reflects this patient's benefits position at the moment it is asked, not at whatever moment an earlier stage last looked.",
          },
        ],
      },
      CALL: {
        eyebrow: "Outbound call",
        title: "Ask the benefits system for this patient's active coverage",
        body: "A single call, addressed to this one patient — never batched with anyone else's lookup, and never reused from a previous patient's result. This is a plain account lookup: no model, no inference, just a request for whatever this patient's plan currently states.",
        sections: [
          {
            title: "What can go wrong here",
            body: "Everything past this point exists because this call can end three different ways — it can return a plan, return nothing, or fail outright. All three are shown as worked examples below.",
          },
        ],
      },
      R1: {
        eyebrow: "Rule · scope",
        title: "One patient, one call",
        body: "This lookup is never batched with another patient's, and never reused across patients. Coverage is personal to the plan a specific patient is enrolled in, so nothing here is shared or amortised.",
      },
      R2: {
        eyebrow: "Rule · separation",
        title: "A broken call is not the same fact as an empty plan",
        body: "For as long as this step possibly can, it keeps 'the call failed' and 'the call succeeded and found nothing' as two different internal events — logged differently, understood differently — even though, as the worked example below shows, both currently end up looking the same to whatever reads the final record.",
      },
      R3: {
        eyebrow: "Rule · no guessing",
        title: "Nothing here is invented",
        body: "When nothing usable comes back — whether because the plan genuinely has nothing on file, or because the call itself broke — the record is left honestly blank. It is never filled in with a plausible-looking default that would make a missing answer look like a real one.",
      },
      ENGINE: {
        eyebrow: "Resolution",
        title: "Read back exactly what came back — or exactly how it failed",
        body: "No inference happens at this point. Whatever the benefits system actually returned is taken as-is; if the call throws instead of returning, that failure is caught here rather than left to crash this patient's entire run.",
        sections: [
          {
            title: "Why it matters",
            body: "This is the one place in the whole step where a decision gets made about how to treat a failure — swallow it and hand back a safe, empty shape, rather than let one patient's benefits outage take down the pipeline for every other patient in flight.",
          },
        ],
      },
      COL_A: {
        eyebrow: "Outcome · resolved",
        title: "Patient A — an active plan is on file",
        body: "The call succeeds and returns a real plan. The identifier itself, the plan name, the payer, and the date coverage took effect all come back populated — everything downstream needs to search this patient's actual formulary.",
      },
      COL_B: {
        eyebrow: "Outcome · legitimately empty",
        title: "Patient B — no plan currently on file",
        body: "The call succeeds without error, but there is nothing to return: this patient has no formulary right now. This is a valid, ordinary state — not a malfunction — and it is treated as one.",
      },
      COL_C: {
        eyebrow: "Outcome · call failed",
        title: "Patient C — the benefits system times out mid-call",
        body: "The call itself never completes. This step catches that failure and hands back the exact same empty shape as Patient B, deliberately, so that one broken outbound call degrades this one patient's run instead of crashing it.",
      },
      GAP: {
        eyebrow: "Honest limitation",
        title: "B and C now look identical",
        body: "An absent plan and a broken call both arrive at the next step as the same one blank identifier. They were distinguished a moment ago — internally, in what gets logged — and that distinction does not survive into the record itself.",
        sections: [
          {
            title: "Why this is worth naming",
            body: "Anyone reading the final outcome for Patient B or Patient C sees the same thing: no formulary, no further enrichment. There is currently no way, from the outcome alone, to tell 'this plan covers nothing here' apart from 'we don't actually know this patient's plan' — and those call for different follow-up.",
          },
        ],
      },
      GATE: {
        eyebrow: "Decision",
        title: "Is a formulary identifier present?",
        body: "One explicit check determines the handoff. A present formulary identifier allows the workflow to continue; an absent identifier stops formulary enrichment.",
      },
      STOP: {
        eyebrow: "No",
        title: "Stop formulary enrichment",
        body: "The normalized result is returned without continuing into drug-class identification, formulary retrieval, or covered-drug selection.",
      },
      GO: {
        eyebrow: "Yes",
        title: "Carry plan context to the next phase",
        body: "The formulary identifier and available coverage context move forward so later phases can classify, retrieve, and select against the patient's active plan.",
      },
    },
  },
  extraction: {
    engine: "reactflow",
    reactFlowMount: "mountExtractionReactFlow",
    eyebrow: "02 · Pharmacological intervention extraction — low-level design",
    title: "Keep only the patient actions a formulary can enrich",
    intro:
      "Retrieve the recommendation record, inspect every action deterministically, preserve only complete pharmacological actions, then either stop cleanly or hand them to drug-class identification.",
    label: "Low-level design",
    flowTitle: "Pharmacological intervention extraction",
    rule:
      "This phase never invents an action or identifier. It preserves complete medication-related actions from the upstream recommendation record and skips everything else.",
    notes: [
      ["No model call", "Traversal, type filtering, completeness checks, and the final list gate are deterministic."],
      ["The identifier is preserved", "The action identifier comes from the recommendation record. This phase does not mint or normalize a replacement."],
      ["Empty is a stop condition", "If no eligible complete actions survive, the existing clinical recommendations remain intact and formulary enrichment ends."],
    ],
    details: {
      PATIENT: { eyebrow: "Input", title: "Patient ID", body: "Identifies which patient's recommendation record must be retrieved." },
      PLAN: { eyebrow: "From phase 01", title: "Active plan context", body: "Coverage has already passed its formulary-identifier gate, so extraction is allowed to run." },
      REQUEST: { eyebrow: "Retrieval", title: "Request the patient's recommendation record", body: "Retrieve the diagnoses and actions previously produced for this Patient ID." },
      RECORD_GATE: { eyebrow: "Decision", title: "Was a recommendation record returned?", body: "A missing or failed retrieval cannot provide actions to extract, so the formulary path stops." },
      STOP_RECORD: { eyebrow: "No", title: "Stop: recommendation record unavailable", body: "No extraction or downstream formulary phase runs without a recommendation record." },
      REF_GATE: { eyebrow: "Decision", title: "Is its recommendation reference present?", body: "The reference is required to associate any later formulary result with the originating recommendation." },
      STOP_REF: { eyebrow: "No", title: "Stop: recommendation reference unavailable", body: "The record cannot be safely updated later, so formulary enrichment stops." },
      READ: { eyebrow: "Traversal", title: "Read actions across every diagnosis", body: "The nested recommendation tree is flattened into one stream of actions to inspect." },
      NEXT: { eyebrow: "Iteration", title: "Inspect the next action", body: "Each action is evaluated independently before the loop advances." },
      TYPE_GATE: { eyebrow: "Decision", title: "Is it pharmacological intervention or pharmacotherapy?", body: "Only those two medication-related categories enter the formulary pipeline." },
      SKIP_OTHER: { eyebrow: "No", title: "Skip this action", body: "Lifestyle, monitoring, referral, counselling, and other actions remain untouched and the scan continues." },
      COMPLETE_GATE: { eyebrow: "Decision", title: "Are the action identifier and action name present?", body: "Both are needed: the name carries clinical intent and the identifier rejoins downstream results to the source action." },
      SKIP_INCOMPLETE: { eyebrow: "No", title: "Skip incomplete action", body: "Missing values are not manufactured. The incomplete action is omitted and iteration continues." },
      KEEP: { eyebrow: "Yes", title: "Keep the action identifier and action name", body: "Preserve the upstream values as the compact work unit for later phases." },
      MORE: { eyebrow: "Loop", title: "Are more actions remaining?", body: "Continue until all actions across all diagnoses have been inspected." },
      ANY: { eyebrow: "Decision", title: "Were any eligible, complete actions kept?", body: "The extracted list itself controls whether drug-class identification has any work to perform." },
      STOP_EMPTY: { eyebrow: "No", title: "Stop formulary enrichment", body: "Return without formulary additions while preserving the existing clinical recommendations." },
      GO: { eyebrow: "Yes", title: "Carry actions to drug-class identification", body: "Pass the extracted actions with their recommendation reference and active plan context." },
    },
  },
  classification: {
    engine: "reactflow",
    reactFlowMount: "mountClassificationReactFlow",
    eyebrow: "03 · Drug class identification — low-level design",
    title: "Turn each medication action into a retrievable drug class",
    intro:
      "Resolve the versioned prompt, classify the complete extracted action list through one structured model call, validate the response, and retry from a clean state when the call is unusable.",
    label: "Low-level design",
    flowTitle: "Drug class identification",
    rule:
      "The schema guarantees a usable shape, not clinical correctness or complete coverage of every input action. Empty and exhausted outcomes degrade to no retrieval work.",
    notes: [
      ["One call for all actions", "The complete extracted list is classified together rather than issuing one model request per action."],
      ["Retry starts clean", "Any partial pairs from a failed attempt are cleared before the complete request is retried."],
      ["The honest limit", "The response shape requires non-empty fields, but this phase does not prove that the class is clinically correct or that every input action was returned."],
    ],
    details: {
      ACTIONS: { eyebrow: "Input", title: "Extracted pharmacological actions", body: "The phase receives the preserved action identifier and action name for every eligible action from Phase 02." },
      HAS_ACTIONS: { eyebrow: "Safeguard", title: "Are any extracted actions available?", body: "An empty input list avoids an unnecessary model request and produces an empty classification list." },
      EMPTY_INPUT: { eyebrow: "No", title: "Return an empty classification list", body: "The retrieval phase receives no drug classes and therefore has no searches to perform." },
      PROMPT: { eyebrow: "Prompt resolution", title: "Request the versioned drug-class prompt", body: "Fetch the system and user instructions selected for drug-class identification." },
      PROMPT_GATE: { eyebrow: "Decision", title: "Was the prompt retrieved?", body: "Prompt retrieval occurs before the classification retry loop and is not retried by it." },
      STOP_PROMPT: { eyebrow: "No", title: "Stop formulary processing", body: "Without the prompt, the wider formulary operation returns its default result." },
      FORMAT: { eyebrow: "Deterministic preparation", title: "Insert all extracted actions into the prompt", body: "Render the full action list into one classification request without changing its identifiers or names." },
      MODEL: { eyebrow: "Model reasoning", title: "Request structured drug-class identification", body: "The model is constrained to return a collection of action identifiers paired with drug classes." },
      VALID: { eyebrow: "Validation", title: "Did the call return the expected structured response?", body: "The response container must be the declared type and every returned pair must contain non-empty values." },
      FAILED: { eyebrow: "Failed attempt", title: "Record the failed attempt", body: "Model, parsing, response-type, and schema-validation failures enter the same retry path." },
      RETRY: { eyebrow: "Bounded retry", title: "Are attempts remaining?", body: "The call can be attempted again only while the fixed retry budget remains." },
      CLEAR: { eyebrow: "Clean retry", title: "Clear partial attempt output", body: "Discard any accumulated pairs before rerunning the complete action list." },
      EMPTY_FAILURE: { eyebrow: "Exhausted", title: "Return an empty class list", body: "Retry exhaustion fails soft: it returns no mappings instead of raising to the caller." },
      READ_PAIRS: { eyebrow: "Structured success", title: "Read returned action-to-class pairs", body: "Each returned item contains an action identifier and its proposed drug class." },
      ANY: { eyebrow: "Decision", title: "Were any class mappings returned?", body: "A structurally valid response may still contain an empty list." },
      EMPTY_VALID: { eyebrow: "No", title: "Carry an empty class list", body: "The next phase runs with no class searches to perform." },
      GO: { eyebrow: "Yes", title: "Carry validated mappings to retrieval", body: "Pass the returned action identifiers and drug classes into formulary retrieval." },
    },
  },
  retrieval: {
    engine: "reactflow",
    reactFlowMount: "mountRetrievalReactFlow",
    eyebrow: "04 · Formulary drug retrieval — low-level design",
    title: "Find covered drugs for every identified class",
    intro:
      "Fan the action-to-class mappings into bounded, plan-specific searches, normalize every outcome, and rejoin each candidate set to its originating recommendation action.",
    label: "Low-level design",
    flowTitle: "Formulary drug retrieval",
    rule:
      "Each search is isolated. One unusable mapping or failed lookup cannot cancel the other searches, and completion order never controls where results are attached.",
    notes: [
      ["Bounded fan-out", "At most five formulary searches run concurrently, with one independent job created for each action-to-class mapping."],
      ["Deterministic rejoin", "Workers may finish in any order; the action identifier reconnects each result to the correct source action."],
      ["Information discarded", "The attached candidate map preserves the formulary entry identifier and drug name. Search similarity and the distinction between no match and lookup failure remain trace information."],
    ],
    details: {
      MAPPINGS: { eyebrow: "Input", title: "Action-to-class mappings", body: "Each work item carries the originating action identifier and the drug class proposed in Phase 03." },
      ACTIONS: { eyebrow: "Input", title: "Extracted pharmacological actions", body: "The original compact action records are retained so completed searches can be joined back to the right recommendation action." },
      FORMULARY: { eyebrow: "Coverage context", title: "Active formulary identifier", body: "Every search is constrained to the patient's active covered-drug index from Phase 01." },
      HAS: { eyebrow: "Safeguard", title: "Are class mappings available?", body: "An empty classification result creates no retrieval jobs and leaves the extracted actions unchanged." },
      UNCHANGED: { eyebrow: "No", title: "Carry actions forward unchanged", body: "With no class mappings, there are no candidate drugs to attach." },
      FANOUT: { eyebrow: "Preparation", title: "Create one retrieval job per mapping", body: "Repeated classes remain separate work items because every result belongs to a specific action identifier." },
      POOL: { eyebrow: "Concurrency boundary", title: "Run with at most five workers", body: "The bounded pool limits simultaneous calls while allowing independent searches to complete out of order." },
      USABLE: { eyebrow: "Worker gate", title: "Are the action, class, and formulary values usable?", body: "A worker does not invent missing identifiers or search with an unknown class." },
      SKIP: { eyebrow: "No", title: "Record the skip", body: "The unusable mapping becomes a blank normalized result for its action and does not interrupt other workers." },
      SEARCH: { eyebrow: "Plan-specific retrieval", title: "Search the covered-drug index by class", body: "Query the vector manager within this formulary only, using the identified drug class as the retrieval intent." },
      FOUND: { eyebrow: "Outcome", title: "Covered candidates found", body: "The worker returns the matching formulary rows for later reduction and attachment." },
      NONE: { eyebrow: "Outcome", title: "No covered candidates", body: "A successful search may legitimately return no formulary rows for this class." },
      FAILED: { eyebrow: "Outcome", title: "Lookup failed", body: "A retrieval exception is contained inside this work item and recorded without cancelling the batch." },
      NORMALIZE: { eyebrow: "Worker output", title: "Normalize the retrieval result", body: "Every branch returns the same action-linked result shape, with a candidate list that may be empty." },
      COLLECT: { eyebrow: "Completion stream", title: "Read the next completed job", body: "Results are consumed as workers finish rather than in submission order." },
      READABLE: { eyebrow: "Result gate", title: "Is the completed result readable?", body: "An unexpected worker-level failure is traced and skipped so remaining completed jobs can still be joined." },
      SKIP_RESULT: { eyebrow: "No", title: "Skip the failed result", body: "No mutation is made for this job; collection continues with the remaining futures." },
      MATCH: { eyebrow: "Deterministic join", title: "Does its action identifier match a source action?", body: "The identifier, not completion position, selects the recommendation action to enrich." },
      LEAVE: { eyebrow: "No match", title: "Leave source actions unchanged", body: "A result that cannot be associated with a known action is not attached elsewhere." },
      ATTACH: { eyebrow: "Mutation", title: "Attach class and candidate map", body: "Add the identified class plus a map from formulary entry identifier to readable drug name. An empty result becomes an empty candidate map." },
      MORE: { eyebrow: "Loop", title: "Are more completed jobs waiting?", body: "Continue until every submitted retrieval job has been observed." },
      GO: { eyebrow: "Handoff", title: "Carry enriched actions to selection", body: "Pass the actions—each with its class and covered candidate set when available—to Relevant Drug Selection." },
    },
  },
  selection: {
    engine: "reactflow",
    reactFlowMount: "mountSelectionReactFlow",
    eyebrow: "05 · Relevant drug selection — low-level design",
    title: "Choose relevant drugs from the covered candidate set",
    intro:
      "Prepare a small number of independent batches, remove actions that have nothing usable to select from, and ask the model to retain the relevant covered drugs for each action.",
    label: "Low-level design",
    flowTitle: "Relevant drug selection",
    rule:
      "Selection is intended to remain inside the candidate set retrieved for each action. Batch failures fail soft, allowing successful batches to continue into final generation.",
    notes: [
      ["Closed-set selection", "The model receives the action context, identified class, and covered candidates returned by retrieval rather than an open drug catalogue."],
      ["Partial success", "Each batch is processed independently, so a failed batch contributes no selections without erasing another batch's successful results."],
      ["The honest limit", "This phase has no retry and does not deterministically verify that every identifier returned by the model appeared in the supplied candidate set."],
    ],
    details: {
      INPUT: { eyebrow: "Input", title: "Retrieved candidates for each action", body: "Each action arrives with its preserved identifier and name, identified drug class, and plan-specific formulary candidates." },
      HAS: { eyebrow: "Safeguard", title: "Are any actions available?", body: "An empty input list avoids prompt resolution, batch construction, and model calls." },
      EMPTY: { eyebrow: "No", title: "Return an empty selection list", body: "There are no action-to-drug selections to send into final generation." },
      PROMPT: { eyebrow: "Prompt resolution", title: "Request the versioned drug-selection prompt", body: "Fetch the system and user instructions used to select relevant drugs from the retrieved candidates." },
      BATCH: { eyebrow: "Batch preparation", title: "Split actions into balanced batches", body: "The current configuration divides the action list into at most two batches to reduce model calls." },
      PARALLEL: { eyebrow: "Concurrency", title: "Process the batches concurrently", body: "Each prepared batch runs as an independent selection task and can finish in any order." },
      FILTER: { eyebrow: "Deterministic filter", title: "Remove actions without a class or candidates", body: "Actions missing either value are traced and excluded because the model has no usable closed set for them." },
      CLOSED: { eyebrow: "Prompt preparation", title: "Format the remaining candidates as a closed set", body: "Render each action, drug class, and candidate identifier-to-name map into the batch prompt." },
      MODEL: { eyebrow: "Model reasoning", title: "Ask the model to select the relevant drugs", body: "One structured model call evaluates all retained actions inside this batch." },
      VALID: { eyebrow: "Response gate", title: "Was a valid batch result returned?", body: "The result must use the expected structured response container; an empty result is allowed." },
      FAILED: { eyebrow: "No", title: "Return no selections for this batch", body: "Unexpected output or an exception is traced and converted into an empty batch result. There is no retry here." },
      KEEP: { eyebrow: "Yes", title: "Keep selected drugs with the action identifier", body: "The returned action identifier preserves ownership of the selected formulary entries." },
      MERGE: { eyebrow: "Collection", title: "Merge completed batch results", body: "Successful results are flattened as batches finish. Failed or empty batches contribute no entries." },
      GO: { eyebrow: "Handoff", title: "Carry selected drugs to Final Recommendation Generation", body: "The next phase assembles the selected formulary entry identifiers into the final action mapping." },
    },
  },
  synthesis: {
    engine: "reactflow",
    reactFlowMount: "mountSynthesisReactFlow",
    eyebrow: "06 · Final recommendation generation — low-level design",
    title: "Assemble the coverage-aware recommendation",
    intro:
      "Bring the selected formulary drugs together with the patient's plan context and return one consistent recommendation result, whether coverage enrichment succeeded or produced no selections.",
    label: "Low-level design",
    flowTitle: "Final recommendation generation",
    rule:
      "Formulary intelligence enriches a pharmacological recommendation; it never suppresses the underlying clinical recommendation when no covered drug was selected.",
    notes: [
      ["Deterministic assembly", "This phase performs no model call. It organizes the completed selection results and coverage context into the final response."],
      ["Clinical recommendation preserved", "A pharmacological recommendation remains valid when no formulary drugs were selected, so the result can carry no coverage enrichment."],
      ["Consistent handoff", "Selected and unselected outcomes use the same business response before persistence and observability take over."],
    ],
    details: {
      SELECTED: { eyebrow: "Selection result", title: "Selected formulary drugs", body: "Receive the plan-covered drugs chosen for the patient's pharmacological recommendations in Phase 05." },
      CONTEXT: { eyebrow: "Coverage context", title: "Plan and formulary context", body: "Carry forward the plan, formulary, and effective coverage information established earlier in the pipeline." },
      COMBINE: { eyebrow: "Preparation", title: "Combine selections with the coverage context", body: "Create one coverage-aware view that can represent both enriched and unenriched pharmacological recommendations." },
      ANY: { eyebrow: "Decision", title: "Were any covered drugs selected?", body: "The presence of covered selections determines whether formulary information is attached, not whether the clinical recommendation survives." },
      EMPTY: { eyebrow: "No", title: "Keep the recommendation without formulary drugs", body: "The original pharmacological recommendation remains available even when selection produced no covered drugs." },
      ENRICH: { eyebrow: "Yes", title: "Associate the covered drugs with each recommendation", body: "Attach the relevant plan-covered choices to the pharmacological recommendation they support." },
      ASSEMBLE: { eyebrow: "Final assembly", title: "Assemble the final coverage-aware recommendation", body: "Return the same consistent business result whether formulary enrichment is populated or empty." },
      GO: { eyebrow: "Handoff", title: "Send the result for persistence and observability", body: "The next stage records the outcome and coordinates saving the coverage-aware recommendation." },
    },
  },
  governance: {
    engine: "reactflow",
    reactFlowMount: "mountGovernanceReactFlow",
    eyebrow: "07 · Governance and observability — low-level design",
    title: "Make every outcome visible and persist the recommendation",
    intro:
      "Observe successful work, deliberate skips, and degraded outcomes across the pipeline, govern shared model capacity, and record whether the final coverage-aware recommendation was stored.",
    label: "Low-level design",
    flowTitle: "Governance and observability",
    rule:
      "Observability is not allowed to suppress a valid clinical recommendation. A trace failure is contained, while the recommendation and persistence outcome continue through the request path.",
    notes: [
      ["Explain every outcome", "Phase events distinguish completed work, intentional skips, and failures so an empty enrichment result can be investigated."],
      ["Govern shared model use", "Classification and selection acquire shared model capacity, publish usage and timing, and release capacity after each call."],
      ["The honest limit", "Persistence is not retried, and trace or model-usage records can contain sensitive clinical context that requires appropriate access and retention controls."],
    ],
    details: {
      START: { eyebrow: "Request boundary", title: "Formulary intelligence processing begins", body: "Start one observable coverage-enrichment request for the patient." },
      OUTCOMES: { eyebrow: "Structured observation", title: "Record the outcome of every phase", body: "Capture successful work, deliberate skips and their reasons, and failures that caused the pipeline to degrade." },
      DURATION: { eyebrow: "Performance", title: "Capture phase duration", body: "Record elapsed time at important phase boundaries so slow dependencies and model operations can be investigated." },
      LIMIT: { eyebrow: "Usage control", title: "Apply the shared model-usage limit", body: "Classification and selection wait for available model capacity rather than exceeding the shared allowance." },
      USAGE: { eyebrow: "Model observability", title: "Record model timing and usage", body: "Capture the model outcome and timing, publish the usage record, and release the reserved capacity after the call." },
      RESULT: { eyebrow: "Persistence gate", title: "Is a final coverage-aware recommendation available?", body: "Only a completed recommendation result triggers an update in the recommendation service." },
      NO_RESULT: { eyebrow: "No result", title: "Record that no recommendation result was produced", body: "Finish without a persistence attempt while preserving an observable explanation of the outcome." },
      SAVE: { eyebrow: "Persistence", title: "Attempt to update the patient's recommendation", body: "Send the completed coverage-aware recommendation to the system that stores the patient's recommendations." },
      SAVED: { eyebrow: "Outcome gate", title: "Was the recommendation saved?", body: "Make the persistence outcome explicit instead of treating the update as assumed success." },
      NOT_SAVED: { eyebrow: "Unsuccessful persistence", title: "Record the save outcome", body: "The current workflow records the unsuccessful update and does not perform a persistence retry." },
      COMPLETE: { eyebrow: "Completion", title: "Mark formulary processing complete", body: "Close the request with the recommendation outcome and its observable processing history." },
    },
  },
};
