# AutoLing Organism v3.1 -- Fixed + Planner Layer
# Critical fixes: route_to_hexagram, dimensional transforms, capability routing, planner

"""
CHANGES FROM v3.0 TO v3.1:

1. FIXED: KeywordEmbedder.route_to_hexagram() now exists
   - Routes embeddings to hexagrams using semantic similarity
   - Uses DIMENSION_HEXAGRAMS mapping

2. FIXED: Dimensional actors now perform actual transformations
   - Actor._transform_content() implements all 6 dimensions:
     * semantic: extracts concepts, word counts, confidence
     * relational: finds connections, relationship types
     * operational: sequences steps, parallelization flags
     * visual: scaffolds geometry, render params
     * temporal: creates timeline with phase statuses
     * metaphysical: encodes I Ching, gene keys, line themes

3. FIXED: Capability-based worker routing instead of default-to-code
   - Planner._select_worker() inspects content for markers:
     * HTML tags -> html worker
     * Python def/class -> code worker
     * JavaScript function/=> -> html worker (JS)
     * Player/Level -> game worker
     * Dialogue format -> conversation worker

4. NEW: Planner layer
   - Maintains task graph with dependencies
   - plan_from_file(): generates classify -> pipeline -> worker -> graph tasks
   - plan_repair(): schedules repair tasks for broken nodes
   - plan_merge(): schedules deduplication tasks
   - plan_build(): schedules build tasks with validation
   - execute_plan(): respects dependencies, tracks completion/failure
   - set_goal(): high-level goal setting

5. Architecture changes:
   - Orchestrator now initializes Planner after workers
   - ingest_file() uses planner for task generation + execution
   - repair/merge/build cycles use planner for task scheduling
   - Planner status exposed in cycle results

NEXT STEPS FOR v4.0:
  - Dependency resolver (import graph traversal)
  - Plugin system (dynamic worker loading)
  - Live filesystem watching (inotify/fsevents instead of polling)
  - AST rewriting (not just repair)
  - Execution sandbox (safe code execution)
  - Model/tool selection (choose embedder based on task)
  - Memory prioritization (evict low-value nodes)
  - Conflict resolution (merge strategies beyond keep-both)
  - Scheduler (priority queue with deadlines)
  - Self-modification approval (gate changes to system code)
  - Versioning (track graph evolution)
  - Rollback (revert to previous states)
"""
