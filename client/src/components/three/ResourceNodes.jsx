import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * ResourceNodes visualizes civilization resource wells, energy grid towers,
 * and reservoir bio-basins in NEURAL CITY.
 *
 * Visually reflects scarcity:
 * When resources are in deficit, nodes flash warning auras.
 */
export function ResourceNodes({
  resources = {},
  deficits = {},
  onHover,
}) {
  const nodes = useMemo(() => [
    {
      id: 'res_node_solar',
      name: 'Solar-Fusion Power Relay',
      resourceKey: 'energy',
      position: [20, 0, 20],
      color: '#f59e0b',
      icon: '⚡',
      type: 'TOWER',
    },
    {
      id: 'res_node_hydro',
      name: 'Aquifer Biosphere Reservoir',
      resourceKey: 'water',
      position: [50, 0, 85],
      color: '#06b6d4',
      icon: '💧',
      type: 'BASIN',
    },
    {
      id: 'res_node_agro',
      name: 'Synthetic Hydroponic Delta',
      resourceKey: 'agriculture',
      position: [35, 0, 80],
      color: '#10b981',
      icon: '🌾',
      type: 'DOME',
    },
    {
      id: 'res_node_mine',
      name: 'Sub-Crust Mineral Extraction Well',
      resourceKey: 'minerals',
      position: [85, 0, 25],
      color: '#eab308',
      icon: '⛏️',
      type: 'DERRICK',
    },
    {
      id: 'res_node_quantum',
      name: 'Quantum Logic Synthesis Array',
      resourceKey: 'technology',
      position: [20, 0, 75],
      color: '#8b5cf6',
      icon: '🔬',
      type: 'PYRAMID',
    },
  ], []);

  return (
    <group>
      {nodes.map((node) => {
        const isDeficit = Boolean(deficits[node.resourceKey]);
        const resData = resources[node.resourceKey] || {};
        const current = resData.current || 3000;
        const max = resData.max || 10000;
        const fillPct = Math.round((current / max) * 100);

        return (
          <group
            key={node.id}
            position={node.position}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover({
                type: 'resource_node',
                title: node.name,
                badge: `${node.resourceKey.toUpperCase()} FACILITY`,
                description: `Buffer Level: ${current.toLocaleString()} / ${max.toLocaleString()} (${fillPct}%)`,
                status: isDeficit ? 'DEFICIT CRITICAL' : 'OPTIMAL EXTRACTION',
                position: [node.position[0], 6, node.position[2]],
              });
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              onHover(null);
            }}
          >
            {/* Core Extractor Mesh */}
            {node.type === 'TOWER' && (
              <mesh position={[0, 4, 0]} castShadow>
                <cylinderGeometry args={[0.8, 1.8, 8, 8]} />
                <meshStandardMaterial
                  color={isDeficit ? '#f43f5e' : node.color}
                  emissive={isDeficit ? '#9f1239' : node.color}
                  emissiveIntensity={isDeficit ? 0.8 : 0.4}
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>
            )}

            {node.type === 'BASIN' && (
              <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[4.5, 4.5, 0.8, 24]} />
                <meshStandardMaterial
                  color={isDeficit ? '#f43f5e' : node.color}
                  roughness={0.1}
                  metalness={0.9}
                  transparent
                  opacity={0.85}
                />
              </mesh>
            )}

            {node.type === 'DOME' && (
              <mesh position={[0, 2, 0]} castShadow>
                <sphereGeometry args={[3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial
                  color={isDeficit ? '#f43f5e' : node.color}
                  roughness={0.2}
                  transparent
                  opacity={0.7}
                  wireframe={false}
                />
              </mesh>
            )}

            {node.type === 'DERRICK' && (
              <mesh position={[0, 3.5, 0]} castShadow>
                <coneGeometry args={[2.5, 7, 4]} />
                <meshStandardMaterial
                  color={isDeficit ? '#f43f5e' : node.color}
                  metalness={0.7}
                  roughness={0.3}
                />
              </mesh>
            )}

            {node.type === 'PYRAMID' && (
              <mesh position={[0, 3, 0]} castShadow>
                <octahedronGeometry args={[3, 0]} />
                <meshStandardMaterial
                  color={isDeficit ? '#f43f5e' : node.color}
                  emissive={node.color}
                  emissiveIntensity={0.5}
                  roughness={0.1}
                  wireframe={true}
                />
              </mesh>
            )}

            {/* Warning Beacon if Resource in Deficit */}
            {isDeficit && (
              <mesh position={[0, 8, 0]}>
                <sphereGeometry args={[0.5, 8, 8]} />
                <meshBasicMaterial color="#f43f5e" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default ResourceNodes;
