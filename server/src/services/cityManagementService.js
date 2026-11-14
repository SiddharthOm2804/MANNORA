import { randomUUID } from 'node:crypto';
import { BuildingSystem } from '@neural-city/simulation';
import { World } from '../models/World.js';
import { simulationBridgeService } from './simulationBridgeService.js';
import { eventPublisher } from './eventPublisher.js';

const FACILITIES = {
  agriculture: { type: 'vertical_farm', name: 'Vertical Farm', cost: 18_000, minerals: 80, production: 35 },
  water: { type: 'water_filter', name: 'Water Treatment Facility', cost: 22_000, minerals: 100, production: 40 },
  energy: { type: 'power_plant', name: 'Solar Power Facility', cost: 28_000, minerals: 120, production: 50 },
};
const TRACKED = ['energy', 'water', 'agriculture'];

const stateFor = (world) => simulationBridgeService.getActiveSimulation(String(world._id))?.engine.stateManager.getCurrentState();

export const getCityProblems = (world) => {
  const state = stateFor(world);
  return TRACKED.map((resource) => {
    const stock = state?.resources?.[resource];
    const value = world.resources?.[resource] || 0;
    const population = state?.population?.total ?? world.population ?? 0;
    const defaultConsumption = { energy: 0.03, water: 0.025, agriculture: 0.02 }[resource] * population;
    const production = Number(stock?.production ?? ({ energy: 25, water: 20, agriculture: 15 }[resource]));
    const consumption = Number(stock?.consumption ?? defaultConsumption);
    const available = Number(stock?.current ?? value);
    const net = Number(stock?.net ?? production - consumption);
    const deficit = Math.max(0, consumption - production);
    const active = net < 0 && available <= 0;
    const facility = FACILITIES[resource];
    return { resource, title: `${resource[0].toUpperCase()}${resource.slice(1)} ${active ? 'shortage' : 'supply'}`, active, severity: active && deficit > 20 ? 'high' : active ? 'medium' : net < 0 ? 'pressure' : 'stable', available, production, consumption, deficit, affectedPopulation: null, supportedAction: facility, recommendedAction: active ? `Build a ${facility.name.toLowerCase()} to raise production by about ${facility.production} units per tick.` : null };
  });
};

const overlaps = (point, other, minimum = 9) => Math.hypot(point.x - other.x, point.y - other.y) < minimum;
export const chooseLot = (world) => {
  const blocked = [...(world.buildings || []).map((item) => item.coordinates), ...(world.cities || []).map((item) => item.coordinates || { x: 50, y: 50 })].filter(Boolean);
  // Candidate search occurs only on a confirmed build request, not during rendering.
  for (let radius = 0; radius <= 8; radius++) {
    for (let x = 8; x <= 92; x += 4) for (let y = 8; y <= 92; y += 4) {
      const point = { x, y };
      if (Math.abs(x - 50) < 7 || Math.abs(x - 33) < 6 || Math.abs(x - 67) < 6 || Math.abs(x - 18) < 5 || Math.abs(x - 82) < 5) continue;
      if (Math.abs(y - 50) < 7 || Math.abs(y - 33) < 6 || Math.abs(y - 67) < 6 || Math.abs(y - 18) < 5 || Math.abs(y - 82) < 5) continue;
      if (blocked.some((other) => overlaps(point, other, 9 + radius * 0.25))) continue;
      let hasTree = false;
      for (let treeX = 8; treeX <= 92 && !hasTree; treeX += 7) for (let treeY = 8; treeY <= 92; treeY += 7) {
        const road = [33, 50, 67].some((line) => Math.abs(line - treeX) < 4 || Math.abs(line - treeY) < 4);
        const solarPark = (treeX < 31 && treeY < 31) || (treeX > 69 && treeY > 69);
        const core = treeX > 39 && treeX < 61 && treeY > 39 && treeY < 61;
        if (!road && !solarPark && !core && ((treeX * 3 + treeY * 5) % 4 !== 0) && Math.hypot(point.x - treeX, point.y - treeY) < 5.5) { hasTree = true; break; }
      }
      if (hasTree) continue;
      return point;
    }
  }
  return null;
};

