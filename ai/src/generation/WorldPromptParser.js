import { AIProviderFactory } from '../interfaces/AIProviderFactory.js';
import { WorldConfigurationValidator } from './WorldConfigurationValidator.js';

/**
 * WorldPromptParser transforms free-form natural language prompts into
 * structured, validated WorldConfiguration objects.
 *
 * Example input:
 * "Create a desert civilization with 20,000 citizens, two cities, limited water, agriculture, trade, hospitals and a central government."
 */
export class WorldPromptParser {
  /**
   * @param {Object} [options]
   * @param {Object} [options.aiProvider]
   */
  constructor(options = {}) {
    this.aiProvider = options.aiProvider || new AIProviderFactory().getProvider();
  }

  /**
   * Parse a natural language prompt into a structured, validated configuration.
   *
   * @param {string} userPrompt
   * @returns {Promise<{
   *   rawOutput: Object,
   *   validatedConfig: Object,
   *   isValid: boolean,
   *   errors: string[],
   *   warnings: string[],
   *   extractedAttributes: Object
   * }>}
   */
  async parseWorldPrompt(userPrompt) {
    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      throw new Error('User prompt cannot be empty');
    }

    const cleanPrompt = userPrompt.trim();

    // 1. Build extraction system prompt
    const prompt = [
      {
        role: 'system',
        content: `You are the World Configuration Architect for MANNORA (Virtual City Simulation).
Convert the user's natural language description of a civilization into a strict JSON configuration object.
Extract or infer:
- name: A fitting civilization name (e.g. "Kalahari Solar Republic", "Oasis Syndicate")
- description: A short, 1-2 sentence description in simple English
- population: integer number of citizens (default: 5000)
- numberOfCities: integer count of cities/urban sectors (default: 2)
- biome: "Desert" | "Arid Wasteland" | "Cybernetic Basin" | "Temperate Plains" | "Coastal Delta" | "Mountain Highlands" | "Tropical Rainforest" | "Tundra / Polar"
- governmentType: "Central Government" | "Technocracy" | "Democracy" | "Direct Democracy" | "Republic" | "Council Federation"
- resources: object with integer amounts for:
    - water (if "limited", "scarce", or "low", use 1000-1800; if "abundant", use 10000; normal: 5000)
    - energy (e.g. 5000)
    - agriculture (e.g. 3500)
    - minerals (e.g. 2500)
    - technology (e.g. 1500)
- startingMoney: integer treasury credits (e.g. 600000)
- industries: array of string sectors (e.g. ["Agriculture & Food", "Trade & Commerce", "Healthcare", "Textiles"])
- publicServices: array of strings (e.g. ["Hospitals & Medical Care", "City Water Infrastructure", "Central Administration"])

Return ONLY a valid JSON object with these keys. No markdown fences, no conversational prose.`,
      },
      {
        role: 'user',
        content: cleanPrompt,
      },
    ];

    // 2. Query AI Provider (with built-in fallback)
    const result = await this.aiProvider.complete(prompt);

    let rawOutput = null;
    try {
      rawOutput = typeof result.text === 'object' ? result.text : JSON.parse(result.text);
    } catch {
      // If LLM returned text or rule fallback didn't output JSON, extract deterministically
      rawOutput = this._fallbackDeterministicParser(cleanPrompt);
    }

    if (!rawOutput || typeof rawOutput !== 'object') {
      rawOutput = this._fallbackDeterministicParser(cleanPrompt);
    }

    rawOutput.rawPrompt = cleanPrompt;

    // 3. STRICT VALIDATION PIPELINE (Never execute unvalidated AI output)
    const validation = WorldConfigurationValidator.validate(rawOutput);

