/**
 * PromptPipeline prepares, validates, and hydrates prompt templates for agent cognitive loops.
 */
export class PromptPipeline {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    this.templates = new Map();
  }

  /**
   * Register a named prompt template
   * @param {string} name
   * @param {string} templateString - e.g. "You are {{agentName}}, a {{role}} in Neural City."
   */
  registerTemplate(name, templateString) {
    this.templates.set(name, templateString);
  }

  /**
   * Render template with variables
   * @param {string} name
   * @param {Object} variables
   * @returns {string}
   */
  render(name, variables = {}) {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Prompt template "${name}" not found`);
    }

    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      return variables[key] !== undefined ? String(variables[key]) : '';
    });
  }
}

export default PromptPipeline;
