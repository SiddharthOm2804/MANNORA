# Multi-Agent System

Citizens are simulation entities whose local needs, resources, goals, jobs, relationships, health, and memory contribute to aggregate world behavior. Core implementation is in `simulation/src/agents/` and `simulation/src/society/`.

## Per-tick flow

The engine's agent subsystem runs after events and before economy/government/resource/population systems. Agent engines evaluate internal needs and current world context, choose actions with rule-based utility and seeded randomness, and update agent state. Social/community systems update relationships and group behavior. Later subsystems process economic and civic consequences, then metrics summarize the resulting state.

This rule-based hot path keeps the simulation bounded and avoids network latency in each citizen's decision cycle. AI cognitive classes in `ai/` support reflection, planning, and memory tasks through explicit API operations; they are not a substitute for the simulation agent rules.

## State and persistence

The engine owns the live in-memory agent state. The bridge queues selected fields for batched MongoDB upserts. Queue writes are coalesced by world and agent ID; transient database failures retain a bounded/latest state for a later retry while the process remains alive. There is no durable journal for queued data, and persisted agent fields are not currently sufficient to rebuild every engine subsystem exactly.

## Scale and visualization

Cost grows with the active population and relationship/market work. Use bounded populations, benchmark tick latency and memory, and inspect subsystem timings before increasing scale. The frontend draws citizen markers as an instanced mesh with a 1,500-instance display cap; rendering the markers does not mean every simulated agent is individually represented on screen.

## Evaluation cautions

Agent rules encode assumptions and should be calibrated before making empirical claims. Assess outcomes across multiple seeds, inspect subgroup differences, and record model version and parameters. Aggregate satisfaction or wellbeing indices are model outputs, not validated measures of real people.

Related documentation: [Simulation engine](simulation-engine.md), [AI system](ai-system.md), [Architecture](architecture.md).