    return {
      rawOutput,
      validatedConfig: validation.sanitizedConfig,
      isValid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      extractedAttributes: {
        population: validation.sanitizedConfig.population,
        numberOfCities: validation.sanitizedConfig.numberOfCities,
        biome: validation.sanitizedConfig.biome,
        governmentType: validation.sanitizedConfig.governmentType,
        waterLevel: validation.sanitizedConfig.resources.water < 2500 ? 'Limited / Scarce' : 'Standard / Abundant',
        industries: validation.sanitizedConfig.industries,
        publicServices: validation.sanitizedConfig.publicServices,
      },
    };
  }

  /**
   * Deterministic regex and keyword parser for offline baseline or fallback.
   * Ensures 100% reliability even if external APIs are completely unreachable.
   */
  _fallbackDeterministicParser(prompt) {
    const text = prompt.toLowerCase();

    // 1. Population extraction (e.g. "20,000 citizens", "5000 people", "10k")
    let population = 5000;
    const popMatch = text.match(/(\d[\d,]*)\s*(?:citizens|people|residents|inhabitants|pop)/i);
    if (popMatch) {
      population = parseInt(popMatch[1].replace(/,/g, ''), 10);
    } else {
      const kMatch = text.match(/(\d+)\s*k\s*(?:citizens|people|residents)/i);
      if (kMatch) {
        population = parseInt(kMatch[1], 10) * 1000;
      }
    }

    // 2. City count extraction (e.g. "two cities", "3 cities", "four sectors")
    let numberOfCities = 2;
    const numberWords = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    const cityWordMatch = text.match(/(one|two|three|four|five|six|\d+)\s*(?:cities|municipalities|districts|sectors|towns)/i);
    if (cityWordMatch) {
      const val = cityWordMatch[1].toLowerCase();
      numberOfCities = numberWords[val] || parseInt(val, 10) || 2;
    }

    // 3. Biome extraction
    let biome = 'Cybernetic Basin';
    if (text.includes('desert') || text.includes('arid') || text.includes('oasis') || text.includes('sand')) {
      biome = 'Desert';
    } else if (text.includes('coastal') || text.includes('ocean') || text.includes('delta')) {
      biome = 'Coastal Delta';
    } else if (text.includes('mountain') || text.includes('highlands')) {
      biome = 'Mountain Highlands';
    } else if (text.includes('plains') || text.includes('grassland')) {
      biome = 'Temperate Plains';
    } else if (text.includes('tundra') || text.includes('snow') || text.includes('ice')) {
      biome = 'Tundra / Polar';
    }

    // 4. Government extraction
    let governmentType = 'Central Government';
    if (text.includes('central government') || text.includes('centralized')) {
      governmentType = 'Central Government';
    } else if (text.includes('technocracy') || text.includes('technocratic')) {
      governmentType = 'Technocracy';
    } else if (text.includes('democracy') || text.includes('democratic')) {
      governmentType = 'Democracy';
    } else if (text.includes('republic')) {
      governmentType = 'Republic';
    } else if (text.includes('council')) {
      governmentType = 'Council Federation';
    }

    // 5. Water / Resource Levels
    const isLimitedWater = text.includes('limited water') || text.includes('water scarcity') || text.includes('scarce water') || text.includes('low water') || text.includes('dry');
    const water = isLimitedWater ? 1200 : 5000;
    const energy = 5500;
    const agriculture = text.includes('agriculture') || text.includes('farming') ? 4500 : 3000;
    const minerals = 2800;
    const technology = text.includes('tech') || text.includes('cyber') ? 3500 : 1500;

    // 6. Industries
    const industries = [];
    if (text.includes('agriculture') || text.includes('farming') || text.includes('food')) {
      industries.push('Synthetic Bio-Agriculture & Farming');
    }
    if (text.includes('trade') || text.includes('commerce') || text.includes('market')) {
      industries.push('Financial Markets & Commercial Trade');
    }
    if (text.includes('hospital') || text.includes('health') || text.includes('medical')) {
      industries.push('Healthcare, Biotech & Clinics');
    }
    if (industries.length === 0) {
      industries.push('Manufacturing & Energy', 'Trade & Commerce');
    }

    // 7. Public Services
    const publicServices = [];
    if (text.includes('hospital') || text.includes('healthcare') || text.includes('medical')) {
      publicServices.push('Municipal Hospitals & Trauma Clinics');
    }
    if (text.includes('central government') || text.includes('government')) {
      publicServices.push('Central Civic Administration & Public Security');
    }
    if (isLimitedWater || text.includes('water')) {
      publicServices.push('Strategic Water Purification & Rationing Grid');
    }

    const name = biome === 'Desert'
      ? 'Neo-Sahara Central Oasis'
      : `${biome} Autonomous Matrix`;

    return {
      name,
      description: `A ${biome.toLowerCase()} civilization with ${population.toLocaleString()} citizens, ${numberOfCities} cities, and ${governmentType.toLowerCase()}.`,
      population,
      numberOfCities,
      biome,
      governmentType,
      resources: {
        water,
        energy,
        agriculture,
        minerals,
        technology,
      },
      startingMoney: 600000,
      taxRate: 0.15,
      industries,
      publicServices,
    };
  }
}
