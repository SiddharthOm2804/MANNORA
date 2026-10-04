# AI System Architecture

**NEURAL CITY — Cognitive Engine Specification**  
**Package:** `@neural-city/ai`

---

## 1. Overview

The AI layer provides cognitive modeling infrastructure for autonomous agents. In Phase 1, the foundational package structure, contracts, and memory models are established without concrete LLM network dependencies.

## 2. Components

- **`ILLMProvider`**: Interface contract defining `complete()` and `embed()` abstractions for future model adapters (OpenAI, Anthropic, Ollama, HuggingFace).
- **`MemoryStore`**: Multi-tier memory architecture:
  - *Working Memory*: Bounded short-term buffer for recent sensory observations.
  - *Episodic Memory*: Structured log of significant past experiences, actions, and affective reactions.
- **`PromptPipeline`**: Template manager with parameter substitution for agent reasoning workflows.
- **`BaseCognitiveAgent`**: Abstract agent skeleton implementing the `perceive -> decide -> act` loop.
