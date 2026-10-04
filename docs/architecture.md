# NEURAL CITY — System Architecture

**AI-Driven Multi-Agent Civilization Simulation Engine**  
**Phase 1: Foundational Monorepo & Core Infrastructure**

---

## 1. Executive Summary

NEURAL CITY is an advanced, deterministic multi-agent civilization simulation engine powered by state-of-the-art cognitive agent modeling, real-time spatial dynamics, and complex socioeconomic feedback loops.

Phase 1 establishes the foundational monorepo architecture, server infrastructure with verified MongoDB connectivity, decoupled deterministic simulation primitives, and a modern web client interface.

```
                              +---------------------------------------+
                              |         NEURAL CITY CLIENT            |
                              |   React 18 + Vite + Tailwind + R3F    |
                              +-------------------+-------------------+
                                                  |
                                             HTTP / WS
                                                  |
                                                  v
                              +---------------------------------------+
                              |         EXPRESS API SERVER            |
                              |  Helmet + CORS + Morgan + Health API  |
                              +---------+-------------------+---------+
                                        |                   |
                                        v                   v
                    +-----------------------+   +-----------------------+
                    |      MONGODB DB       |   |   SIMULATION ENGINE   |
                    |   Mongoose ODM v8     |   |   Deterministic Loop  |
                    +-----------------------+   +-----------+-----------+
                                                            |
                                                            v
                                                +-----------------------+
                                                |     AI COGNITION      |
                                                |  (Interface Phase 1)  |
                                                +-----------------------+
```

---

## 2. Monorepo Organization

The workspace is organized into focused packages under an npm workspace root:

| Directory | Role | Key Technologies |
| :--- | :--- | :--- |
| `/client` | User dashboard, 3D viewport, telemetry controls | React 18, Vite, Tailwind CSS, Three.js, R3F, Framer Motion |
| `/server` | REST API, health monitoring, persistence | Node.js, Express, Mongoose, Helmet, Morgan |
| `/simulation` | Deterministic simulation engine, state machine, PRNG | ES6, Events, Mulberry32 PRNG |
| `/ai` | Cognitive architecture interfaces, memory stores | Interface abstractions, Memory buffers, Prompt pipelines |
| `/shared` | Cross-package constants, canonical event types, schemas | Universal ES modules |
| `/docs` | Architecture, engine, agent, and API documentation | Markdown |

---

## 3. Core Principles

1. **Determinism First**: All simulation logic uses seeded PRNG (`RandomEngine`) and discrete fixed tick advancement (`SimulationClock`). Given the same seed and input sequence, simulation runs are 100% reproducible.
2. **Decoupled Architecture**: The simulation core does not depend on database or UI rendering layers. It can execute headless in Node.js, in a worker thread, or inside the browser.
3. **Resilient Infrastructure**: The server handles database unavailability gracefully, never masking failures or falsely claiming healthy status.
4. **Clean Phase Boundaries**: Phase 1 establishes the bedrock without introducing premature, half-baked domain logic for agents, economies, or complex rendering.
