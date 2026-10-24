import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Buildings component visualizes commercial, industrial, residential, and civic buildings
 * from the simulation world.
 *
 * Incorporates:
 * - Specific architectural themes per category (high-density glass, modular habitats, heavy industry)
 * - Visual warning states when in deficit or economic crisis
 * - Interactive click & hover focus
 */
export function Buildings({
  buildings = [],
  selectedBuilding,
  onSelectBuilding,
  onHover,
  deficits = {},
  economicCrisis = false,
}) {
  // Category aesthetic mappings
  const categoryStyles = {
    commercial: {
      color: '#0284c7', // sky
      emissive: '#0369a1',
      roofColor: '#38bdf8',
      baseHeight: 8.0,
      width: 4.5,
      depth: 4.5,
    },
    industrial: {
      color: '#d97706', // amber
      emissive: '#78350f',
      roofColor: '#f59e0b',
      baseHeight: 5.0,
      width: 6.0,
      depth: 5.0,
    },
    residential: {
      color: '#059669', // emerald
      emissive: '#064e3b',
      roofColor: '#10b981',
      baseHeight: 6.5,
      width: 4.0,
      depth: 4.0,
    },
    power_plant: {
      color: '#ea580c', // orange/fusion
      emissive: '#9a3412',
      roofColor: '#fb923c',
      baseHeight: 7.0,
      width: 5.5,
      depth: 5.5,
    },
    research_lab: {
      color: '#7c3aed', // violet
      emissive: '#4c1d95',
      roofColor: '#a78bfa',
      baseHeight: 9.0,
      width: 4.5,
      depth: 4.5,
    },
  };

  return (
    <group>
      {buildings.map((b) => {
        const typeKey = b.type || b.category || 'commercial';
        const style = categoryStyles[typeKey] || categoryStyles.commercial;
        const level = b.level || 1;
        const height = style.baseHeight + (level - 1) * 2.5;
        const isSelected = selectedBuilding?.id === b.id;

        // Visual warning state: if energy deficit or low health
        const isWarning = (deficits.energy && (typeKey === 'industrial' || typeKey === 'commercial')) || (b.health && b.health < 40);

        const buildingColor = isWarning ? '#e11d48' : style.color;
        const emissiveColor = isSelected ? '#38bdf8' : isWarning ? '#9f1239' : style.emissive;

        return (
          <group
            key={b.id}
            position={[b.coordinates?.x ?? 50, 0, b.coordinates?.y ?? 50]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBuilding(b);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover({
                type: 'building',
                id: b.id,
                title: b.name || `${typeKey.toUpperCase()} Hub`,
                badge: typeKey.toUpperCase(),
                level: `Level ${level}`,
                workers: `${b.workers || 0} / ${b.capacity || 50} Workers`,
                efficiency: `${Math.round((b.efficiency || 1.0) * 100)}%`,
                health: `${Math.round(b.health || 100)}%`,
                position: [b.coordinates?.x ?? 50, height + 2, b.coordinates?.y ?? 50],
              });
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              onHover(null);
            }}
          >
            {/* Main Building Monolith */}
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[style.width, height, style.depth]} />
              <meshStandardMaterial
                color={buildingColor}
                emissive={emissiveColor}
                emissiveIntensity={isSelected ? 0.7 : isWarning ? 0.5 : 0.25}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>

            {/* Glowing Roof Beacon / Heli-Pad */}
            <mesh position={[0, height + 0.1, 0]}>
              <boxGeometry args={[style.width * 0.7, 0.2, style.depth * 0.7]} />
              <meshBasicMaterial
                color={isSelected ? '#38bdf8' : style.roofColor}
              />
            </mesh>

            {/* Selection Aura Ring */}
            {isSelected && (
              <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[style.width * 0.8, style.width * 1.1, 32]} />
                <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default Buildings;
