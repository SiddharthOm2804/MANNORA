import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  WorldPromptParser,
  WorldConfigurationValidator,
} from '../src/index.js';

describe('Phase 14: WorldConfigurationValidator', () => {
  it('validates and clamps population and city count ranges', () => {
    const raw = {
      name: 'Test Colony',
      population: 2000000, // Exceeds 1,000,000 cap
      numberOfCities: 100, // Exceeds 50 cap
      resources: { water: -50, energy: 9999999 },
    };

    const res = WorldConfigurationValidator.validate(raw);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.sanitizedConfig.population, 1000000);
    assert.strictEqual(res.sanitizedConfig.numberOfCities, 50);
    assert.strictEqual(res.sanitizedConfig.resources.water, 0);
    assert.strictEqual(res.sanitizedConfig.resources.energy, 1000000);
    assert.ok(res.warnings.length > 0);
  });

  it('rejects invalid or non-object configuration inputs', () => {
    const res = WorldConfigurationValidator.validate(null);
    assert.strictEqual(res.valid, false);
    assert.ok(res.errors.length > 0);
  });
});

describe('Phase 14: WorldPromptParser (Natural Language Pipeline)', () => {
  it('parses user natural language prompt into structured, validated world configuration', async () => {
    const parser = new WorldPromptParser();
    const prompt = 'Create a desert civilization with 20,000 citizens, two cities, limited water, agriculture, trade, hospitals and a central government.';

    const result = await parser.parseWorldPrompt(prompt);

    assert.ok(result, 'Parser result must exist');
    assert.strictEqual(result.isValid, true);
    assert.ok(result.validatedConfig, 'Validated config must be generated');

    const config = result.validatedConfig;
    assert.strictEqual(config.population, 20000);
    assert.strictEqual(config.numberOfCities, 2);
    assert.strictEqual(config.biome, 'Desert');
    assert.strictEqual(config.governmentType, 'Central Government');
    assert.ok(config.resources.water < 2500, 'Water should be limited/scarce');
    assert.strictEqual(config.cities.length, 2);
    assert.ok(config.industries.some((i) => i.toLowerCase().includes('agriculture')));
    assert.ok(config.publicServices.some((p) => p.toLowerCase().includes('hospital')));
  });

  it('handles empty prompt gracefully with explicit error', async () => {
    const parser = new WorldPromptParser();
    await assert.rejects(
      async () => parser.parseWorldPrompt('   '),
      /User prompt cannot be empty/
    );
  });
});
