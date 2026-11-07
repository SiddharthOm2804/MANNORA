# City Simulation Engine Specification

> **MANNORA — Core Deterministic Simulation Engine**  
> **Package:** `@neural-city/simulation` *(Project: MANNORA)*

---

## 1. How the Engine Works

The MANNORA simulation engine is the core brain of the virtual city. It updates the entire city step by step without relying on real-world system clocks or external network services.

Every step (tick) represents one discrete time unit (such as a simulated day or hour).

### Core Engine Modules:

1. **`SimulationEngine` (City Simulation Manager)**:
   - Starts, pauses, resumes, and stops the city.
   - Runs each simulation step: advances the clock, updates people's choices, calculates factory profits, and saves the new city state.
   - Supports `rollback(day)` to rewind time to an earlier day.

2. **`WorldState` (City Condition at Current Day)**:
   - Contains all the actual data of the city at day $t$:
     - Current day number (`tick`)
     - City metrics: total population, energy, water, money in city bank, citizen happiness
     - All citizens and their positions, jobs, and health
     - Resource reserves (food, water, electricity, materials)

3. **`SimulationClock` (Simulation Clock)**:
   - Controls how fast the city runs (for example: 10 steps per second).
   - Speed can be changed from normal (1.0x) to fast (5.0x or 10.0x) without affecting the math or correctness.

4. **`StateManager` (Saved Snapshots Manager)**:
   - Stores exact copies of previous days in memory.
   - When you rewind to Day 50, `StateManager` restores the exact state of every citizen and bank balance from that day.

5. **`RandomEngine` (Deterministic Random Number Generator)**:
   - Uses the Mulberry32 algorithm.
   - Given the same starting seed (e.g. `83917492`), every decision and event happens in the exact same sequence every time.

---

## 2. City Economy Systems

The economy runs automatically during every simulation step:

1. **`EconomyEngine` (City Economy Coordinator)**:
   - Calculates total goods produced (GDP), average citizen salaries, and overall unemployment.
   - Monitors business health and bankruptcy.

2. **`MarketEngine` (Supply and Demand Market)**:
   - Dynamically calculates the price of food, electricity, water, minerals, and technology.
   - When drinking water is scarce, prices automatically rise according to economic formulas.
   - When supplies are plentiful, prices drop back to normal.

3. **`JobSystem` (Jobs and Hiring System)**:
   - Connects unemployed citizens with vacant factory and office jobs based on skills and location.
   - Calculates daily wages paid by businesses to workers.

4. **`FinanceSystem` (City Banking and Taxes)**:
   - Collects income tax from workers to fund the city government.
   - Pays interest on citizen savings and tracks business profits.

---

## 3. Event Engine (Phase 11)

The Event Engine manages city emergencies:
- Events include: water shortage, power grid failure, economic downturn, or disease outbreak.
- When an event occurs, it does not just show a UI message; it directly alters simulation variables (e.g., cutting water reserves by 50%).
- The rest of the engine naturally responds: prices rise, public health drops, and citizens adjust their daily spending.

---

## 4. Time Machine & Branching (Phase 12)

- **`BranchEngine`**: Creates an alternate timeline from any historical snapshot.
- **`CounterfactualEngine`**: Compares the original city with the branched city to see which policies performed better over time.
