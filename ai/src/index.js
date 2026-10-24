/**
 * NEURAL CITY — AI & Cognitive Engine Package
 * Phase 9 AI Assistant, Cognitive Memory, and Systems Analysis exports.
 */
export { ILLMProvider } from './interfaces/ILLMProvider.js';
export { DeterministicRuleFallbackProvider } from './interfaces/DeterministicRuleFallbackProvider.js';
export { AIProviderFactory, GenericHttpLLMProvider } from './interfaces/AIProviderFactory.js';

export { MemoryStore } from './memory/MemoryStore.js';
export { MemoryManager } from './memory/MemoryManager.js';
export { RetrievalService } from './memory/RetrievalService.js';

export { PromptPipeline } from './pipelines/PromptPipeline.js';
export { BaseCognitiveAgent } from './agents/BaseCognitiveAgent.js';
export { CitizenAI } from './agents/CitizenAI.js';
export { GovernmentAI } from './agents/GovernmentAI.js';
export { AnalystAI } from './analysis/AnalystAI.js';

export default {
  ILLMProvider: (await import('./interfaces/ILLMProvider.js')).ILLMProvider,
  DeterministicRuleFallbackProvider: (await import('./interfaces/DeterministicRuleFallbackProvider.js')).DeterministicRuleFallbackProvider,
  AIProviderFactory: (await import('./interfaces/AIProviderFactory.js')).AIProviderFactory,
  MemoryStore: (await import('./memory/MemoryStore.js')).MemoryStore,
  MemoryManager: (await import('./memory/MemoryManager.js')).MemoryManager,
  RetrievalService: (await import('./memory/RetrievalService.js')).RetrievalService,
  PromptPipeline: (await import('./pipelines/PromptPipeline.js')).PromptPipeline,
  BaseCognitiveAgent: (await import('./agents/BaseCognitiveAgent.js')).BaseCognitiveAgent,
  CitizenAI: (await import('./agents/CitizenAI.js')).CitizenAI,
  GovernmentAI: (await import('./agents/GovernmentAI.js')).GovernmentAI,
  AnalystAI: (await import('./analysis/AnalystAI.js')).AnalystAI,
};
