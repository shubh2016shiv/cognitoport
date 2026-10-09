/* ============================================================
   Full HLD: horizontal, explorable React Flow canvas
   ============================================================
   The canvas tells one left-to-right story while keeping the internal
   mechanics of each phase visible. Phase backgrounds and their components
   share one colour family. Nodes never navigate away: hover and keyboard
   focus reveal a compact explanatory bubble instead.
   ============================================================ */

import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType, BaseEdge } from "@xyflow/react";

const h = React.createElement;

const PHASES = {
  inputs:     { index: "01", title: "Inputs And Sources", note: "What the system is allowed to know", x: 0,    y: 40, w: 300, h: 900 },
  knowledge:  { index: "02", title: "Knowledge Base", note: "Built offline, read many times", x: 350,  y: 40, w: 300, h: 900 },
  context:    { index: "03", title: "Retrieval And Context", note: "Only relevant evidence moves forward", x: 700,  y: 40, w: 300, h: 900 },
  plan:       { index: "04", title: "Plan", note: "Resolve intent before code", x: 1050, y: 40, w: 360, h: 900 },
  execute:    { index: "05", title: "Execute", note: "Generate one gap; assemble the rest", x: 1460, y: 40, w: 380, h: 900 },
  critique:   { index: "06", title: "Critique", note: "The only bounded correction cycle", x: 1890, y: 40, w: 1040, h: 900 },
  post:       { index: "07", title: "Post-Critique", note: "Publish the valid script, run it, and measure the outcome", x: 2980, y: 40, w: 1770, h: 900 },
};

const LAYOUT = {
  REQ:     { phase: "inputs", icon: "description", tag: "HUMAN INPUT", x: 35,   y: 165, w: 230 },
  DOCS:    { phase: "inputs", icon: "documents", tag: "SOURCE", x: 35,   y: 410, w: 230 },
  ETLSRC:  { phase: "inputs", icon: "code", tag: "SOURCE", x: 35,   y: 565, w: 230 },

  ING:     { phase: "knowledge", icon: "ingestion", tag: "DETERMINISTIC", x: 385,  y: 390, w: 230 },
  STORE:   { phase: "knowledge", icon: "database", tag: "PERSISTED EVIDENCE", x: 385,  y: 585, w: 230 },

  RETR:    { phase: "context", icon: "search", tag: "DETERMINISTIC", x: 735,  y: 185, w: 230 },
  CTX:     { phase: "context", icon: "package", tag: "HANDOFF CONTRACT", x: 735,  y: 410, w: 230 },

  P1:      { phase: "plan", icon: "table", tag: "MODEL REASONING", x: 1095, y: 135, w: 270 },
  P2:      { phase: "plan", icon: "logic", tag: "MODEL / TEMPLATE", x: 1095, y: 315, w: 270 },
  GATE:    { phase: "plan", icon: "gate", tag: "DETERMINISTIC GATE", x: 1095, y: 505, w: 270, gate: true },
  GAP:     { phase: "plan", icon: "gap", tag: "BLOCKED PATH", x: 1095, y: 665, w: 270, blocked: true },

  SC:      { phase: "execute", icon: "scaffold", tag: "DETERMINISTIC", x: 1515, y: 105, w: 270 },
  E1:      { phase: "execute", icon: "function", tag: "MODEL REASONING", x: 1515, y: 270, w: 270 },
  E2:      { phase: "execute", icon: "assembly", tag: "DETERMINISTIC", x: 1515, y: 435, w: 270 },
  BRIDGE:  { phase: "execute", icon: "contract", tag: "CONTRACT GATE", x: 1515, y: 620, w: 270 },

  REV:     { phase: "critique", icon: "reviewers", tag: "7 SPECIALISTS", x: 1940, y: 165, w: 270 },
  DEC:     { phase: "critique", icon: "decision", tag: "DECISION", x: 2295, y: 165, w: 230, gate: true },
  FIX:     { phase: "critique", icon: "fix", tag: "MODEL · REPLAN", x: 1940, y: 390, w: 270 },
  PATCH:   { phase: "critique", icon: "patch", tag: "MODEL · EXECUTE", x: 1940, y: 590, w: 270 },
  GUARD:   { phase: "critique", icon: "guard", tag: "DETERMINISTIC", x: 2295, y: 590, w: 270 },
  NUANCE:  { phase: "critique", icon: "nuance", tag: "INDEPENDENT AGENT", x: 2630, y: 165, w: 250 },
  QEVAL:   { phase: "critique", icon: "evaluate", tag: "PURE PYTHON", x: 2630, y: 390, w: 250 },
  SCORE:   { phase: "critique", icon: "accept", tag: "EXIT GATE", x: 2630, y: 590, w: 250, gate: true },

  OUT:     { phase: "post", tone: "artifact", icon: "artifact", tag: "VALIDATED OUTPUT", x: 3070, y: 165, w: 270 },
  REPO:    { phase: "post", tone: "artifact", icon: "repository", tag: "PUBLISH", x: 3070, y: 325, w: 270 },
  ADF:     { phase: "post", tone: "artifact", icon: "pipeline", tag: "ORCHESTRATION", x: 3070, y: 485, w: 270 },
  RUN:     { phase: "post", tone: "success", icon: "runtime", tag: "EXECUTE", x: 3070, y: 645, w: 270 },

  PASS:    { phase: "post", tone: "success", icon: "accept", tag: "COMPLETED", x: 3525, y: 165, w: 390 },
  VFAIL:   { phase: "post", tone: "success", icon: "evaluate", tag: "COMPLETED", x: 3525, y: 315, w: 390 },
  CRASH:   { phase: "post", tone: "failure", icon: "gap", tag: "EXECUTION FAILURE", x: 3525, y: 465, w: 390 },
  NOTRUN:  { phase: "post", tone: "artifact", icon: "contract", tag: "NOT EXECUTED", x: 3525, y: 615, w: 390 },

  RATE:    { phase: "post", tone: "success", icon: "report", tag: "RESULTS DASHBOARD", x: 4130, y: 360, w: 500 },
};

