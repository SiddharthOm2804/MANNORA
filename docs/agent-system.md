# Multi-Agent Civilization Framework

**NEURAL CITY — Agent System Design (Phase 5)**

---

## 1. Overview & Architecture

Phase 5 implements the **Multi-Agent Citizen System**, establishing autonomous, homeostatic, and goal-directed citizens within NEURAL CITY.
The core decision loop operates **strictly on deterministic rules and utility evaluations without LLM calls in the per-tick hot path**.

```
World Observation
       ↓
Needs Evaluation (NeedsSystem: hunger, rest, social, safety, fulfillment, health)
       ↓
Goal Evaluation (GoalSystem: survival, economic, social, growth)
       ↓
Action Selection (DecisionEngine: rule-based, purposeful travel, no random wandering)
       ↓
World State Mutation (Action execution affects agent, buildings, municipal treasury)
       ↓
Memory Encoding (MemorySystem: short-term working memory + episodic consolidation)
```

---

## 2. Core Components

### `Agent`
Encapsulates complete individual state:
- **Identity**: Unique ID (`id`), name, age
- **Economic Profile**: Occupation, income, liquid wealth, savings, skills matrix (`farming`, `engineering`, `commerce`, `science`, `administration`, `craftsmanship`)
- **Homeostasis**: `NeedsSystem` (hunger, rest, social, safety, fulfillment, health)
- **Cognition**: `GoalSystem`, `DecisionEngine`, `MemorySystem`
- **Physical & Spatial Presence**: Location coordinates `(x, y)`, sector, residence ID, workplace/employer ID
- **Social Graph**: Relationships map (`Map<agentId, RelationshipRecord>`) tracking affinity, trust, interaction counts, and last contact
- **Personality Traits**: Five-factor inspired traits [0.0, 1.0] (`rationality`, `ambition`, `riskTolerance`, `socialAffinity`, `productivity`, `frugality`, `adaptability`)
- **Health State**: Vitality index, energy, happiness, stress, sick status, active status

### `AgentEngine`
Coordinates the citizen population within `SimulationEngine`:
- Deterministic iteration order sorted by agent ID
- Population generation (`populateWorld`) and hydration
- Spatial proximity indexing (`getNearbyAgents(x, y, radius)`)
- Aggregation of socioeconomic telemetry (unemployment rate, average health, average happiness, wealth velocity) back into `WorldState` metrics

### `NeedsSystem`
Models homeostatic biological and psychological drives:
- Differentiated decay during wakefulness vs sleep
- Critical urgency thresholds (starvation >= 75, exhaustion <= 20)
- Need satisfaction dynamics and health penalties

### `GoalSystem`
Maintains hierarchical priorities:
- **Survival Override**: Emergency food acquisition or rest when drives enter critical zones
- **Economic Goals**: Work shifts, job seeking, saving capital, starting businesses
- **Social Goals**: Interacting with companions, community engagement
- **Growth Goals**: Skill improvement, leisure, quality-of-life enhancements

### `DecisionEngine`
Rule-based action selector evaluating state, goals, environment, and traits:
- **`work`**: Earns wage, pays municipal taxes to treasury, expends energy/rest
- **`eat`**: Consumes inventory food or visits commercial market
- **`sleep`**: Recovers rest and energy at domicile
- **`travel`**: Purposeful vector-based traversal towards target venues (strictly prevents random movement)
- **`shop`**: Purchases supplies from markets, injecting economic velocity
- **`search_job`**: Interviews with commercial/industrial buildings having worker vacancies
- **`start_business`**: Founds a new commercial exchange building on available municipal lots
- **`interact`**: Deepens bidirectional affinity and trust with nearby citizens
- **`save_money`**: Allocates liquid wealth into security reserves based on frugality
- **`spend_money`**: Reinvestment in cultural/recreational fulfillment
- **`rest`**: Domicile relaxation

### `MemorySystem`
Tiered cognitive store:
- **Working Memory**: Fixed-capacity ring buffer of recent sensory observations and actions
- **Episodic Memory**: Long-term consolidation of high-importance experiences (threshold >= 0.60, milestones, trauma)
- Querying by related agent ID, event type, and temporal recency

---

## 3. Subsystem Integration

`AgentSystem` registers at **Priority 20** in the deterministic `SimulationEngine` pipeline:
`CLOCK (0) → EVENTS (10) → AGENTS (20) → ECONOMY (30) → RESOURCES (40) → WORLD STATE (50, 55) → METRICS (60)`.
