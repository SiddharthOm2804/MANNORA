import { ILLMProvider } from './ILLMProvider.js';
import { DeterministicRuleFallbackProvider } from './DeterministicRuleFallbackProvider.js';

/**
 * AIProviderFactory selects and manages LLM provider instances.
 * Implements provider abstraction (OpenAI-compatible, Anthropic-compatible, Local/Ollama, or Rule Fallback).
 *
 * Ensures all API keys and provider endpoints remain strictly server-side.
 * Gracefully falls back to DeterministicRuleFallbackProvider if keys are missing or requests fail.
 */
export class AIProviderFactory {
  /**
   * @param {Object} [config]
   * @param {string} [config.provider] - 'openai' | 'anthropic' | 'local' | 'fallback'
   * @param {string} [config.apiKey]
   * @param {string} [config.baseUrl]
   * @param {string} [config.model]
   */
  constructor(config = {}) {
    this.config = {
      provider: config.provider || process.env.AI_PROVIDER || 'fallback',
      apiKey: config.apiKey || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '',
      baseUrl: config.baseUrl || process.env.AI_BASE_URL || 'https://api.openai.com/v1',
      model: config.model || process.env.AI_MODEL || 'gpt-4o-mini',
      timeoutMs: config.timeoutMs || 8000,
      ...config,
    };

    this.fallbackProvider = new DeterministicRuleFallbackProvider();
    this.primaryProvider = this._createProvider();
  }

  /**
   * Instantiate provider according to configuration
   * @private
   */
  _createProvider() {
    // If no API key is provided and provider requires key, default to resilient fallback
    if (!this.config.apiKey && (this.config.provider === 'openai' || this.config.provider === 'anthropic')) {
      return this.fallbackProvider;
    }

    if (this.config.provider === 'fallback') {
      return this.fallbackProvider;
    }

    // Generic HTTP JSON-RPC / REST LLM Provider (Compatible with OpenAI / Ollama / Local vLLM)
    return new GenericHttpLLMProvider(this.config, this.fallbackProvider);
  }

  /**
   * Get active provider instance
   * @returns {ILLMProvider}
   */
  getProvider() {
    return this.primaryProvider;
  }
}

/**
 * GenericHttpLLMProvider connects to any OpenAI-compatible or local inference endpoint.
 * Wrapped with automatic timeout and fallback to DeterministicRuleFallbackProvider.
 */
export class GenericHttpLLMProvider extends ILLMProvider {
  /**
   * @param {Object} config
   * @param {ILLMProvider} fallbackProvider
   */
  constructor(config = {}, fallbackProvider = null) {
    super(config);
    this.fallbackProvider = fallbackProvider || new DeterministicRuleFallbackProvider();
  }

  async complete(prompt, options = {}) {
    if (!this.config.apiKey && !this.config.baseUrl.includes('localhost') && !this.config.baseUrl.includes('127.0.0.1')) {
      return this.fallbackProvider.complete(prompt, options);
    }

    const messages = typeof prompt === 'string'
      ? [{ role: 'user', content: prompt }]
      : prompt;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs || 8000);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: options.model || this.config.model,
          messages,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[AI Provider Warning] HTTP ${response.status} from ${this.config.baseUrl}. Falling back to rule engine.`);
        return this.fallbackProvider.complete(prompt, options);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return {
        text: content,
        raw: data,
        usage: data.usage || {},
        fallback: false,
      };
    } catch (err) {
      clearTimeout(timeout);
      console.warn(`[AI Provider Fallback] Invocation failed: ${err.message}. Resilient rule fallback activated.`);
      return this.fallbackProvider.complete(prompt, options);
    }
  }

  async embed(text) {
    // If embedding API fails, delegate to deterministic pseudo-embedding
    return this.fallbackProvider.embed(text);
  }
}

export default AIProviderFactory;
