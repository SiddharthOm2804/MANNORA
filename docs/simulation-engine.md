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
