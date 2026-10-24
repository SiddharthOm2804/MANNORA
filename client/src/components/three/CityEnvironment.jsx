import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * CityEnvironment renders terrain, district zoning planes, parks,
 * and atmospheric boundary indicators in NEURAL CITY.
 *
 * Visual state responds dynamically to:
 * - Resource shortages (subtle warning pulse on terrain border)
 * - Economic crisis (desaturated or amber ambient tint)
 * - Major events (environmental aura)
 */
export function CityEnvironment({
  selectedDistrict,
  onSelectDistrict,
  onHover,
  deficits = {},
  economicCrisis = false,
  activeEvent = null,
}) {
  // Districts layout across the 100x100 city space
  const districts = useMemo(() => [
    {
      id: 'dist_downtown',
      name: 'Central Matrix // Core',
      type: 'commercial',
      bounds: { x: 50, z: 50, width: 34, depth: 34 },
      color: '#0ea5e9', // cyan
      fillColor: '#0369a1',
      description: 'High-density commercial markets, executive councils, and quantum data banks.',
    },
    {
      id: 'dist_residential_north',
      name: 'North Terraces Arcology',
      type: 'residential',
      bounds: { x: 50, z: 20, width: 44, depth: 22 },
      color: '#10b981', // emerald
      fillColor: '#047857',
      description: 'Multi-tiered residential biospheres, gardens, and communal living pods.',
    },
    {
      id: 'dist_industrial_east',
      name: 'East Synthesis Sector',
      type: 'industrial',
      bounds: { x: 80, z: 50, width: 22, depth: 40 },
      color: '#f59e0b', // amber
      fillColor: '#b45309',
      description: 'Automated fabrication plants, mineral refineries, and freight nodes.',
    },
    {
      id: 'dist_biotech_south',
      name: 'South Hydro & Bio-Park',
      type: 'park',
      bounds: { x: 50, z: 80, width: 42, depth: 22 },
      color: '#14b8a6', // teal
      fillColor: '#0f766e',
      description: 'Regenerative agro-domes, water purification basins, and biosphere reserves.',
    },
    {
      id: 'dist_tech_west',
      name: 'West Cybernetics Corridor',
      type: 'technology',
      bounds: { x: 20, z: 50, width: 22, depth: 40 },
      color: '#8b5cf6', // violet
      fillColor: '#6d28d9',
      description: 'Fusion generator relays, AI cognitive labs, and satellite telemetry uplinks.',
    },
  ], []);

  // Terrain base color adjusting for environmental health
  const terrainColor = useMemo(() => {
    if (activeEvent?.category === 'environmental') return '#151020';
    if (deficits.water || deficits.agriculture) return '#181210';
    if (economicCrisis) return '#10141b';
    return '#090d16';
  }, [activeEvent, deficits, economicCrisis]);

  const gridColor = useMemo(() => {
    if (deficits.energy) return '#78350f'; // amber warning grid
    if (deficits.water || deficits.agriculture) return '#831843'; // rose warning grid
    if (economicCrisis) return '#475569';
    return '#1e293b';
  }, [deficits, economicCrisis]);

  return (
    <group>
      {/* 1. Base Terrain Mesh */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[50, -0.05, 50]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelectDistrict(null);
        }}
      >
        <planeGeometry args={[140, 140, 1, 1]} />
        <meshStandardMaterial
          color={terrainColor}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* 2. Precision City Boundary Grid */}
      <gridHelper
        args={[120, 24, gridColor, gridColor]}
        position={[50, 0.01, 50]}
      />

      {/* 3. District Zoning Foundations */}
      {districts.map((d) => {
        const isSelected = selectedDistrict?.id === d.id;

        return (
          <group key={d.id} position={[d.bounds.x, 0.02, d.bounds.z]}>
            {/* Ground Zoning Plane */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                onSelectDistrict(d);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                onHover({
                  type: 'district',
                  title: d.name,
                  badge: d.type.toUpperCase(),
                  description: d.description,
                  position: [d.bounds.x, 2, d.bounds.z],
                });
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                onHover(null);
              }}
            >
              <planeGeometry args={[d.bounds.width, d.bounds.depth]} />
              <meshStandardMaterial
                color={isSelected ? d.color : d.fillColor}
                transparent
                opacity={isSelected ? 0.35 : 0.15}
                roughness={0.6}
              />
            </mesh>

            {/* Perimeter District Outline */}
            <lineSegments position={[0, 0.04, 0]}>
              <edgesGeometry
                args={[new THREE.BoxGeometry(d.bounds.width, 0.1, d.bounds.depth)]}
              />
              <lineBasicMaterial
                color={isSelected ? '#38bdf8' : d.color}
                linewidth={isSelected ? 2 : 1}
                transparent
                opacity={isSelected ? 0.9 : 0.5}
              />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}

export default CityEnvironment;
