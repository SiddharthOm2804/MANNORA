# AI Layer

The `@neural-city/ai` package provides an `ILLMProvider` contract, a deterministic rules fallback, citizen and government helpers, analyst tools, retrieval/memory utilities, prompt parsing, and causal inquiry. The Express AI routes instantiate the configured provider on the server.

## Provider selection and failures

`AIProviderFactory` reads `AI_PROVIDER`, `AI_API_KEY`/`OPENAI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`. The default is `fallback`. External OpenAI-compatible requests use an abort timeout; missing credentials, non-success responses, and transport errors route to deterministic fallback behavior. Provider output and fallback status should be surfaced and logged without exposing keys or sensitive prompt content.

Use only a trusted provider URL. `AI_BASE_URL` is server configuration and can cause outbound requests; never accept it from a user request. Provider credentials belong in a secret manager or server-side environment. A `VITE_` variable is embedded into the browser build and must never contain a key.

## Boundaries

AI requests are outside the deterministic per-tick simulation pipeline. A model may generate a reflection, plan, policy suggestion, analysis, or parsed world configuration, but simulation validation and deterministic rules remain responsible for state transitions. Treat generated text as advisory and validate structured output before applying it.

## Reliability and resource controls

AI HTTP routes have a tighter API rate limit than general API routes; request bodies are capped at 1 MB. Each provider call has an 8-second default timeout. Failures fall back when the implementation can do so. The citizen cognitive-instance cache is process-local. For production, monitor provider latency, fallback rates, token/cost usage, and cache size; apply provider-side budgets and retention controls appropriate to your data policy.

## Limitations

Fallback responses are deterministic scaffolding, not model-equivalent reasoning. External provider results may vary and are not reproducible from the simulation seed alone. Causal analysis is only as reliable as its supplied history and the provider's grounding; it should not be presented as a verified causal finding without independent analysis.

Related: [API routes](api.md#ai-routes), [Simulation determinism](simulation-engine.md#determinism), [Deployment secrets](../README.md#deployment).
