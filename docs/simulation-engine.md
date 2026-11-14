# Simulation Engine

Package: `@neural-city/simulation` (`simulation/`)

## Tick lifecycle

`SimulationEngine` creates a seeded `RandomEngine`, `SimulationClock`, `StateManager`, and default subsystem pipeline. A tick advances the clock, clones the committed `WorldState`, runs registered systems by ascending priority, commits the resulting state into bounded in-memory history, then emits time and tick events.

Default priorities are events (10), agents (20), economy (30), government (35), resources (40), population (50), buildings (55), and metrics (60). A failing system emits an error event and the engine continues to commit the tick; callers should subscribe to `error`/`systemError` and alert on failures because the resulting tick may be partially updated.

## Determinism

The seeded random engine makes random choices repeatable when the same initial state, seed, code version, and action sequence are used. It does not make external LLM outputs, wall-clock scheduling, asynchronous persistence, or behavior across changed code versions deterministic. LLM calls are not part of the standard tick path. Record code revision, seed, configuration, interventions, and run length for an experiment.

## Clock and execution

The clock supports explicit `step()` as well as interval-driven start/pause/resume/stop. Tick rate and time scale are configurable. For controlled experiments, prefer explicit stepping to avoid host scheduling affecting wall-clock timing. One tick represents the configured simulation time unit; day/hour boundaries use `ticksPerHour` and `hoursPerDay`.

## State history, snapshots, and recovery

`StateManager` keeps a bounded in-memory history for rollback. `TimeMachine` composes snapshot, branch, and counterfactual helpers over the active engine. These histories are process-local. The server persistence worker stores periodic summary records in `SimulationSnapshot`; these summaries are useful for analytics but are not complete engine checkpoints. Active simulations are not automatically restored exactly after a server restart. Explicit checkpointing writes an adapted subset of current state to the world record.

## Counterfactuals and branches

Branches and comparisons provide controlled in-memory paths from captured simulation state. They are intended for model exploration. Verify that intervention semantics, baseline configuration, random seed treatment, sample size, and measured outcomes fit the research question. Do not infer causal effects from one unreplicated run.

## Experiments

`ExperimentRunner`, `ExperimentLab`, and statistical analysis helpers execute scenario runs and aggregate outputs. Experiment registry/history currently resides in the bridge process; persist externally if results must survive restarts. For publishable work, define outcomes and exclusions in advance, use multiple seeds, report uncertainty and sensitivity, and retain exact source/configuration metadata.

## Performance and failure handling

Per-tick work scales with the populations and data structures touched by systems. Avoid network calls and database round trips in subsystem updates. State cloning/history add memory overhead; configure bounded history intentionally. System exceptions are surfaced while the scheduler continues; monitor those events to avoid silently interpreting partial state. The server's persistence queue retries failed writes in memory but is neither durable nor distributed.

See [architecture.md](architecture.md) for server data flow and [agent-system.md](agent-system.md) for the agent tick path.
