# Simulation Engine Specification

**NEURAL CITY — Core Deterministic Civilization Engine**  
**Package:** `@neural-city/simulation`

---

## 1. Core Modules

The engine comprises five foundational primitives:

### `SimulationEngine`
The orchestrator managing engine lifecycle, continuous execution, tick steps, and subsystem dispatch.
- **`init(worldConfig)`**: Initializes initial state and resets clock.
- **`step()`**: Executes a single discrete tick:
  1. Advances `SimulationClock`.
  2. Clones previous state for mutation.
  3. Dispatches registered subsystems in priority order.
  4. Commits new state to `StateManager`.
  5. Emits `tick` event.
- **`start()` / `pause()` / `resume()` / `stop()` / `reset()`: Clock lifecycle controls.
- **`rollback(tick)`**: Rewinds world state to an earlier historical checkpoint.

### `WorldState`
The canonical data container for civilization state at tick `t`.
- **`tick`**: Current tick integer.
- **`dimensions`**: Grid size `{ width, height }`.
- **`metrics`**: Global indicators (population, energy, treasury, happiness, health).
- **`entities`**: Map of entity ID to entity payload.
- **`metadata`**: World parameters, seed, timestamps.
- **`clone()` & `serialize()` / `deserialize()`**: Fast cloning for immutable history.

### `SimulationClock`
Discrete timing mechanism decoupled from system wall clock.
- **`tickRate`**: Ticks per second (TPS). Default: 10 Hz.
- **`timeScale`**: Speed multiplier (1.0x, 2.0x, etc.).
- **`fixedDelta`**: `1 / tickRate`.

### `StateManager`
Snapshotting and history ring-buffer manager.
- Retains up to `maxHistory` checkpoints.
- Supports historical retrieval and state rollback.

### `RandomEngine`
32-bit Mulberry32 PRNG ensuring deterministic behavior across environments.
- Methods: `nextFloat()`, `nextInt(min, max)`, `nextBool(prob)`, `choice(arr)`, `shuffle(arr)`, `sample(arr, n)`, `gaussian(mean, stdDev)`.

---

## 2. Phase 6 Civilization Economy Subsystems

The civilization economy executes at **Priority 30** in the deterministic simulation pipeline:

### `EconomyEngine`
Central coordinator managing macro production, labor demand, tax revenues, commodity inflation, and model-grounded GDP.
- Evaluates dynamic commodity pricing from `MarketEngine`.
- Balances commercial & industrial business operations (revenue, wages, maintenance, net profit).
- Computes simulation-grounded metrics: GDP, unemployment rate, average citizen wealth, average income, inflation rate, and resource availability score.

### `MarketEngine`
Models supply, demand, and dynamic price discovery across six resource commodities (`energy`, `minerals`, `water`, `agriculture`, `technology`, `rawMaterials`).
- Adjusts prices in response to buffer depletion (shortage) or accumulation (surplus).
- Incorporates commodity-specific price elasticity curves (inelastic necessities vs elastic technology goods).

### `JobSystem`
Maintains the civilization labor market and occupational mobility:
- Matches unemployed or underemployed citizens with building vacancies based on skill affinity and proximity.
- Calculates tailored salaries based on occupational benchmarks, skills, and productivity traits.
- Tracks labor supply vs. employer demand and municipal unemployment rates.

### `FinanceSystem`
Executes fiscal accounting for government and commercial institutions:
- Municipal taxation on worker income and commercial enterprise profits.
- Accrues yield on citizen liquid savings to model capital retention.
- Evaluates municipal fiscal solvency and business net profit margins.