const DETAILS = {
  REQ: {
    title: "Validation Description",
    sub: "Plain-English data-quality rule",
    paragraphs: [
      "A Validation Description is a plain-English sentence that describes a data-quality rule that must be checked on a healthcare data table. It typically names three things: the table being checked, the column being checked, and the rule it should satisfy, such as matching a reference table, not being null, or falling within a valid range.",
      "It is the starting point of the whole system. A QA analyst or data engineer writes this sentence, and the system determines everything else: which tables are involved, how they join, and what code must be written to run the check.",
    ],
  },
  DOCS: {
    title: "Schema And Methodology Documents",
    sub: "Human-written source of truth",
    blocks: [
      {
        type: "paragraph",
        text: "Schema and methodology documents are the reference PDFs that describe how healthcare data is structured and how it should be transformed as it moves through the pipeline.",
      },
      { type: "paragraph", text: "The data moves through four layers:" },
      {
        type: "unordered",
        items: [
          { label: "L1", separator: "", text: "is the raw source data, exactly as it arrives from source systems." },
          { label: "L2 (Standardization)", separator: "", text: "is where raw data is cleaned and put into standard tables with consistent column names, types, and values." },
          { label: "L3 (Modular Enrichments)", separator: "", text: "is where standard tables are joined together and enriched to create new, more useful tables." },
          { label: "L4 (Analytic Enrichments)", separator: "", text: "is where higher-level analytical tables are built on top of L3." },
        ],
      },
      {
        type: "paragraph",
        text: "Each layer has its own PDF document that describes two things:",
      },
      {
        type: "ordered",
        items: [
          { label: "Schema", text: "the blueprint of each table in that layer, including its column names, data types, and allowed values." },
          { label: "Methodology", text: "the business rules and transformation logic that explain how tables in that layer are built from the previous layer." },
        ],
      },
      {
        type: "paragraph",
        text: "These documents are the authoritative source of truth that the system reads to learn what tables exist, what columns they contain, and what rules must hold for the data to be valid. They are not code. They are human-written reference material that the system ingests and turns into searchable knowledge before generating any validation tests.",
      },
    ],
  },
  ETLSRC: {
    title: "Production ETL Scala Code",
    sub: "The pipeline's working implementation",
    blocks: [
      {
        type: "paragraph",
        text: "Production ETL Scala Code is the actual program code that moves and transforms healthcare data in the live pipeline. It is the real, working implementation of how data flows from one layer to the next, from L1 through L4, written in the Scala programming language.",
      },
      {
        type: "paragraph",
        text: "While the schema and methodology PDFs describe what should happen, the Scala ETL code shows what actually happens. The code reveals concrete details such as:",
      },
      {
        type: "unordered",
        items: [
          "Which exact tables are joined together, and on which columns.",
          "How a source value is renamed, reformatted, or transformed into a target value.",
          "Which lookup tables a value is checked against.",
          "Which conditions filter out or include rows.",
        ],
      },
      {
        type: "paragraph",
        text: "The system reads this code once, offline, and extracts these facts into a searchable index. Later, when the system needs to know how two tables actually connect, it consults this pre-parsed index instead of reading the raw Scala code every time.",
      },
    ],
  },
  ING: {
    title: "Ingestion Pipeline",
    sub: "Offline Reading And Organization",
    blocks: [
      {
        type: "paragraph",
        text: "The Ingestion Pipeline is the offline process that reads the schema and methodology PDFs and the production Scala ETL code, and turns them into a searchable knowledge base that the rest of the system can query.",
      },
      {
        type: "paragraph",
        text: "Think of it as the reading and organizing phase that happens before any test is generated.",
      },
      { type: "paragraph", text: "It does four main jobs:" },
      {
        type: "ordered",
        items: [
          { label: "Parse", text: "extract text from the PDF documents and read the Scala source code." },
          { label: "Chunk", text: "break that text into small, meaningful pieces, such as a single table's schema or a single business rule." },
          { label: "Extract Lineage", text: "determine, for each column, where its value came from, including the upstream table, source column, and transformation that produced it." },
          { label: "Embed And Index", text: "convert the chunks into searchable vector form and build structured indexes so the system can quickly retrieve the schema for a table or the join keys for two tables." },
        ],
      },
      {
        type: "paragraph",
        text: "This runs once, ahead of time, rather than once per test case. The knowledge base is stored and read many times during test generation. The process is also idempotent, meaning that running it again on the same documents produces the same result without creating duplicates.",
      },
      {
        type: "paragraph",
        text: "The key idea is that raw PDFs and Scala code are difficult for a model to query on the fly. The Ingestion Pipeline converts them once into a form the system can retrieve reliably. When the system later needs to ground an answer in real facts, those facts are already organized and ready.",
      },
    ],
  },
  STORE: {
    title: "Knowledge Store",
    sub: "Searchable System Memory",
    blocks: [
      {
        type: "paragraph",
        text: "The Knowledge Store is the organized, searchable database where the Ingestion Pipeline stores everything it learned from the schema and methodology PDFs and the Scala ETL code.",
      },
      {
        type: "paragraph",
        text: "Think of it as the system's memory. After the raw documents are parsed, chunked, and indexed, the results are saved here so the system can look up facts quickly instead of reading the original PDFs again every time.",
      },
      { type: "paragraph", text: "It stores three kinds of facts:" },
      {
        type: "unordered",
        items: [
          { label: "Schemas", text: "the column names, data types, and rules for each table." },
          { label: "Business Logic", text: "the plain-English rules about how data should behave." },
          { label: "Lineage", text: "where each column's value came from and how it was transformed." },
        ],
      },
      {
        type: "paragraph",
        text: "The store supports two kinds of lookup. A vector search finds passages that are similar in meaning to a question. A structured index finds exact facts, such as which columns a table contains or which joins a table uses.",
      },
      {
        type: "paragraph",
        text: "A key design point is portability. In local development, the store runs on ChromaDB, a lightweight database that requires no cloud services. In production, the same store is backed by Azure AI Search, a managed cloud service. The system always communicates with the store through a generic interface, so moving from local to cloud requires a configuration change rather than a rewrite of business logic.",
      },
    ],
  },
  RETR: {
    title: "Retrieval Service",
    sub: "The Only Knowledge Store Reader",
    blocks: [
      {
        type: "paragraph",
        text: "The Retrieval Service is the one component allowed to read from the Knowledge Store. Nothing else in the pipeline searches the knowledge base directly. Every stage that needs a fact about a table asks this service, and the service knows how to find it.",
      },
      { type: "heading", text: "Input And Output" },
      {
        type: "paragraph",
        text: "The input is a table name. The output always contains three things:",
      },
      {
        type: "unordered",
        items: [
          { label: "Schema", text: "the table's columns, their types, and whether each column can be null." },
          { label: "Business Rules", text: "the business-rule text that applies to the table." },
          { label: "Lineage", text: "where each column's data came from, traced through the ETL code." },
        ],
      },
      { type: "heading", text: "Why Fetching Is Centralized" },
      {
        type: "paragraph",
        text: "If every stage searched the Knowledge Store independently, each stage would need separate logic for deciding what counts as a good match. That logic would drift out of sync over time. Centralizing retrieval creates one definition of how to find the right evidence and gives every stage a consistent answer.",
      },
      { type: "heading", text: "The Hybrid Knowledge Store" },
      {
        type: "paragraph",
        text: "Every stored schema, rule passage, and lineage record has two things attached: a similarity vector that represents the meaning of its text, and plain metadata labels such as a table name or ingestion run ID. Together, they support exact lookup and similarity search.",
      },
      { type: "heading", text: "Search Type 1: Exact Match" },
      {
        type: "paragraph",
        text: "Exact lookup is used for schema and lineage because those records are stored with a table-name label. To retrieve a schema, the service filters directly for the record whose table-name label equals <TABLE_NAME>. This is a direct database lookup, not a similarity search, and it handles most requests.",
      },
      { type: "heading", text: "Search Type 2: Similarity Search" },
      {
        type: "paragraph",
        text: "Similarity search is used for business-rule text because those rules are free-form writing and may not repeatedly name their table. The service searches by meaning, enriching the query with the table's column names so relevant passages have more evidence to match against.",
      },
      { type: "heading", text: "Why Similarity Alone Is Not Trustworthy" },
      {
        type: "paragraph",
        text: "A paragraph about one table can score as a close match for another table because both use similar column vocabulary. Meaning similarity cannot distinguish between evidence about the requested table and evidence that merely uses similar words. Without another check, this creates false positives.",
      },
      { type: "heading", text: "Deterministic Filtering" },
      {
        type: "paragraph",
        text: "Every similarity result is evaluated with repeatable text checks, with no model involved:",
      },
      {
        type: "unordered",
        items: [
          "Does the passage literally contain the table's name?",
          "Does the passage appear near that table's schema definition in the source document?",
          "Does the passage contain rule-like language such as must, should, required, or valid?",
        ],
      },
      {
        type: "paragraph",
        text: "The checks sort results into three groups. Strong matches are returned first. Weak matches are retained as backup when no strong match exists. All remaining results are discarded. These deterministic checks produce the same output for the same input and consume no model tokens.",
      },
      { type: "heading", text: "Combined Retrieval Strategy" },
      {
        type: "paragraph",
        text: "The Retrieval Service uses exact lookup where an answer has a name, similarity search where an answer has only meaning, and deterministic filtering to make fuzzy results reliable enough for the next stage. Results are cached because the same table may be requested many times, so the search cost is paid once per table rather than once per question.",
      },
      { type: "heading", text: "Swappable Storage Backend" },
      {
        type: "paragraph",
        text: "The Retrieval Service communicates through a generic interface, such as finding the schema for a table, rather than talking directly to a specific database. Configuration selects the underlying backend. Development can use ChromaDB, while production can use Azure AI Search. Retrieval behavior remains unchanged because the service does not depend on either implementation.",
      },
    ],
  },
  CTX: {
    title: "Context Package",
    sub: "Shared Evidence Contract",
    blocks: [
      {
        type: "paragraph",
        text: "The Context Package is a single structured object that holds every fact a reasoning stage needs for one validation test. Those facts are gathered into one place before any reasoning happens. The package is built once per test and handed unchanged to every downstream stage. Plan, Execute, Critique, and Evaluation all read from the same package.",
      },
      { type: "heading", text: "Why It Exists" },
      {
        type: "paragraph",
        text: "The Retrieval Service knows how to fetch individual facts. If each reasoning stage called it separately, a stage could ask a slightly different question and receive a different answer, the same schema could be fetched repeatedly, and there would be no single record of the evidence used to make a decision. Building one package up front solves all three problems. It creates one shared answer, caches it once, and keeps it fully inspectable after the fact.",
      },
      { type: "heading", text: "Why Batching Is Efficient" },
      {
        type: "paragraph",
        text: "If one hundred test cases target the same table, that table's schema is fetched once rather than one hundred times. Every Context Package built for that table reuses the same cached result.",
      },
      { type: "heading", text: "Generic Structure" },
      {
        type: "code",
        text: `{
  "payload": {
    "case_number": "<CASE_NUMBER>",
    "table": "<TARGET_TABLE>",
    "validation_test": "<SHORT_TEST_NAME>",
    "validation_test_description": "<FULL_ENGLISH_DESCRIPTION>"
  },
  "schema": {
    "table_name": "<TARGET_TABLE>",
    "columns": [
      {
        "column_name": "<COLUMN_1>",
        "data_type": "<TYPE>",
        "nullable": false,
        "description": "<COLUMN_MEANING>"
      }
    ]
  },
  "lookup_schemas": [
    {
      "table_name": "<REFERENCE_TABLE>",
      "columns": [
        {
          "column_name": "<COLUMN_2>",
          "data_type": "<TYPE>",
          "nullable": false
        }
      ]
    }
  ],
  "lineage": {
    "rows": [
      {
        "table": "<TARGET_TABLE>",
        "column": "<COLUMN_2>",
        "source_table": "<UPSTREAM_TABLE>",
        "source_column": "<UPSTREAM_COLUMN>",
        "rule": "<TRANSFORMATION>",
        "confidence": "high"
      }
    ]
  },
  "etl_context_block": {
    "joins": [
      {
        "left": "<TARGET_TABLE>",
        "right": "<REFERENCE_TABLE>",
        "keys": ["<COLUMN_2>"],
        "type": "left"
      }
    ]
  },
  "join_evidence": [
    {
      "table_pair": ["<TARGET_TABLE>", "<REFERENCE_TABLE>"],
      "keys": ["<COLUMN_2>"],
      "classification": "SAFE"
    }
  ],
  "available_tables": ["<TARGET_TABLE>", "<REFERENCE_TABLE>"],
  "missing_lookup_tables": [],
  "known_gaps": []
}`,
      },
      {
        type: "paragraph",
        text: "Every field answers one specific question that a later stage will need to ask. Nothing is decorative. At least one downstream stage reads every field.",
      },
      { type: "heading", text: "What Each Field Answers" },
      {
        type: "unordered",
        items: [
          { label: "payload", text: "preserves the original request in its exact words, so later stages can check the literal description instead of trusting an earlier interpretation." },
          { label: "schema", text: "describes the target table's columns, types, nullability, and the meaning of each column." },
          { label: "lookup_schemas", text: "lists required reference-table structures separately and includes only relevant columns, preventing confusion between target and reference columns that share a name." },
          { label: "lineage", text: "traces each relevant value to its upstream table and source column, records its transformation, and states the confidence of that trace." },
          { label: "etl_context_block", text: "records join relationships exactly as they appear in the production ETL code rather than inferring them from table names." },
          { label: "join_evidence", text: "classifies each possible join as SAFE, AMBIGUOUS, or BLOCKED so downstream reasoning never has to guess whether a join key is trustworthy." },
          { label: "available_tables", text: "lists every table the Knowledge Store knows about for this test's context." },
          { label: "missing_lookup_tables", text: "explicitly lists required tables that are absent, allowing a later stage to report the gap instead of inventing a plausible schema." },
          { label: "known_gaps", text: "states anything else the system already knows it does not know, before that uncertainty becomes a downstream failure." },
        ],
      },
      { type: "heading", text: "Core Idea" },
      {
        type: "paragraph",
        text: "Instead of allowing every reasoning stage to search the Knowledge Store independently and risk a different answer each time, one Context Package is assembled once per test. Plan, Execute, Critique, and Evaluation all work from that exact same set of facts.",
      },
    ],
  },
  P1: {
    title: "Table Resolution Agent",
    sub: "Tables · Loaders · Join Keys · Evidence",
    blocks: [
      {
        type: "paragraph",
        text: "Table Resolution is the first reasoning step the pipeline runs for a validation test. It answers exactly one question: which tables does this test touch, and how do those tables connect to each other? Business logic, checks, and filters are not decided here. This step only identifies the entities.",
      },
      { type: "heading", text: "Input And Output" },
      {
        type: "paragraph",
        text: "It takes the plain-English Validation Description from the Context Package payload and produces a concrete, structured object that names the tables involved and explains how they join.",
      },
      {
        type: "code",
        text: `{
  "primary_table": "<TARGET_TABLE>",
  "reference_tables": [
    {
      "name": "<REFERENCE_TABLE>",
      "join_key": "<TARGET_TABLE>.<COLUMN_A> = <REFERENCE_TABLE>.<COLUMN_B>",
      "join_type": "LEFT",
      "role": "critical_ref"
    }
  ]
}`,
      },
      { type: "heading", text: "Why This Is Not Model Guessing" },
      {
        type: "paragraph",
        text: "The model is never asked to recall or invent table names or join keys from memory. Before Table Resolution runs, the Context Package provides three forms of grounded evidence:",
      },
      {
        type: "unordered",
        items: [
          "The target table's real schema, fetched from the Knowledge Store.",
          "Candidate reference tables that the Validation Description names.",
          "Real join evidence from the production ETL code, showing which columns connect the tables.",
        ],
      },
      {
        type: "paragraph",
        text: "The model's task is deliberately narrow. It selects the correct tables from known candidates and confirms the join using supplied evidence. It selects and confirms rather than generating from scratch.",
      },
      { type: "heading", text: "Deterministic Plan Validation" },
      {
        type: "paragraph",
        text: "The model's output is checked by deterministic code before any downstream stage can use it:",
      },
      {
        type: "ordered",
        items: [
          "Every table in the plan must exist in the table registry.",
          "Every join key must exist as a real column in both table schemas.",
          "Every table must use the loading method required by its table type.",
        ],
      },
      {
        type: "paragraph",
        text: "These are literal rule checks rather than model judgment. When a plan fails, the exact failure reason is returned to the model and the step retries within a limited attempt budget.",
      },
      { type: "heading", text: "Core Idea" },
      {
        type: "paragraph",
        text: "Table Resolution is the step that establishes which data the system is looking at. It locks in the tables and joins, verifies that decision against real schemas and production code, and completes before business logic is interpreted or code is written.",
      },
    ],
  },
  P2: {
    title: "Business Logic Extraction Agent",
    sub: "Scope · Check · Pass/Fail · Metrics · Gating",
    blocks: [
      {
        type: "paragraph",
        text: "Business Logic Extraction is the second reasoning step in the pipeline and runs immediately after Table Resolution. It answers one question: once the tables and joins are known, what does the Validation Description require, precisely enough for code to be written from it?",
      },
      { type: "heading", text: "Why The English Description Is Not Enough" },
      {
        type: "paragraph",
        text: "A statement such as \"<COLUMN_A> must be a valid value found in <REFERENCE_TABLE>, and NULL values are acceptable\" appears clear to a human. A careful engineer knows to exclude NULL rows, compare the remaining values with the lookup table, and flag values that do not match. The sentence itself does not explicitly define the evaluation scope, the comparison strategy, the failure condition, or the required report. This agent makes each hidden decision explicit before any code is written.",
      },
      { type: "heading", text: "Five Questions The Agent Answers" },
      {
        type: "ordered",
        items: [
          { label: "Which Rows Are In Scope?", text: "If NULL values are acceptable, NULL rows are excluded from evaluation rather than counted as failures. A statement that applies only to a subset of rows becomes an explicit filter." },
          { label: "What Does Valid Mean?", text: "The agent selects the required validation pattern, such as matching a lookup value, falling within a numeric range, or satisfying a required format." },
          { label: "What Counts As Failure?", text: "An implied failure is converted into an explicit condition that later code can evaluate directly." },
          { label: "What Must The Test Report?", text: "The agent supplies the standard metric names expected by downstream reporting so every generated test follows the same output contract." },
          { label: "What Happens If Required Data Is Missing?", text: "The agent selects the gating behavior before generation, such as skipping the test with a clear reason when a required reference table is unavailable." },
        ],
      },
      { type: "heading", text: "Locked Output Contract" },
      {
        type: "code",
        text: `{
  "scope": "NULL values excluded from evaluation",
  "join_strategy": {
    "type": "LEFT",
    "on": "<TARGET_TABLE>.<COLUMN_A> = <REFERENCE_TABLE>.<COLUMN_B>"
  },
  "pass_condition": "every non-null <COLUMN_A> matches a value in <REFERENCE_TABLE>",
  "fail_condition": "at least one non-null <COLUMN_A> has no match",
  "metrics_keys": [
    "total_records",
    "records_passed",
    "failed",
    "failed_rate"
  ],
  "gating": "skip the test if <REFERENCE_TABLE> is missing"
}`,
      },
      { type: "heading", text: "What Each Decision Controls" },
      {
        type: "unordered",
        items: [
          { label: "scope", text: "defines which rows the check evaluates." },
          { label: "join_strategy", text: "states exactly how the target and reference tables are compared." },
          { label: "pass_condition / fail_condition", text: "turns an ambiguous word such as valid into conditions that code can evaluate as true or false." },
          { label: "metrics_keys", text: "locks the report field names required by the downstream dashboard." },
          { label: "gating", text: "defines what happens when required data is unavailable. The system skips and explains rather than generating code against an unknown table." },
        ],
      },
      { type: "heading", text: "What This Agent Does Not Do" },
      {
        type: "paragraph",
        text: "It does not reopen the tables or join evidence already locked and validated by the Table Resolution Agent. It does not write code. It also does not add requirements that the Validation Description never requested. Every decision resolves an ambiguity already present in the sentence.",
      },
      { type: "heading", text: "Why This Is A Separate Step" },
      {
        type: "paragraph",
        text: "This work is interpretation rather than generation. The resulting object becomes the single specification used by every later stage. The code generator implements it, reviewers compare generated code against it, and Evaluation scores the finished script against it. When there is a question about what a test was supposed to check, this artifact provides the answer.",
      },
    ],
  },
  GATE: {
    title: "Feasibility Gate",
    sub: "Pre-Generation Evidence Checkpoint",
    blocks: [
      {
        type: "paragraph",
        text: "The Feasibility Gate is a checkpoint, not a reasoning step. It runs after Business Logic Extraction Agent finishes and before any code-writing model call begins. It asks one question: does the system have enough verified information to generate this test safely?",
      },
      { type: "heading", text: "The Specific Check" },
      {
        type: "paragraph",
        text: "When the approved plan requires a reference table such as <REFERENCE_TABLE>, the gate checks whether that table's schema was ingested into the Knowledge Store. A present schema provides real column names, data types, and structure. A missing schema leaves the system with only an unverified table name.",
      },
      { type: "heading", text: "Why A Missing Schema Is Dangerous" },
      {
        type: "paragraph",
        text: "Without a real schema, code generation would have to invent the columns needed for the comparison. The result could contain convincing table names, join keys, and logic while having no basis in the actual data. The gate prevents this kind of confident, well-formed hallucination before it reaches generated code.",
      },
      { type: "heading", text: "Two Deterministic Outcomes" },
      {
        type: "unordered",
        items: [
          "Ready: every required schema is present. The test proceeds to code generation without changing the approved specification.",
          "Blocked: a required table is missing. The test is skipped, no code is generated, and a specific human-readable reason is recorded.",
        ],
      },
      { type: "heading", text: "Example Blocked Reason" },
      {
        type: "code",
        text: "required reference table <REFERENCE_TABLE> not found in knowledge base",
      },
      { type: "heading", text: "The Deliberate Trade-Off" },
      {
        type: "paragraph",
        text: "Skipping may produce fewer completed tests, but it creates a visible and explainable gap. Allowing an unverified script to complete would create a hidden failure that appears successful until it is checked against real data later.",
      },
      { type: "heading", text: "Why This Gate Runs Here" },
      {
        type: "paragraph",
        text: "Critique and Independent Evaluation inspect code after it exists. This gate acts earlier. It catches one high-severity condition, generation without a required table schema, before any code-generation cost is spent and before unsupported assumptions can become plausible-looking code.",
      },
    ],
  },
  GAP: {
    title: "Gap Report",
    sub: "Actionable Incomplete Outcome",
    blocks: [
      {
        type: "paragraph",
        text: "A Gap Report is the structured record the system writes whenever it cannot honestly finish a test. Instead of guessing or producing an artifact that only appears complete, the system records what stopped it and what is needed next.",
      },
      { type: "heading", text: "The Situation It Solves" },
      {
        type: "paragraph",
        text: "If the Feasibility Gate discovers that a required table schema was never ingested, generation cannot be grounded in verified columns or structure. Proceeding would force the model to invent plausible details that could fail at runtime or silently produce an incorrect result.",
      },
      {
        type: "paragraph",
        text: "The safe outcome is to skip the test and state the reason clearly. A team can act on a visible missing input. It cannot reliably act on a confident-looking script that gives no indication its foundation was guessed.",
      },
      { type: "heading", text: "Skipped Outcome Contract" },
      {
        type: "code",
        text: '{\n  "status": "skipped",\n  "gaps": [\n    {\n      "test_id": "<TEST_ID>",\n      "issue": "required reference table <REFERENCE_TABLE> not found in the knowledge base",\n      "needed_inputs": ["<REFERENCE_TABLE> schema"]\n    }\n  ]\n}',
      },
      { type: "heading", text: "Three Fixed Questions" },
      {
        type: "unordered",
        items: [
          "test_id: which specific test was not completed, so it can be found and revisited.",
          "issue: what was missing or unresolved, stated in plain, human-readable language.",
          "needed_inputs: exactly what would resolve the gap, making the report actionable rather than merely informational.",
        ],
      },
      { type: "heading", text: "Used At Two Pipeline Checkpoints" },
      {
        type: "ordered",
        items: [
          "Before code generation: the Feasibility Gate records a skipped test when a required table was not ingested.",
          'After code generation: Critique records status "partial" when its iteration budget ends before the script reaches the quality threshold. The remaining review issues become the needed inputs.',
        ],
      },
      { type: "heading", text: "Why One Shared Shape Matters" },
      {
        type: "paragraph",
        text: "Whether work stops before code exists or after several review rounds, the system always identifies the test, explains the specific problem, and states what would fix it. This is how the pipeline fails loudly and usefully: never silently, never by presenting a guess as an answer, and always with a clear next action.",
      },
    ],
  },
  SC: {
    title: "Code Scaffold Builder",
    sub: "Deterministic Script Framework",
    blocks: [
      {
        type: "paragraph",
        text: "The Code Scaffold Builder assembles the fixed structural portion of every validation script without using AI. It produces the file from a trusted template and leaves exactly one intentional gap for the test-specific validation logic.",
      },
      { type: "heading", text: "The Design Insight" },
      {
        type: "paragraph",
        text: "Every PySpark validation script uses the same surrounding skeleton. Only the business-rule function body changes from one test to another. Generating stable boilerplate with a model would waste tokens and introduce unnecessary variation into code that should remain identical.",
      },
      { type: "heading", text: "What The Builder Creates" },
      {
        type: "ordered",
        items: [
          "Header: module docstring.",
          "Imports: standard library followed by PySpark.",
          "Constants: TEST_ID, TEST_NAME, and TABLE_NAME.",
          "write_validation_report_json(): fixed framework code.",
          "safe_load_lookup(): fixed framework code.",
          "load_data(): pre-built table-loading code.",
          "validate_business_rules(): the single placeholder filled by the model-generated function body.",
          "generate_validation_report(): fixed framework code.",
          "main(): fixed framework orchestration.",
          "Entry guard: fixed framework code.",
        ],
      },
      { type: "heading", text: "Protected Framework Regions" },
      {
        type: "paragraph",
        text: "Every fixed section is a framework region. It comes from the template, is not owned by the model, and must remain unchanged across scripts. Later deterministic checks reject modifications to these protected regions, even when a change appears harmless.",
      },
      { type: "heading", text: "How The Two Pieces Are Assembled" },
      {
        type: "paragraph",
        text: "After the model produces validate_business_rules(), a separate deterministic assembly step inserts that body into the placeholder, adds any required imports that are not already present, and verifies that the completed file is valid, parseable Python.",
      },
      { type: "heading", text: "Why The Split Matters" },
      {
        type: "paragraph",
        text: "The model owns one function body only. Imports, loading, reporting, error handling, orchestration, and the entry point come from a template that costs no model tokens, behaves consistently, and can be tested once as trusted framework code. This boundary prevents model-generated logic from corrupting the stable parts of the script.",
      },
    ],
  },
  E1: {
    title: "Validation Business Rule Generation Agent",
    sub: "Locked Specification To PySpark Logic",
    blocks: [
      {
        type: "paragraph",
        text: "This is where the AI writes code. Given the two locked planning outputs, which tables and joins are involved and what the rule means in executable terms, the agent produces the PySpark logic that implements the validation rule.",
      },
      { type: "heading", text: "A Deliberately Narrow Responsibility" },
      {
        type: "paragraph",
        text: "Table Resolution Agent has already fixed the tables and joins. Business Logic Extraction Agent has already fixed the scope, validation meaning, pass condition, failure condition, metrics, and gating behavior. This agent does not reinterpret those decisions or reread the original description. It writes only the body of validate_business_rules().",
      },
      { type: "heading", text: "Generic PySpark Example" },
      {
        type: "code",
        text: 'non_null = df.filter(df["<COLUMN_A>"].isNotNull())\nunmatched = non_null.join(\n    lookup_df,\n    non_null["<COLUMN_A>"] == lookup_df["<COLUMN_B>"],\n    how="left_anti"\n)',
      },
      { type: "heading", text: "Minimum Necessary Context" },
      {
        type: "paragraph",
        text: "The agent receives only the two validated plans and the specific schema columns referenced by them. It cannot browse the full Knowledge Store. Restricting its context reduces opportunities to introduce unrelated tables, columns, or assumptions into the generated function.",
      },
      { type: "heading", text: "Why This Is The Hardest Step" },
      {
        type: "paragraph",
        text: "Converting a structured specification into correct PySpark requires genuine synthesis. Join type, null handling, scope filters, and metric computation must all preserve the locked intent. A subtle error may still produce runnable code while silently checking the wrong condition, so this role uses the strongest available model.",
      },
      { type: "heading", text: "Immediate Output Checks" },
      {
        type: "unordered",
        items: [
          "The generated function body must parse as valid Python.",
          "It must not contain forbidden patterns.",
          "Its implementation must match the validation approach fixed in the approved plan.",
        ],
      },
      {
        type: "paragraph",
        text: "A failed check is surfaced for review. The output is never silently patched or accepted without evidence.",
      },
      { type: "heading", text: "Why The Boundary Matters" },
      {
        type: "paragraph",
        text: "Interpretation belongs to the planning agents, while stable script structure belongs to deterministic template code. This agent performs only the task that requires deep model reasoning: translating an already-locked specification into working validation logic without making new architectural or reporting decisions.",
      },
    ],
  },
  E2: {
    title: "Deterministic Script Assembly",
    sub: "Repeatable, Zero-AI File Construction",
    blocks: [
      {
        type: "paragraph",
        text: "Deterministic Script Assembly places the AI-generated validation logic into the scaffold and produces one complete, runnable script. It uses no AI reasoning. Given the same scaffold and function body, it produces exactly the same file every time.",
      },
      { type: "heading", text: "Three Mechanical Operations" },
      {
        type: "ordered",
        items: [
          "Injection: locate the placeholder created by the Code Scaffold Builder, replace it with the generated function body, and normalize indentation to match the surrounding template.",
          "Import Fixing: inspect the generated logic for Python libraries it uses and add only the required imports that are not already present in the scaffold.",
          "Guardrail Check: verify that the safety guard in the finished main function matches the gating decision locked during Business Logic Extraction Agent.",
        ],
      },
      { type: "heading", text: "Why Import Fixing Is Necessary" },
      {
        type: "paragraph",
        text: "The scaffold includes imports for the common case, but individual validation rules may require additional capabilities such as a PySpark window function or JSON formatting. The assembler adds these dependencies mechanically without altering the validation intent.",
      },
      { type: "heading", text: "Guardrail Example" },
      {
        type: "paragraph",
        text: "If the approved plan says to skip the test when <REFERENCE_TABLE> is missing, the assembler confirms that this guard is present in the completed script. The protection must exist in executable code rather than only in planning metadata.",
      },
      { type: "heading", text: "Final Syntax Check" },
      {
        type: "paragraph",
        text: "After injection, import fixing, and guardrail verification, the assembler parses the entire file as Python. A successful parse produces the complete runnable script that enters the Critique review loop.",
      },
      { type: "heading", text: "Why No Model Is Involved" },
      {
        type: "paragraph",
        text: "Wrapping generated logic in the trusted script structure requires no judgment. Keeping this operation deterministic avoids unnecessary model cost and prevents structural variation between runs. Downstream reviewers and evaluators always receive the same predictable file shape for the same inputs.",
      },
    ],
  },
  BRIDGE: {
    title: "Contract Smoke Test",
    sub: "Report Shape Before Deep Review",
    blocks: [
      {
        type: "paragraph",
        text: "The Contract Smoke Test runs immediately after Deterministic Script Assembly and before the expensive Critique loop. It asks one question: does the script's output report match the exact structure required by every downstream consumer?",
      },
      { type: "heading", text: "What The Contract Means" },
      {
        type: "paragraph",
        text: "Every validation script must emit one agreed JSON structure. The dashboard, CI pipeline, and audit tools depend on its exact keys, nested fields, data types, and uppercase status values.",
      },
      {
        type: "code",
        text: '{\n  "test_case": { ... },\n  "execution": { ... },\n  "data": { ... },\n  "checks": { ... },\n  "summary": {\n    "status": "PASS | FAIL | SKIP"\n  }\n}',
      },
      { type: "heading", text: "Why Formatting Defects Are Dangerous" },
      {
        type: "paragraph",
        text: "A script can run successfully while emitting an unrecognized key or lowercase status. A consumer may then display zero results or the wrong status without surfacing an error. The smoke test catches this silent integration failure at its source.",
      },
      { type: "heading", text: "Two-Step Check" },
      {
        type: "ordered",
        items: [
          "Deterministic Scan: regex and code-structure checks detect lowercase statuses, misspelled keys, missing required fields, hardcoded statuses, and numeric fields stored as text.",
          "Targeted Repair: when a violation is found, one small AI call may modify only the reporting function. No validation logic or framework region is opened for change.",
        ],
      },
      { type: "heading", text: "Visible Failure Behavior" },
      {
        type: "paragraph",
        text: "If the targeted repair succeeds, the script proceeds to Critique. If it does not, the contract violation remains explicit so the review loop can address it. The system never hides or silently accepts the mismatch.",
      },
      { type: "heading", text: "Why It Is A Smoke Test" },
      {
        type: "paragraph",
        text: "This fast gate catches a fundamentally unusable report before multiple reviewers spend model calls assessing deeper logic. Critique therefore receives scripts whose output can already be consumed correctly and can focus its effort on semantic quality.",
      },
    ],
  },
  REV: {
    title: "Reviewer Agents",
    sub: "7 Specialized Inspectors · Diagnose Only",
    blocks: [
      {
        type: "paragraph",
        text: "Reviewer Agents are the specialized inspectors that examine the generated script for problems. They form the diagnosis stage of the quality loop and never modify the script.",
      },
      { type: "heading", text: "Why Seven Specialized Reviewers" },
      {
        type: "paragraph",
        text: "The system uses a panel instead of one general-purpose reviewer. Each reviewer owns one narrow concern, which makes findings more consistent, traceable, and actionable.",
      },
      { type: "heading", text: "Four Deterministic Code Checks" },
      {
        type: "ordered",
        items: [
          "Metric Consistency: verifies that metric names written by validation logic match the names read by the reporting function. A mismatch such as failure_count versus failed can silently hide results from the dashboard.",
          "Structural Hygiene: detects duplicate function definitions, dead imports, and conflicting code structure.",
          "Table Loading: confirms that every table type uses its required loading method so the script behaves correctly at runtime.",
          "Column Accuracy: checks every referenced column against the correct table schema, directly preventing column hallucination.",
        ],
      },
      { type: "heading", text: "Three AI Reviewers" },
      {
        type: "ordered",
        items: [
          "Description Nuance: reads the original validation description and verifies that every stated requirement, exception, and scope condition appears in the code.",
          "Semantic Logic: compares the implementation with the locked business logic plan, including join type, scope filters, null handling, pass conditions, and failure conditions.",
          "PySpark Efficiency: identifies performance traps that may work on small samples but fail at production scale, such as collecting an entire dataset onto the driver.",
        ],
      },
      { type: "heading", text: "Structured Issue Contract" },
      {
        type: "paragraph",
        text: "Reviewers never return vague free-text judgments. Every finding uses one shared structure so the Fix Planner can prioritize it and the Patch Generator can apply a precise change.",
      },
      {
        type: "code",
        text: '{\n  "id": "<ISSUE_ID>",\n  "severity": "<SEVERITY>",\n  "location": "<FUNCTION_OR_LINE>",\n  "fix_instruction": "<SCOPED_CHANGE>",\n  "acceptance_criterion": "<VERIFIABLE_RESULT>"\n}',
      },
      { type: "heading", text: "Diagnose, Never Edit" },
      {
        type: "paragraph",
        text: "A reviewer's responsibility ends after it identifies what is wrong, where it occurs, why it matters, and how completion will be verified. Keeping diagnosis separate from modification prevents an incorrect diagnosis from directly corrupting the script.",
      },
    ],
  },
  DEC: {
    title: "Issues Found?",
    sub: "Diagnosis chooses the next path",
    summary: "Issues move to repair planning. A clean review moves to independent nuance verification instead of immediately declaring success.",
  },
  FIX: {
    title: "Fix Planner Agent",
    sub: "Strategy Only · No Code Access",
    blocks: [
      {
        type: "paragraph",
        text: "The Fix Planner Agent decides what to fix, in what order, and what to leave alone. It sits between Reviewer Agents, which diagnose problems, and the Patch Generator, which changes code. Its responsibility is planning, not execution.",
      },
      { type: "heading", text: "Input And Output" },
      {
        type: "paragraph",
        text: "Its input is the combined set of structured issues produced by all seven reviewers. Its output is an ordered repair plan containing the specific actions that should be taken next.",
      },
      { type: "heading", text: "A Deliberate Access Boundary" },
      {
        type: "paragraph",
        text: "The agent never sees the script and never writes code. It reasons only from structured issue descriptions that explain what is wrong, where it occurs, and why it matters. Without code access, planning cannot accidentally introduce a syntax error or directly modify a protected framework region.",
      },
      { type: "heading", text: "Three Planning Jobs" },
      {
        type: "ordered",
        items: [
          "Filter: remove informational findings, unsafe recommendations, and issues targeting fixed framework regions that no agent may modify.",
          "Prioritize: place critical semantic failures first, especially errors that can run successfully while checking the wrong condition. Structural failures follow because they fail visibly and are detected quickly.",
          "Declare Dependencies: state which repairs must happen before others so the Patch Generator applies changes in a safe sequence.",
        ],
      },
      { type: "heading", text: "Why Dependencies Matter" },
      {
        type: "paragraph",
        text: "A wrong join must be corrected before that join is optimized. A location-sensitive fix may need to run before another change shifts the surrounding code. Making these relationships explicit prevents a valid repair from being applied to the wrong version or in the wrong order.",
      },
      { type: "heading", text: "Structured Repair Plan" },
      {
        type: "code",
        text: '{\n  "actions": [\n    {\n      "issue_id": "<ISSUE_ID>",\n      "target_function": "<FUNCTION_NAME>",\n      "priority": "<PRIORITY>",\n      "depends_on": ["<PRECEDING_ISSUE_ID>"],\n      "rationale": "<WHY_THIS_ACTION_IS_NEEDED>"\n    }\n  ]\n}',
      },
      { type: "heading", text: "Why Planning Is Separate From Patching" },
      {
        type: "paragraph",
        text: "Combining strategy and code writing would force one agent to choose among competing issues while modifying the script. Separating the roles lets planning resolve value, order, and dependencies once, while the Patch Generator performs one targeted change at a time without reopening those decisions.",
      },
    ],
  },
  PATCH: {
    title: "Patch Generator Agent",
    sub: "One Instruction · One Surgical Change",
    blocks: [
      {
        type: "paragraph",
        text: "The Patch Generator Agent is the component that changes code. It acts as the surgeon of the review loop, translating one approved fix instruction into one exact modification.",
      },
      { type: "heading", text: "Input And Output" },
      {
        type: "paragraph",
        text: "Its input is one action from the Fix Planner Agent's ordered repair plan. Its output is a search-and-replace pair that identifies the exact existing text and the exact replacement text.",
      },
      {
        type: "code",
        text: '{\n  "issue_id": "<ISSUE_ID>",\n  "target_function": "<FUNCTION_NAME>",\n  "search": "<EXACT_EXISTING_CODE>",\n  "replace": "<EXACT_REPLACEMENT_CODE>",\n  "confidence": "<SCORE>"\n}',
      },
      { type: "heading", text: "Why It Never Rewrites The Whole Script" },
      {
        type: "paragraph",
        text: "A small correction should not replace an otherwise correct full script. Regeneration can introduce unrelated defects and discard code that already passed review. Surgical patching changes only the affected lines while loading, reporting, orchestration, and other trusted regions remain untouched.",
      },
      { type: "heading", text: "Minimum Necessary Context" },
      {
        type: "paragraph",
        text: "The agent receives one fix instruction and only the function that instruction targets. It does not see the entire script. This narrow context keeps the change focused and limits its ability to affect unrelated behavior.",
      },
      { type: "heading", text: "Strict Role Boundaries" },
      {
        type: "unordered",
        items: [
          "It does not select which issue to fix. The Fix Planner Agent already made that decision.",
          "It does not determine whether the result is correct. Reviewer Agents assess the patched script in the next iteration.",
          "It converts one approved instruction into one minimal code change.",
        ],
      },
      { type: "heading", text: "Three Independent Safety Nets" },
      {
        type: "ordered",
        items: [
          "Confidence Threshold: discard a patch when its confidence falls below the configured threshold rather than applying an uncertain change.",
          "Regression Guard: compare the function before and after patching, rejecting syntax errors, missing returns, destructive body shrinkage, or a structural change too large to be surgical.",
          "Framework Immunity: reject every patch that targets a protected template-generated region, leaving that region unchanged.",
        ],
      },
      { type: "heading", text: "The Deliberate Trade-Off" },
      {
        type: "paragraph",
        text: "Minimal patching may be slower than replacing the entire script, but every change has a smaller blast radius and can be verified precisely. One input, one output, and three safety checks make constraint the agent's primary strength.",
      },
    ],
  },
  GUARD: {
    title: "Regression Guard",
    sub: "Deterministic Before-And-After Check",
    blocks: [
      {
        type: "paragraph",
        text: "The Regression Guard is the deterministic safety check that verifies a patch did not break the function while fixing an issue. It runs immediately after Patch Generator Agent changes the code and before the script returns to Reviewer Agents.",
      },
      { type: "heading", text: "Mechanical Structural Comparison" },
      {
        type: "paragraph",
        text: "Before patching, the guard parses the target function as Python and records its structure. After patching, it parses and records the structure again. It then compares the two representations to determine whether the patch changed more than its approved scope allowed.",
      },
      { type: "heading", text: "Three Damage Checks" },
      {
        type: "ordered",
        items: [
          "Essential Removal: reject a patch that removes required behavior such as a return statement.",
          "Destructive Shrinkage: reject a patch that removes an unexpectedly large portion of the function body.",
          "Syntax Regression: reject a patch that leaves the modified function as invalid Python.",
        ],
      },
      { type: "heading", text: "Framework Immunity" },
      {
        type: "paragraph",
        text: "Protected template-generated regions may never be changed by a patch. Any attempted modification to one of these regions is rejected without exception, regardless of how plausible the proposed change appears.",
      },
      { type: "heading", text: "Rejection And Escalation" },
      {
        type: "paragraph",
        text: "When a structural check fails, the patch is discarded and never reaches the reviewers. The affected function is flagged for broader regeneration instead of receiving further surgical patches for the same unresolved issue.",
      },
      { type: "heading", text: "Key Operating Properties" },
      {
        type: "unordered",
        items: [
          "Pure code with zero model calls.",
          "Runs in microseconds.",
          "Produces a definitive safe or reject decision.",
          "Operates independently from the Patch Generator Agent's confidence score.",
        ],
      },
      { type: "heading", text: "Why It Sits Before Re-Review" },
      {
        type: "paragraph",
        text: "A structurally unsafe patch would waste another complete review iteration. The guard prevents that rework by allowing only structurally safe changes to return to Reviewer Agents for semantic assessment.",
      },
    ],
  },
  NUANCE: {
    title: "Nuance Verifier Agent",
    sub: "Agent With Independent Requirement Memory",
    blocks: [
      {
        type: "paragraph",
        text: "The Nuance Verifier Agent independently checks that the system has not forgotten any requirement as the script moves through repeated review and repair iterations.",
      },
      { type: "heading", text: "The Failure It Prevents" },
      {
        type: "paragraph",
        text: "A reviewer may correctly flag a missing requirement, see it repaired, and then focus on different concerns in later iterations. Without an independent record, the earlier requirement could disappear from attention and the script could approach acceptance without anyone confirming it is still present.",
      },
      { type: "heading", text: "Runs Only After A Clean Review" },
      {
        type: "paragraph",
        text: "The agent does not run while Reviewer Agents are still reporting issues because those scripts already return to repair. It runs when the reviewer decision is clear, immediately before the script moves toward scoring and acceptance. This is the moment when a forgotten requirement could otherwise pass unnoticed.",
      },
      { type: "heading", text: "Independent Requirement Tracking" },
      {
        type: "paragraph",
        text: "Every concrete requirement is extracted from the original validation description and stored in a persistent list outside reviewer memory. On a clean review, the Nuance Verifier Agent checks the current script against that complete list from scratch, including scope filters, null handling, lookup usage, and other stated conditions.",
      },
      { type: "heading", text: "Nuance Status Output" },
      {
        type: "code",
        text: '{\n  "all_resolved": true,\n  "requirements": [\n    {\n      "id": "<REQUIREMENT_ID>",\n      "status": "SATISFIED | MISSING",\n      "evidence": "<CODE_LOCATION_OR_REASON>"\n    }\n  ]\n}',
      },
      { type: "heading", text: "Part Of A Three-Way Acceptance Gate" },
      {
        type: "paragraph",
        text: "The nuance status feeds the same exit decision as the composite quality score and the safety check. Acceptance requires the score threshold to clear, every tracked nuance to be resolved, and the safety gate to pass. No one condition can substitute for another.",
      },
      { type: "heading", text: "Why Verification Is Independent" },
      {
        type: "paragraph",
        text: "Reviewer attention can shift across iterations. A fixed requirement list cannot drift with that attention. Each verification starts from the full record and produces direct evidence that every requirement is either present in the current script or still missing.",
      },
    ],
  },
  QEVAL: {
    title: "Quality Evaluator",
    sub: "Deterministic Composite Score · 0.0 To 1.0",
    blocks: [
      {
        type: "paragraph",
        text: "The Quality Evaluator is the deterministic component that calculates whether the Critique loop is ready to stop or must continue. Its composite result feeds the adjacent Acceptance And Budget Gate, which applies the exit decision.",
      },
      { type: "heading", text: "What It Combines" },
      {
        type: "paragraph",
        text: "After each iteration, the evaluator combines reviewer findings, deterministic structural-check results, and the nuance status produced by Nuance Verifier Agent into one reproducible score from 0.0 to 1.0.",
      },
      { type: "heading", text: "Four Weighted Dimensions" },
      {
        type: "ordered",
        items: [
          "Semantic Correctness: does the code implement the intended business rule? This dimension carries the highest weight.",
          "Structural Quality: is the code syntactically valid, complete, and structurally sound?",
          "Contract Compliance: does the report match the exact output structure expected by downstream consumers?",
          "Code Hygiene: is the implementation reasonably efficient and free of known performance traps?",
        ],
      },
      { type: "heading", text: "Why Semantics Are Weighted Highest" },
      {
        type: "paragraph",
        text: "Incorrect business logic can run successfully and produce convincing output while checking the wrong condition. That silent failure is more dangerous than a minor hygiene issue that only affects efficiency, so the score reflects risk rather than simply counting findings.",
      },
      { type: "heading", text: "Three Possible Outcomes" },
      {
        type: "ordered",
        items: [
          "Accept: the score reaches 0.95, all tracked nuances are resolved, and the required safety conditions clear.",
          "Continue: the score remains below the threshold and iteration budget remains, so the script re-enters the review and repair cycle.",
          "Best Version: the budget is exhausted, so the loop returns the best-scoring version observed across all iterations rather than automatically returning the latest one.",
        ],
      },
      { type: "heading", text: "Why It Is Load-Bearing" },
      {
        type: "unordered",
        items: [
          "Pure code with no model call.",
          "Runs in microseconds after every iteration.",
          "Produces the same score for the same inputs every time.",
          "Prevents trust decisions from drifting between identical runs.",
        ],
      },
    ],
  },
  SCORE: {
    title: "Acceptance And Budget Gate",
    sub: "Quality Threshold · Cost Boundary",
    blocks: [
      {
        type: "paragraph",
        text: "The Acceptance And Budget Gate is the pair of deterministic controls that decides when the Critique loop stops. It prevents repeated review and repair from continuing indefinitely.",
      },
      { type: "heading", text: "Two Deliberate Limits" },
      {
        type: "paragraph",
        text: "The acceptance threshold limits quality risk. The iteration budget limits cost. Together they let the loop stop early when the script is ready while keeping the worst-case effort fixed and predictable.",
      },
      { type: "heading", text: "Acceptance Threshold" },
      {
        type: "paragraph",
        text: "The loop accepts a script early only when the composite quality score reaches 0.95 and every blocking requirement from the original validation description is verified as satisfied. A high score cannot compensate for one missing critical requirement.",
      },
      { type: "heading", text: "Five-Iteration Budget" },
      {
        type: "paragraph",
        text: "The loop may run at most five review iterations. If the acceptance threshold remains unmet when the budget ends, the system returns the best version observed across all iterations, measured by the fewest unresolved issues, rather than automatically returning the latest version.",
      },
      { type: "heading", text: "Honest Budget Exhaustion" },
      {
        type: "paragraph",
        text: "A budget-exhausted result receives partial status and a Gap Report that lists every unresolved issue and the inputs or actions needed next. The outcome remains usable without being presented as fully accepted.",
      },
      { type: "heading", text: "Independent Circuit Breakers" },
      {
        type: "paragraph",
        text: "Different failure classes maintain separate counters. Repeated parsing failures do not consume the same allowance as repeated review failures because each condition requires a different recovery path.",
      },
      { type: "heading", text: "Stall Detection" },
      {
        type: "paragraph",
        text: "If the quality score does not improve for two consecutive iterations, the loop stops attempting surgical patches and escalates the affected function to broader regeneration.",
      },
      { type: "heading", text: "Two Honest Outcomes" },
      {
        type: "ordered",
        items: [
          "Accepted: the script cleared the quality threshold and all blocking requirements are resolved.",
          "Partial: the bounded budget ended, so the best observed version is returned with an actionable Gap Report.",
        ],
      },
      {
        type: "paragraph",
        text: "An unbounded correction loop can turn one difficult test into an uncontrolled cost sink. This gate makes every test's maximum review cost known in advance and ensures every exit communicates its true quality state.",
      },
    ],
  },
  OUT: {
    title: "Valid PySpark Script",
    sub: "Runnable · Structurally Verified · Plan Aligned",
    blocks: [
      {
        type: "paragraph",
        text: "A Valid PySpark Script is the final output of the generation pipeline: a complete, runnable validation test that has passed every required check. It is not simply code written by an agent. It is a fully assembled Python file whose structure, logic, reporting contract, and source requirements have all been verified.",
      },
      { type: "heading", text: "Known Script Structure" },
      {
        type: "code",
        text: `# 1. Header and imports
import os
import json
from pyspark.sql import SparkSession, functions as F

# 2. Constants
TEST_ID = "<TEST_ID>"
TABLE_NAME = "<TARGET_TABLE>"

# 3. Fixed framework functions
def write_validation_report_json(report): ...
def safe_load_lookup(spark, path): ...

# 4. Table loading
def load_data(spark):
    target_df = spark.read.format("delta").load("<TARGET_PATH>")
    lookup_df = safe_load_lookup(spark, "<REFERENCE_PATH>")
    return target_df, lookup_df

# 5. The only AI-generated region
def validate_business_rules(spark, target_df, lookup_df):
    non_null = target_df.filter(
        target_df["<COLUMN_A>"].isNotNull()
    )
    unmatched = non_null.join(
        lookup_df,
        non_null["<COLUMN_A>"] == lookup_df["<COLUMN_B>"],
        how="left_anti"
    )
    metrics["failed"] = unmatched.count()
    return metrics

# 6. Fixed report and entry point
def generate_validation_report(metrics): ...
def main(): ...

if __name__ == "__main__":
    main()`,
      },
      { type: "heading", text: "Six Validity Conditions" },
      {
        type: "ordered",
        items: [
          { label: "Valid Python", text: "The complete file parses successfully through a mechanical syntax check." },
          { label: "Required Structure", text: "load_data, validate_business_rules, generate_validation_report, and main are present with the required signatures." },
          { label: "Plan Alignment", text: "The validation logic follows the locked plan, including the join type, row scope, and null handling." },
          { label: "Requirement Coverage", text: "Every requirement in the original Validation Description remains implemented and is independently verified." },
          { label: "Report Contract", text: "The JSON report contains the five required top-level keys, correct metric names, data types, and uppercase status values." },
          { label: "Quality Clearance", text: "The composite score reaches 0.95 with no blocking requirement unresolved. Otherwise, the script is returned as partial or needs review and never presented as valid." },
        ],
      },
      { type: "heading", text: "Why Valid Means More Than Runnable" },
      {
        type: "paragraph",
        text: "A script can execute successfully while silently checking the wrong condition. A Valid PySpark Script has been verified against its locked specification, protected framework structure, reporting contract, and every requirement from the original sentence. This distinction between code that runs and code that is verified correct is what the pipeline is designed to enforce.",
      },
    ],
  },
  REPO: {
    title: "Azure Databricks Repository",
    sub: "Versioned · Auditable · Client-Isolated",
    blocks: [
      {
        type: "paragraph",
        text: "The Azure Databricks Repository is where each Valid PySpark Script is published after clearing the Critique loop. It provides a controlled and traceable location from which the execution pipeline retrieves the exact approved script version.",
      },
      {
        type: "paragraph",
        text: "Scripts generated for different clients are stored in separate client-specific repository paths or namespaces. This prevents one client's validation scripts from being mixed with another client's artifacts and makes ownership, execution, and auditing easier to trace.",
      },
      { type: "heading", text: "What It Receives" },
      {
        type: "paragraph",
        text: "A complete Valid PySpark Script together with its test identifier, client identifier, and generation metadata.",
      },
      { type: "heading", text: "What It Provides" },
      {
        type: "unordered",
        items: [
          "A versioned copy of every validated script.",
          "Separate storage boundaries for each client.",
          "A stable execution path for the ADF Pipeline.",
          "Traceability from the generated test to the executed script.",
          "Protection against silently replacing an approved version.",
        ],
      },
      { type: "heading", text: "Responsibility Boundary" },
      {
        type: "paragraph",
        text: "The repository organizes, separates, and versions the generated scripts. It does not execute validations, inspect healthcare data, or determine whether a validation rule passes or fails.",
      },
    ],
  },
  ADF: {
    title: "ADF Pipeline Triggered",
    sub: "Orchestrate · Isolate · Track",
    blocks: [
      {
        type: "paragraph",
        text: "The ADF Pipeline coordinates execution after the Valid PySpark Script has been published. It identifies the script to run, submits the execution request to Databricks, and tracks the run until an outcome is available.",
      },
      { type: "heading", text: "What It Does" },
      {
        type: "unordered",
        items: [
          "Receives the published script reference and selected test identifiers.",
          "Supplies the target and required reference-table location paths so the validation script can load the correct data.",
          "Passes the required runtime parameters, environment configuration, and traceable run identifier.",
          "Triggers the corresponding Databricks execution.",
          "Tracks completion, validation failure, crash, retry, or non-execution.",
          "Preserves the execution status for reporting.",
        ],
      },
      { type: "heading", text: "Runtime Data Locations" },
      {
        type: "paragraph",
        text: "Table locations are supplied as runtime configuration rather than embedded into the generated validation logic. This lets the same validated script structure load the correct client and environment-specific tables without changing the rule it implements.",
      },
      { type: "heading", text: "Why It Is Separate" },
      {
        type: "paragraph",
        text: "ADF manages when, where, and how the script runs. It does not interpret the validation rule, modify the generated code, or decide whether the evaluated data passes the rule. If execution never begins, the test is classified as Not Run rather than Crash.",
      },
    ],
  },
  RUN: {
    title: "Databricks Runtime",
    sub: "Production-Scale Validation Execution",
    blocks: [
      {
        type: "paragraph",
        text: "The Databricks Runtime is the environment where the finished validation script actually runs against real, production-scale healthcare data rather than sample data or test fixtures. This is the first point in the pipeline where the generated script is tested under real execution conditions.",
      },
      { type: "heading", text: "Why This Is The First Real Execution" },
      {
        type: "paragraph",
        text: "Table Resolution, Business Logic Extraction, code generation, and the Critique loop work with the script statically. They read it, reason about it, and check its logic and structure without executing it against production data. The Databricks Runtime is where those earlier decisions meet the real tables and runtime environment.",
      },
      { type: "heading", text: "What Happens Here" },
      {
        type: "ordered",
        items: [
          "Load the target and required reference tables from the locations supplied by the ADF Pipeline.",
          "Execute the PySpark validation logic against the loaded data.",
          "Calculate the reporting metrics defined by the script's contract.",
          "Write the final validation report and preserve its connection to the repository version and ADF run identifier.",
        ],
      },
      { type: "heading", text: "Four Possible Outcomes" },
      {
        type: "unordered",
        items: [
          { label: "Pass", text: "the script ran to completion and the evaluated data satisfied the validation rule." },
          { label: "Validation Fail", text: "the script ran to completion and the evaluated data violated the rule. This is a genuine data-quality finding, not a script malfunction." },
          { label: "Crash", text: "the script or runtime environment failed before producing a valid result. This indicates an execution problem rather than a data-quality result." },
          { label: "Not Run", text: "execution was skipped because a required runtime dependency was unavailable. This is a skip, not a judgment about the script's correctness." },
        ],
      },
      { type: "heading", text: "Responsibility Boundary" },
      {
        type: "paragraph",
        text: "The runtime reports what happened accurately and does nothing more. It does not repair a broken script, reinterpret the validation requirement, or convert an unsuccessful execution into a passing result. A Crash remains a Crash in the report and is never silently counted as Pass or omitted.",
      },
    ],
  },
  PASS: {
    title: "Pass",
    sub: "Script Ran · Data Satisfied The Rule",
    summary: "The pipeline completed and the validation result met the rule's passing condition.",
  },
  VFAIL: {
    title: "Validation Fail",
    sub: "Script Ran · Data Broke The Rule",
    summary: "The pipeline worked, but the evaluated data violated the validation rule. This is a data-quality finding, not automatically an agent or script failure.",
  },
  CRASH: {
    title: "Crash",
    sub: "The Script Or Runtime Broke",
    summary: "Execution began but did not complete because of generated code, runtime, configuration, access, or dependency failure.",
  },
  NOTRUN: {
    title: "Not Run",
    sub: "Skipped Before Execution",
    summary: "The test did not reach Databricks execution because publication, orchestration, or a required runtime dependency was unavailable.",
  },
  RATE: {
    title: "Execution Results Dashboard",
    sub: "Pass 86% · Acceptance Threshold > 80%",
    comparison: [
      { label: "Acceptance Threshold", value: 80, display: "> 80%" },
      { label: "Achieved Pass Rate", value: 86, display: "86%" },
    ],
    blocks: [
      {
        type: "paragraph",
        text: "The dashboard shows the percentage of evaluated scripts in each mutually exclusive outcome: Pass, Validation Fail, Crash, and Did Not Run.",
      },
      { type: "heading", text: "Dashboard Calculations" },
      {
        type: "code",
        text: "pass_rate = passed / total_scripts\nvalidation_fail_rate = validation_failed / total_scripts\ncrash_rate = crashed / total_scripts\ndid_not_run_rate = did_not_run / total_scripts",
      },
      { type: "heading", text: "Acceptance Result" },
      {
        type: "paragraph",
        text: "The acceptance requirement was a pass rate greater than 80%. The Multi-Agent System achieved 86%, clearing the threshold by 6 percentage points and receiving sign-off.",
      },
      { type: "heading", text: "No Ground-Truth Classification Metrics" },
      {
        type: "paragraph",
        text: "Precision, recall, and F1 are not reported because there is no labeled ground-truth set. The remaining 14% is divided among Validation Fail, Crash, and Did Not Run using the observed dashboard counts rather than invented percentages.",
      },
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
    ),
    data.phase === "critique"
      ? h(
          "div",
          { className: "hld-critique-lanes", "aria-hidden": "true" },
          h("span", null, "Review & repair"),
          h("span", null, "Decide & protect"),
          h("span", null, "Verify & exit"),
          h("i", { className: "hld-critique-divider hld-critique-divider--one" }),
          h("i", { className: "hld-critique-divider hld-critique-divider--two" })
        )
      : data.phase === "post"
        ? h(
            "div",
            { className: "hld-post-lanes", "aria-hidden": "true" },
            h("span", null, "Publish & Run"),
            h("span", null, "Outcomes"),
            h("span", null, "Measure"),
            h("i", { className: "hld-post-divider hld-post-divider--one" }),
            h("i", { className: "hld-post-divider hld-post-divider--two" })
          )
        : null
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
    flowEdge("req-retr", "REQ", "RETR"),
    flowEdge("docs-ing", "DOCS", "ING", { kind: "evidence" }),
    flowEdge("etl-ing", "ETLSRC", "ING", { kind: "evidence" }),
    flowEdge("ing-store", "ING", "STORE", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("store-retr", "STORE", "RETR", { kind: "evidence" }),
    flowEdge("retr-ctx", "RETR", "CTX", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("ctx-p1", "CTX", "P1"),
    flowEdge("p1-p2", "P1", "P2", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("p2-gate", "P2", "GATE", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("gate-gap", "GATE", "GAP", { sourceHandle: "bottom", targetHandle: "top", kind: "blocked", label: "blocked" }),
    flowEdge("gate-sc", "GATE", "SC", { label: "ready / assistable", zIndex: 4 }),
    flowEdge("sc-e1", "SC", "E1", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("e1-e2", "E1", "E2", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("e2-bridge", "E2", "BRIDGE", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("bridge-rev", "BRIDGE", "REV"),
    flowEdge("rev-dec", "REV", "DEC"),
    flowEdge("dec-fix", "DEC", "FIX", { sourceHandle: "bottom", targetHandle: "top", label: "issues found" }),
    flowEdge("fix-patch", "FIX", "PATCH", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("patch-guard", "PATCH", "GUARD"),
    flowEdge("guard-rev", "GUARD", "REV", {
      sourceHandle: "bottom",
      targetHandle: "left",
      type: "outerLoop",
      kind: "loop",
      label: "re-review",
      data: { viaX: 1918, viaY: 830 },
    }),
    flowEdge("dec-nuance", "DEC", "NUANCE", { label: "clear" }),
    flowEdge("nuance-qeval", "NUANCE", "QEVAL", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("qeval-score", "QEVAL", "SCORE", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("score-rev", "SCORE", "REV", {
      sourceHandle: "bottom",
      targetHandle: "left",
      type: "outerLoop",
      kind: "loop",
      label: "budget remains",
      data: { viaX: 1904, viaY: 900 },
    }),
    flowEdge("score-out", "SCORE", "OUT", { label: "validated" }),
    flowEdge("out-repo", "OUT", "REPO", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("repo-adf", "REPO", "ADF", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("adf-run", "ADF", "RUN", { sourceHandle: "bottom", targetHandle: "top" }),
    flowEdge("run-pass", "RUN", "PASS"),
    flowEdge("run-vfail", "RUN", "VFAIL"),
    flowEdge("run-crash", "RUN", "CRASH"),
    flowEdge("run-notrun", "RUN", "NOTRUN"),
    flowEdge("pass-rate", "PASS", "RATE"),
    flowEdge("vfail-rate", "VFAIL", "RATE"),
    flowEdge("crash-rate", "CRASH", "RATE"),
    flowEdge("notrun-rate", "NOTRUN", "RATE"),
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
