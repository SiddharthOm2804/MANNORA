import React, { useRef, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import CityEnvironment from './CityEnvironment';
import Roads from './Roads';
import Buildings from './Buildings';
import Citizens from './Citizens';
import AgentMarker from './AgentMarker';
import ResourceNodes from './ResourceNodes';
import SimulationCamera from './SimulationCamera';
import CityLighting from './CityLighting';
import WorldEffects from './WorldEffects';
import LoadingWorld from './LoadingWorld';

/**
 * CityScene is the primary 3D WebGL orchestration layer for NEURAL CITY.
 *
 * IMPORTANT:
 * - This 3D layer is purely a VISUALIZATION layer.
 * - SimulationEngine remains the single source of truth.
 * - Day/night lighting responds to SimulationClock hour.
 * - Hierarchical focus: City → District → Building → Citizen.
 */
export function CityScene({
  worldState,
  agents = [],
  buildings = [],
  resources = {},
  clockHour = 12,
  deficits = {},
  economicCrisis = false,
  activeEvent = null,
  selectedEntity,
  onSelectEntity,
  isLoading = false,
}) {
  const controlsRef = useRef();
  const [hoveredEntity, setHoveredEntity] = useState(null);

  // Focus target calculation for SimulationCamera
  const focusTarget = useMemo(() => {
    if (!selectedEntity) return null;

    if (selectedEntity.type === 'citizen' && selectedEntity.data?.location) {
      return {
        type: 'citizen',
        position: [selectedEntity.data.location.x ?? 50, 0, selectedEntity.data.location.y ?? 50],
        distance: 14,
      };
    }

    if (selectedEntity.type === 'building' && selectedEntity.data?.coordinates) {
      return {
        type: 'building',
        position: [selectedEntity.data.coordinates.x ?? 50, 0, selectedEntity.data.coordinates.y ?? 50],
        distance: 26,
      };
    }

    if (selectedEntity.type === 'district' && selectedEntity.data?.bounds) {
      return {
        type: 'district',
        position: [selectedEntity.data.bounds.x, 0, selectedEntity.data.bounds.z],
        distance: 52,
      };
    }

    return null;
  }, [selectedEntity]);

  return (
    <div className="w-full h-full min-h-[460px] relative bg-[#080a11] overflow-hidden select-none">
      {isLoading && <LoadingWorld />}

      {/* Lightweight Hover HUD tooltip */}
      {hoveredEntity && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none p-3 rounded-lg bg-[#090b14]/90 border border-slate-700/80 shadow-2xl backdrop-blur-md max-w-xs space-y-1 font-mono text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-white tracking-wide truncate">
              {hoveredEntity.title}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
              {hoveredEntity.badge}
            </span>
          </div>

          {hoveredEntity.description && (
            <p className="text-[11px] text-slate-300 font-sans leading-tight">
              {hoveredEntity.description}
            </p>
          )}

          {hoveredEntity.workers && (
            <div className="text-[10px] text-slate-400">
              Capacity: <span className="text-slate-200">{hoveredEntity.workers}</span>
            </div>
          )}

          {hoveredEntity.action && (
            <div className="text-[10px] text-cyan-400">
              Current Action: <span className="font-semibold">{hoveredEntity.action}</span>
            </div>
          )}

          {hoveredEntity.wealth && (
            <div className="text-[10px] text-emerald-400">
              Liquid Wealth: {hoveredEntity.wealth}
            </div>
          )}

          {hoveredEntity.status && (
            <div className="text-[10px] text-amber-400 font-semibold">
              {hoveredEntity.status}
            </div>
          )}
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [50, 75, 115], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerMissed={() => onSelectEntity(null)}
      >
        {/* Dynamic Diurnal Lighting based on SimulationClock */}
        <CityLighting
          hour={clockHour}
          deficits={deficits}
          economicCrisis={economicCrisis}
          activeEvent={activeEvent}
        />

        {/* Camera with smooth Orbit/Pan/Focus */}
        <SimulationCamera
          focusTarget={focusTarget}
          controlsRef={controlsRef}
        />

        {/* Environmental Fog and Event Auras */}
        <WorldEffects
          deficits={deficits}
          economicCrisis={economicCrisis}
          activeEvent={activeEvent}
        />

        {/* 1. Base Terrain & Districts */}
        <CityEnvironment
          selectedDistrict={selectedEntity?.type === 'district' ? selectedEntity.data : null}
          onSelectDistrict={(district) =>
            onSelectEntity(district ? { type: 'district', data: district } : null)
          }
          onHover={setHoveredEntity}
          deficits={deficits}
          economicCrisis={economicCrisis}
          activeEvent={activeEvent}
        />

        {/* 2. Arterial Road Network */}
        <Roads />

        {/* 3. Resource Wells & Towers */}
        <ResourceNodes
          resources={resources}
          deficits={deficits}
          onHover={setHoveredEntity}
        />

        {/* 4. Infrastructure & Buildings */}
        <Buildings
          buildings={buildings}
          selectedBuilding={selectedEntity?.type === 'building' ? selectedEntity.data : null}
          onSelectBuilding={(building) =>
            onSelectEntity({ type: 'building', data: building })
          }
          onHover={setHoveredEntity}
          deficits={deficits}
          economicCrisis={economicCrisis}
        />

        {/* 5. Instanced Population Citizens */}
        <Citizens
          agents={agents}
          selectedCitizen={selectedEntity?.type === 'citizen' ? selectedEntity.data : null}
          onSelectCitizen={(citizen) =>
            onSelectEntity({ type: 'citizen', data: citizen })
          }
          onHover={setHoveredEntity}
        />

        {/* 6. Active Agent Marker */}
        {selectedEntity?.type === 'citizen' && (
          <AgentMarker citizen={selectedEntity.data} />
        )}
      </Canvas>
    </div>
  );
}

export default CityScene;
