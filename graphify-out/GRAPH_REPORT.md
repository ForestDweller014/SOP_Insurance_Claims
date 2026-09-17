# Graph Report - SOP_Insurance_Claims  (2026-09-17)

## Corpus Check
- 35 files · ~53,594 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 358 nodes · 333 edges · 76 communities (18 shown, 58 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b67df389`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Graph Maintenance
- Architecture and Commits
- CI and Debugging
- Graph Query Tools
- Semantic Extraction
- Bounded Feature Design
- Graph Analysis
- claims-workflow.ts
- devDependencies
- Continuous Integration Engineering
- compilerOptions
- What You Must Do When Invoked
- package.json
- Investigation and Debugging
- Large-Feature Decomposition
- Minimal-Context Coding
- Architecture-First Changes
- include
- graphify reference: extra exports and benchmark
- Atomic Git Commit Workflow
- graphify reference: query, path, explain
- layout.tsx
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- next-env.d.ts
- vite.config.ts
- extraction-spec.md
- Change Contract
- Conventional Commit Messages
- Graphify Locality Guard
- Executable Integration Contract
- Least-Privilege CI
- Reproducible CI
- Evidence-Driven Debugging
- Minimal Durable Fix
- Ranked Hypotheses
- Context Packet
- Dependency-Ordered Milestones
- Vertical Slices
- Bounded Working Set
- Compact Working Summary
- Evidence-Based Context Expansion
- URL Ingestion
- Graphify MCP Server
- Deterministic Node IDs
- Semantic Extraction Specification
- Cross-Repository Graph Merge
- GitHub Repository Clone
- Native CLAUDE.md Integration
- Post-Commit Graph Hook
- Breadth-First Traversal
- Constrained Query Expansion
- Depth-First Traversal
- Graphify Query
- Saved Result Feedback Loop
- Media Transcription
- Whisper Domain Prompt
- Deleted Source Pruning
- Incremental Graph Update
- Replace on Re-Extract
- Graph Build and Analysis
- Graph Health Check
- Graphify
- Graphify Pipeline
- Graphify Honesty Rules
- Semantic Extraction Cache
- Semantic Extraction
- Structural AST Extraction
- Graphify Repository Policy
- Scoped Graph Navigation

## God Nodes (most connected - your core abstractions)
1. `Continuous Integration Engineering` - 23 edges
2. `compilerOptions` - 18 edges
3. `Investigation and Debugging` - 13 edges
4. `processMessage()` - 12 edges
5. `Large-Feature Decomposition` - 12 edges
6. `Minimal-Context Coding` - 12 edges
7. `What You Must Do When Invoked` - 12 edges
8. `Architecture-First Changes` - 10 edges
9. `/graphify` - 10 edges
10. `captureMessageMemory()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --indirect_call--> `createInitialState()`  [INFERRED]
  apps/insurance_claims/demo/app/page.tsx → apps/insurance_claims/demo/lib/claims-workflow.ts
- `turn()` --calls--> `processMessage()`  [EXTRACTED]
  apps/insurance_claims/demo/lib/claims-workflow.test.ts → apps/insurance_claims/demo/lib/claims-workflow.ts
- `Home()` --calls--> `getSafeMemorySummary()`  [EXTRACTED]
  apps/insurance_claims/demo/app/page.tsx → apps/insurance_claims/demo/lib/claims-workflow.ts
- `Home()` --calls--> `getSelectedClaim()`  [EXTRACTED]
  apps/insurance_claims/demo/app/page.tsx → apps/insurance_claims/demo/lib/claims-workflow.ts
- `Home()` --references--> `PHASES`  [EXTRACTED]
  apps/insurance_claims/demo/app/page.tsx → apps/insurance_claims/demo/lib/claims-workflow.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Semantic Extraction Flow** — _codex_skills_graphify_skill_semantic_extraction, _codex_skills_graphify_skill_semantic_cache, _codex_skills_graphify_references_extraction_spec_semantic_extraction_specification, _codex_skills_graphify_references_extraction_spec_confidence_rubric, _codex_skills_graphify_references_extraction_spec_deterministic_node_ids, _codex_skills_graphify_skill_graph_build_and_analysis [EXTRACTED 1.00]

## Communities (76 total, 58 thin omitted)

### Community 7 - "claims-workflow.ts"
Cohesion: 0.07
Nodes (51): ChatMessage, claims, FIELD_LABELS, Home(), openingMessage, PHASE_COPY, policyholders, workflowData (+43 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (35): devDependencies, @cloudflare/vite-plugin, @cloudflare/workers-types, eslint, eslint-config-next, @openai/sites-vite-plugin, react-server-dom-webpack, tailwindcss (+27 more)

### Community 9 - "Continuous Integration Engineering"
Cohesion: 0.06
Nodes (30): Build and artifact handling, Caching, Change-aware execution, Completion report, Concurrency and cancellation, Continuous Integration Engineering, Coverage, Database and contract safety (+22 more)

### Community 10 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+17 more)

### Community 11 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 12 - "package.json"
Cohesion: 0.10
Nodes (20): dependencies, next, react, react-dom, engines, node, name, private (+12 more)

### Community 13 - "Investigation and Debugging"
Cohesion: 0.14
Nodes (13): 10. Failure handling, 11. Completion report, 1. Define the failure precisely, 2. Reproduce before modifying, 3. Orient to the failing path, 4. Form ranked hypotheses, 5. Test one variable at a time, 6. Identify the root cause (+5 more)

### Community 14 - "Large-Feature Decomposition"
Cohesion: 0.15
Nodes (12): 10. Decomposition output format, 1. Frame the feature, 2. Map the affected system, 3. Identify workstreams and dependencies, 4. Prefer vertical slices, 5. Define each chunk, 6. Sequence for risk reduction, 7. Create a context packet per chunk (+4 more)

### Community 15 - "Minimal-Context Coding"
Cohesion: 0.15
Nodes (12): 10. Completion report, 1. Establish the task boundary, 2. Orient before reading files, 3. Build a bounded working set, 4. Expand only through evidence, 5. Read surgically, 6. Maintain a compact working summary, 7. Use bounded investigations (+4 more)

### Community 16 - "Architecture-First Changes"
Cohesion: 0.18
Nodes (10): 1. Orient to the existing system, 2. Establish constraints and invariants, 3. Choose the smallest coherent design, 4. Define the change contract, 5. Plan an implementation sequence, 6. Implement within the design, 7. Validate at multiple levels, 8. Completion report (+2 more)

### Community 17 - "include"
Cohesion: 0.20
Nodes (9): exclude, include, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+1 more)

### Community 18 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 19 - "Atomic Git Commit Workflow"
Cohesion: 0.33
Nodes (5): Atomic Git Commit Workflow, Commit messages, Commit strategy, Graphify locality guard, Scope

### Community 20 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 21 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 22 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 23 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 24 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **225 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `claims`, `policyholders` (+220 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **58 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `compilerOptions` to `include`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _251 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `claims-workflow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07127882599580712 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Continuous Integration Engineering` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._