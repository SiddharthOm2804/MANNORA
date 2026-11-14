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
import { Html } from '@react-three/drei';

/**
 * CityScene is the primary 3D WebGL orchestration layer for NEURAL CITY.
 *
 * IMPORTANT:
 * - This 3D layer is purely a VISUALIZATION layer.
 * - SimulationEngine remains the single source of truth.
 * - Day/night lighting responds to SimulationClock hour.
 * - Hierarchical focus: City → District → Building → Citizen.
 */
export const CityScene = React.memo(function CityScene({
  worldState,
  agents = [],
  buildings = [],
  events = [],
  resources = {},
  clockHour = 12,
  deficits = {},
  economicCrisis = false,
  activeEvent = null,
  selectedEntity,
  onSelectEntity,
  isLoading = false,
  visibleLayers = ['population', 'economy', 'resources', 'infrastructure', 'social', 'events'],
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

    if (['building', 'resource_node', 'event', 'city'].includes(selectedEntity.type) && (selectedEntity.data?.coordinates || selectedEntity.data?.payload?.location)) {
      const coords = selectedEntity.data?.coordinates || selectedEntity.data?.payload?.location;
      return {
        type: 'building',
        position: [coords.x ?? 50, 0, coords.y ?? 50],
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
    <div className="w-full h-full min-h-[460px] relative overflow-hidden select-none" style={{ background: '#b9dfd2' }}>
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
        dpr={[1, 1.5]}
        camera={{ position: [148, 144, 148], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerMissed={() => onSelectEntity(null)}
      >
        <color attach="background" args={['#95d4d3']} />
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
          selectedDistrict={['district', 'city'].includes(selectedEntity?.type) ? selectedEntity.data : null}
          onSelectDistrict={(district) =>
            onSelectEntity(district ? { type: district.isCity ? 'city' : 'district', data: district } : null)
          }
          onHover={setHoveredEntity}
          deficits={deficits}
          economicCrisis={economicCrisis}
          activeEvent={activeEvent}
          showResources={visibleLayers.includes('resources')}
          showInfrastructure={visibleLayers.includes('infrastructure')}
          cities={worldState?.cities || []}
          buildings={buildings}
        />

        {/* 2. Arterial Road Network */}
        {visibleLayers.includes('infrastructure') && <Roads />}

        {/* 3. Resource Wells & Towers */}
        {visibleLayers.includes('resources') && <ResourceNodes
          buildings={buildings}
          resources={resources}
          deficits={deficits}
          onHover={setHoveredEntity}
          onSelect={(building) => onSelectEntity({ type: 'resource_node', data: building })}
        />}

        {/* 4. Infrastructure & Buildings */}
        {(visibleLayers.includes('infrastructure') || visibleLayers.includes('economy')) && <Buildings
          buildings={buildings}
          selectedBuilding={['building', 'resource_node'].includes(selectedEntity?.type) ? selectedEntity.data : null}
          onSelectBuilding={(building) =>
            onSelectEntity({ type: 'building', data: building })
          }
          onHover={setHoveredEntity}
          deficits={deficits}
          economicCrisis={economicCrisis}
          showEconomy={visibleLayers.includes('economy')}
          showInfrastructure={visibleLayers.includes('infrastructure')}
        />}

        {/* 5. Instanced Population Citizens */}
        {(visibleLayers.includes('population') || visibleLayers.includes('social')) && <Citizens
          agents={agents}
          selectedCitizen={selectedEntity?.type === 'citizen' ? selectedEntity.data : null}
          onSelectCitizen={(citizen) =>
            onSelectEntity({ type: 'citizen', data: citizen })
          }
          onHover={setHoveredEntity}
          showSocial={visibleLayers.includes('social')}
          showPopulation={visibleLayers.includes('population')}
        />}

        {/* 6. Active Agent Marker */}
        {selectedEntity?.type === 'citizen' && (
          <AgentMarker citizen={selectedEntity.data} />
        )}

        {visibleLayers.includes('events') && events.filter((event) => Number.isFinite(event.payload?.location?.x) && Number.isFinite(event.payload?.location?.y)).slice(0, 8).map((event, index) => (
          <group key={`${event.type}-${event.tick}-${index}`} position={[event.payload.location.x, 1.2 + index * 0.15, event.payload.location.y]}>
            <mesh onClick={(click) => { click.stopPropagation(); onSelectEntity({ type: 'event', data: event }); }}>
              <sphereGeometry args={[0.8, 12, 10]} /><meshBasicMaterial color="#eb805e" />
            </mesh>
            <Html center distanceFactor={105} style={{ pointerEvents: 'none' }}><span className="scene-event-label">{event.payload.facility || event.type.replaceAll('_', ' ')}</span></Html>
          </group>
        ))}
      </Canvas>
    </div>
  );
});

export default CityScene;
