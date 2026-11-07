# MANNORA — Initial Language & Terminology Audit Report

**Date:** November 2026  
**Auditor:** Senior Full-Stack Developer & UI/UX Technical Writer  
**Target:** Complete Codebase, UI Pages, Documentation & Terminology Simplification  
**Goal:** Make MANNORA easily understandable in natural, simple Indian English for college students and presentations while strictly preserving all underlying technical architecture, code APIs, and simulation models.

---

## 1. System Inventory

MANNORA is structured as a robust 5-workspace monorepo:
1. **`client/` (Frontend)**: React 18, Vite, Tailwind CSS, Lucide icons, Three.js / React Three Fiber for 3D visual city view.
2. **`server/` (Backend API)**: Node.js, Express, MongoDB (Mongoose), Server-Sent Events (SSE).
3. **`simulation/` (Engine Core)**: Pure deterministic ES Modules simulation pipeline:
   - `SimulationClock` $\rightarrow$ `EventSystem` / `EventEngine` $\rightarrow$ `AgentSystem` $\rightarrow$ `EconomySystem` $\rightarrow$ `ResourceSystem` $\rightarrow$ `PopulationSystem` / `BuildingSystem` $\rightarrow$ `GovernmentEngine` $\rightarrow$ `MetricsSystem` $\rightarrow$ `TimeMachine` / `BranchEngine`.
4. **`ai/` (Cognitive & Diagnostic Assistant)**: `CitizenAI`, `GovernmentAI`, `AnalystAI`, `MemoryManager`, `RetrievalService`, `DeterministicRuleFallbackProvider`.
5. **`shared/` (Common Contracts)**: Canonical constants, event types, schema definitions.

---

## 2. Identified Difficult Vocabulary & Technical Explanations

Across existing UI screens, buttons, tooltips, logs, and docs, multiple overly complex academic/sci-fi terms were identified:

| Existing Complex / Confusing English | Simple Indian English Replacement | Where It Appears |
|---|---|---|
| Civilization Simulation Platform | Virtual City Simulation Platform | Landing page, Header, Meta |
| Autonomous Multi-Agent Cognitive Lab | Virtual City Simulation with Smart People | Hero header, Badges |
| Coupling cognitive agent architectures with macroeconomic... | Showing how virtual people, money, resources, and city rules work together | Landing description |
| Spatial Viewport / 3D Spatial Matrix | 3D City View | Navbar, Simulation page |
| Initialize Matrix / Initialize World | Create New City | Buttons, Modals, Forms |
| Deterministic Execution / PRNG Engine | Predictable Simulation (Same inputs give same results) | Specs cards, Tooltips |
| Fixed Delta Timestep | Steady Timer (Fixed Step Time) | Settings, Telemetry |
| Diurnal Cycle (Night, Dawn, Dusk, Midday) | Day-Night Cycle | 3D City Header |
| Agent Explorer / Citizen Inspection | View People Details | Sidebar, Pages |
| Working Memory Capacity / Salient Episodic Retrieval | Saved Memories of Person | Agent Explorer, AI |
| Purposeful Travel Along Coordinate Vector | Walking Towards Workplace / Home | Agent action details |
| Homeostatic Needs & Drives Decay | Person's Basic Daily Needs | Agent Needs tab |
| Macroeconomic Telemetry & Dynamics | City Financial Report & Statistics | Analytics page |
| Dynamic Commodity Pricing & Elasticity | Resource Prices (Changes with demand & supply) | Analytics, Economy |
| Solvency / Fiscal Treasury Depletion | City Bank Balance (Money left in government funds) | Government, Metrics |
| Technocratic Council Advisory AI | City Government AI Assistant | AI Assistant, Government |
| Temporal Timeline / Chronometer Scrubbing | Time Machine & Saved Points | Timeline page, Controls |
| Counterfactual Branching & Analysis | Creating Another Version to Compare Decisions | Timeline page |
| Exogenous Crisis Shock Injection | Trigger City Emergency / Event | Event Injection Modal |
| Structural Conduit Overload / Substation Shear | Breakdown in Power Lines and Transformers | Event Descriptions |
| Ring-Buffer Checkpoint Retention | Saved Points History | Timeline Checkpoints |
| Labor Market Tightness & Frictional Unemployment | Number of People Looking for Jobs | Analytics, Economy |
| Biological Pathogen Contagion & Aerosol Spread | Sickness Outbreak in the City | Disease Event |

---

## 3. UI Component Simplification Roadmap

The following user-visible files will be updated with beginner-friendly text:
1. `client/src/components/layout/Navbar.jsx` — Simple badges, clear status, easy labels.
2. `client/src/components/layout/Sidebar.jsx` — Simple module titles (`City Overview`, `3D City View`, `People Details`, `City Reports`, `Government Rules`, `Time Machine`, `Settings`).
3. `client/src/pages/Landing.jsx` — Clear explanation of what MANNORA is, simple feature cards, easy buttons.
4. `client/src/pages/WorldDashboard.jsx` — Easy metric cards (`Total Population`, `City Bank Balance`, `Power Available`, `Number of Areas`).
5. `client/src/pages/CreateWorld.jsx` — Simple step-by-step form for creating a virtual city.
6. `client/src/pages/Simulation.jsx` — 3D city view controls, simple entity inspection, clear emergency injection.
7. `client/src/components/common/EventInjectionUI.jsx` — Plain English crisis names and descriptions.
8. `client/src/pages/AgentExplorer.jsx` — Easy life status, needs, goals, and thoughts of computer-controlled people.
9. `client/src/pages/GovernmentDashboard.jsx` — Clear rules, taxes, public services, and friendly AI city advice.
10. `client/src/pages/Analytics.jsx` — Easy-to-read charts, simple financial and resource statistics.
11. `client/src/pages/Timeline.jsx` — Easy Time Machine controls, rewind, jumping to day, and comparing city versions.
12. `client/src/pages/Settings.jsx` — Simple settings explanations for college students.

---

## 4. Documentation & AI Roadmap

1. **`docs/SIMPLE_ENGLISH_GLOSSARY.md`**: Complete dictionary covering all 6 mandatory categories + discovered terms with simple Indian English meaning, function in MANNORA, and real-life examples.
2. **`README.md`**: Friendly project overview, simple setup steps, architecture explanation, and viva presentation guide.
3. **`docs/architecture.md` & other guides**: Simplified explanations of the 7-stage tick pipeline and data flow.
4. **`ai/` assistant prompts**: Update system prompts in `CitizenAI`, `GovernmentAI`, `AnalystAI`, and `DeterministicRuleFallbackProvider` to respond in simple Indian English.