export const buildProductionFacility = async ({ worldId, actorId, resource, role }) => {
  const facility = FACILITIES[resource];
  if (!facility) { const error = new Error('Choose a supported resource: food, water or electricity.'); error.status = 400; throw error; }
  if (role !== 'owner' && role !== 'editor') { const error = new Error('You do not have permission to manage this city.'); error.status = 403; throw error; }

  const world = await World.findById(worldId).lean();
  if (!world) { const error = new Error('World not found.'); error.status = 404; throw error; }
  const point = chooseLot(world);
  if (!point) { const error = new Error('No clear, road-free building lot is available.'); error.status = 409; throw error; }

  const id = `facility_${randomUUID()}`;
  const blueprint = BuildingSystem.createBuilding(id, facility.type, { name: facility.name, coordinates: point });
  const state = stateFor(world);
  const before = {
    treasury: Number(world.economyConfiguration?.startingMoney ?? 0), minerals: Number(world.resources?.minerals ?? 0),
    production: Number(state?.resources?.[resource]?.production ?? 0),
  };
  const accessClause = role === 'owner' ? { ownerId: actorId } : { members: { $elemMatch: { userId: actorId, role: 'editor' } } };
  const recordFailure = async (message) => {
    await World.updateOne({ _id: worldId, ...accessClause }, { $push: { managementHistory: { $each: [{ action: 'facility_build_failed', resource, facilityId: id, actorId, cost: facility.cost, status: 'failed', errorMessage: message, tick: state?.tick || 0, before, after: before }], $slice: -2000 } } });
    eventPublisher.publish(worldId, { type: 'CITY_ACTION_FAILED', tick: state?.tick || 0, payload: { resource, facility: facility.name, actorId: String(actorId), message } });
  };
  if (state && (state.economy.treasury < facility.cost || state.resources.minerals.current < facility.minerals)) {
    const message = 'The active simulation does not have enough funds or minerals for this facility.';
    await recordFailure(message);
    const error = new Error(message); error.status = 409; throw error;
  }
  const updated = await World.findOneAndUpdate({
    _id: worldId,
    ...accessClause,
    'simulationSettings.currentTick': world.simulationSettings?.currentTick ?? 0,
    'economyConfiguration.startingMoney': { $gte: facility.cost },
    'resources.minerals': { $gte: facility.minerals },
  }, {
    $inc: { 'economyConfiguration.startingMoney': -facility.cost, 'resources.minerals': -facility.minerals },
    $push: {
      buildings: blueprint,
      managementHistory: { $each: [{ action: 'facility_built', resource, facilityId: id, actorId, cost: facility.cost, tick: state?.tick || 0, before, after: { treasury: before.treasury - facility.cost, minerals: before.minerals - facility.minerals, production: before.production + facility.production } }], $slice: -2000 },
    },
  }, { new: true, runValidators: true });

  if (!updated) { const message = 'Funds or minerals changed before the action could be applied. Refresh the city data and try again.'; await recordFailure(message); const error = new Error(message); error.status = 409; throw error; }
  if (state) {
    state.economy.treasury -= facility.cost;
    state.resources.minerals.current -= facility.minerals;
    state.metrics.treasury = state.economy.treasury;
    state.metrics.minerals = state.resources.minerals.current;
    state.addBuilding(blueprint);
  }
  eventPublisher.publish(worldId, { type: 'CITY_ACTION', tick: state?.tick || 0, payload: { action: 'facility_built', resource, facility: blueprint.name, actorId: String(actorId), cost: facility.cost, location: point } });
  return { facility: blueprint, cost: facility.cost, mineralsUsed: facility.minerals, previousTreasury: before.treasury, availableTreasury: before.treasury - facility.cost, estimatedProductionIncrease: facility.production, appliedToActiveSimulation: Boolean(state) };
};
