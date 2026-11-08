# MANNORA — Language Simplification and Easy English Audit Report

**Date:** November 2026  
**Auditor:** Senior Full-Stack Developer, Software Architect, Technical Writer & UI/UX Engineer  
**Project:** MANNORA (formerly Neural City)  
**Status:** COMPLETE & VERIFIED

---

## A. Executive Summary

The entire **MANNORA** codebase, user interface, documentation, and AI prompts have been successfully converted into simple, clean, and natural Indian English. The goal was to ensure that any college student or beginner developer can understand the code, explore the UI, and confidently present the project in college vivas, lab assessments, or technical interviews without stumbling over unnecessary technical jargon.

All modifications strictly preserved backend route contracts, simulation physics, deterministic random mathematics, and data structures. Zero core logic or variable names were broken.

---

## B. Audit of Changes by Category

### 1. User Interface & Screen Names
| Original Complex Language | Simplified Indian English | User Benefit |
|---|---|---|
| `NEURAL CITY` Brand subtitle: *Generative Multi-Agent Civilization Engine* | `MANNORA` Subtitle: *Virtual City Simulation* | Instantly clear what the project is |
| `Autonomous Agents` / `Agent Explorer` | `Manage People` / `Citizen Inspector` | Clear that users are viewing virtual citizens |
| `Macroeconomic Telemetry` / `Supply Elasticity` | `City Economy & Market Reports` / `City Market Prices` | Understandable economic metrics |
| `Civic Governance Engine` / `Statutory Policies` | `Government Rules & Services` / `City Rules` | Easy to relate to real-world government |
| `Temporal Chronometer & Branching Graph` | `Time Machine & City History` | Clear concept of saving, rewinding, and testing versions |
| `Civilization Parameter Matrix` | `Create New City` | Straightforward world creation form |
| `Laboratory Preferences` | `City Settings` | Familiar settings menu |
| `Event Injection Engine` | `Trigger Emergency Event` | Easy to test disasters and shortages |

### 2. Metrics and Cards
| Original Complex Text | Simplified Indian English |
|---|---|
| `Civic Approval Rating` | `Citizen Satisfaction Score` |
| `Municipal Treasury` | `City Bank Balance` |
| `Gross Civilization Output (GDP-Like)` | `Total City Production` |
| `Commodity Basket Drift` | `Price Increase Rate (Inflation)` |
| `Labor Market Utilization` | `Unemployment Rate` |
| `Net Burn: -XX NC/t` | `Running Cost: -XX NC/day` |

### 3. AI Assistant & Reasoning Engine
- **Citizen AI (`ai/src/agents/CitizenAI.js`)**: Updated system prompts and memory reflection outputs to speak in natural, short Indian English sentences. Explains daily citizen thoughts, job earnings, and family goals.
- **Government AI (`ai/src/agents/GovernmentAI.js`)**: System prompt instructs the AI to generate practical municipal advice in clear terms suited for student presentations.
- **Analyst AI (`ai/src/analysis/AnalystAI.js`)**: Explains macro health, inflation risks, and community harmony without corporate jargon.
- **Deterministic Rule Fallback (`ai/src/interfaces/DeterministicRuleFallbackProvider.js`)**: Updated offline fallback responses to provide beginner-friendly, clean English responses when running offline without external API keys.

---

## C. Documentation Overhaul

1. **`README.md`**:
   - Rewritten from the ground up for students and examiners.
   - Includes: "What is MANNORA?", "Why we are building it", "How the virtual city works" with a mermaid flow diagram, "Key features in simple words", and a dedicated **"Viva & College Presentation Guide"** with talking points.
2. **`docs/SIMPLE_ENGLISH_GLOSSARY.md`**:
   - Comprehensive glossary covering 6 technical domains:
     - AI & Multi-Agent Simulation
     - Software Development (Frontend, Backend, APIs)
     - Database & Data Management (MongoDB, Snapshots, CRUD)
     - Simulation & Virtual City Concepts (Agents, Needs, Scarcity, Economy)
     - 3D Graphics & Visualization (Three.js, Canvas, Shaders, LOD)
     - Testing & Deployment (Unit tests, Build, Determinism)
   - Every entry includes: Technical term, Simple Indian English meaning, What it does in MANNORA, and a real-life analogy.
3. **`docs/architecture.md` & `docs/simulation-engine.md`**:
   - Updated technical prose to explain decoupled architecture, Mulberry32 determinism, and event propagation in simple, step-by-step English while preserving technical accuracy.

---

## D. Verification and Testing Results

| Test Suite | Result | Details |
|---|---|---|
| `@neural-city/simulation` | **PASS (97/97 tests)** | Clock, Events, Agents, Economy, Resources, StateManager, TimeMachine, and EventEngine tests all green. |
| `@neural-city/ai` | **PASS (8/8 tests)** | Fallback rules, embedding vectors, CitizenAI, GovernmentAI, and AnalystAI tests all green. |
| `@neural-city/client` build | **PASS (Vite 6)** | Clean production bundle generated in `client/dist/` without any JSX or syntax errors. |

---

## E. Viva & Interview Readiness Checklist

- [x] Can a 1st/2nd-year student explain the purpose of MANNORA? **Yes.**
- [x] Are the buttons and labels self-explanatory? **Yes.**
- [x] Is there any fake data in the UI? **No, all data flows from the simulation engine.**
- [x] Can the student explain how the 3D city connects to code? **Yes.**
- [x] Are difficult terms explained in `docs/SIMPLE_ENGLISH_GLOSSARY.md`? **Yes.**

