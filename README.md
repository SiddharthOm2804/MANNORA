# NEURAL CITY

> **AI-Driven Multi-Agent Civilization Simulation Engine**  
> *Phase 1: Foundational Architecture & Environment Setup*

---

## Overview

**NEURAL CITY** is a deterministic, generative civilization simulation platform combining multi-agent cognition, macroeconomic dynamics, and spatial city simulation.

Phase 1 provides:
- **Clean Monorepo Organization**: `/client`, `/server`, `/simulation`, `/ai`, `/shared`, `/docs`
- **Express & Mongoose Server**: Resilient database connection, environment validation, and `/api/health`
- **Deterministic Simulation Core**: `SimulationEngine`, `WorldState`, `SimulationClock`, `StateManager`, and `RandomEngine`
- **AI Package Foundation**: Cognitive contracts (`ILLMProvider`, `BaseCognitiveAgent`, `MemoryStore`, `PromptPipeline`)
- **Modern Web Client**: React 18, Vite, Tailwind CSS, Framer Motion, and Three.js / React Three Fiber integration

---

## Directory Structure

```
├── client/              # React 18 + Vite + Tailwind CSS + Three.js client
├── server/              # Node.js + Express + Mongoose server
├── simulation/          # Deterministic civilization simulation package
├── ai/                  # AI & cognitive architecture interfaces & memory
├── shared/              # Shared constants, event types, and schemas
├── docs/                # Architecture and system documentation
├── .env.example         # Template environment variables
└── package.json         # Workspace root configuration
```

---

## Quick Start

### 1. Environment Configuration
Copy the template environment file:
```bash
cp .env.example .env
```
Ensure your MongoDB instance is running locally or specify your `MONGO_URI`.

### 2. Run API Server
```bash
npm run dev:server
```
Visit the health check endpoint: `http://localhost:5000/api/health`

### 3. Run Client Application
```bash
npm run dev:client
```
Access the client dashboard: `http://localhost:5173`

---

## Health Check API

`GET /api/health`

Returns:
- Server execution status and uptime
- Real-time MongoDB connection readiness (`connected`, `disconnected`, `connecting`, `error`)
- ISO8601 timestamp
