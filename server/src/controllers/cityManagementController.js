import { getCityProblems, buildProductionFacility } from '../services/cityManagementService.js';

export const listCityProblems = (req, res) => res.json({ success: true, data: getCityProblems(req.world), mode: 'manual' });
export const getCityActionHistory = (req, res) => res.json({ success: true, data: (req.world.managementHistory || []).slice(-50).reverse() });

export const applyCityAction = async (req, res, next) => {
  try {
    const result = await buildProductionFacility({ worldId: req.params.id, actorId: req.user._id, role: req.worldRole, resource: req.body?.resource });
    return res.status(201).json({ success: true, message: `${result.facility.name} added to the simulation.`, data: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return next(error);
  }
};
