import express from 'express';
import { CitizenAI, GovernmentAI, AnalystAI, AIProviderFactory } from '@neural-city/ai';

const router = express.Router();
const providerFactory = new AIProviderFactory();
const activeProvider = providerFactory.getProvider();

const governmentAI = new GovernmentAI({ aiProvider: activeProvider });
const analystAI = new AnalystAI({ aiProvider: activeProvider });

// Cache of CitizenAI cognitive instances: Map<citizenId, CitizenAI>
const citizenAICache = new Map();

const getCitizenAI = (id, name, role) => {
  if (!citizenAICache.has(id)) {
    citizenAICache.set(
      id,
      new CitizenAI({
        id,
        name: name || `Citizen ${id.slice(-4)}`,
        role: role || 'citizen',
        aiProvider: activeProvider,
      })
    );
  }
  return citizenAICache.get(id);
};

/**
 * POST /api/ai/citizen/:id/reflect
 * Reasoning Assistant: Synthesize reflection on life state, goals, and memories
 */
router.post('/citizen/:id/reflect', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, citizenState, worldContext } = req.body;

    const citizenAI = getCitizenAI(id, name, role);

    // If milestone provided in request, commit it first
    if (req.body.milestone) {
      await citizenAI.recordMilestone(req.body.milestone);
    }

    const reflection = await citizenAI.reflectOnLife(
      citizenState || { occupation: role },
      worldContext || {}
    );

    res.json({
      success: true,
      data: reflection,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/citizen/:id/plan
 * Planner Assistant: Generate structured personal plan
 */
router.post('/citizen/:id/plan', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, citizenState, economicContext } = req.body;

    const citizenAI = getCitizenAI(id, name, role);
    const plan = await citizenAI.generatePersonalPlan(
      citizenState || { occupation: role, wealth: 100 },
      economicContext || {}
    );

    res.json({
      success: true,
      data: plan,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/citizen/:id/memory
 * Memory Assistant: Commit significant milestone event
 */
router.post('/citizen/:id/memory', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, milestone } = req.body;

    if (!milestone || !milestone.description) {
      return res.status(400).json({
        success: false,
        error: 'Milestone with description is required',
      });
    }

    const citizenAI = getCitizenAI(id, name, role);
    const committed = await citizenAI.recordMilestone(milestone);

    res.json({
      success: true,
      data: committed,
      wasCommitted: Boolean(committed),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/government/evaluate
 * Policy Advisory Assistant: Assess civilization health and recommend governance resolutions
 */
router.post('/government/evaluate', async (req, res, next) => {
  try {
    const { metrics, activeEvents } = req.body;
    const advice = await governmentAI.evaluateGovernance(
      metrics || { population: 1000, stability: 80, happiness: 75 },
      activeEvents || []
    );

    res.json({
      success: true,
      data: advice,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/analyst/diagnostics
 * Macro Analyst Assistant: Produce comprehensive systemic civilization diagnostic report
 */
router.post('/analyst/diagnostics', async (req, res, next) => {
  try {
    const { metrics, economy, social } = req.body;
    const diagnostic = await analystAI.analyzeSystemState(
      metrics || { population: 1000, health: 85, happiness: 80 },
      economy || { gdp: 100000, inflationRate: 0.02, treasury: 50000 },
      social || {}
    );

    res.json({
      success: true,
      data: diagnostic,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
