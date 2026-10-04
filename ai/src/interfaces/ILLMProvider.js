/**
 * Interface contract for LLM Providers (OpenAI, Anthropic, Local LLMs, Ollama, etc.).
 * To be implemented in subsequent phases.
 */
export class ILLMProvider {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Send a completion or chat prompt to the model
   * @param {string|Array<{ role: string, content: string }>} prompt
   * @param {Object} [options]
   * @returns {Promise<{ text: string, raw: any, usage: any }>}
   */
  async complete(prompt, options = {}) {
    throw new Error('ILLMProvider.complete() must be implemented by concrete provider');
  }

  /**
   * Generate vector embeddings for a given input text
   * @param {string|string[]} text
   * @returns {Promise<number[]|number[][]>}
   */
  async embed(text) {
    throw new Error('ILLMProvider.embed() must be implemented by concrete provider');
  }
}

export default ILLMProvider;
