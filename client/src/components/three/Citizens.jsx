import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Citizens renders population agents using high-performance InstancedMesh.
 *
 * DO NOT create thousands of expensive individual meshes if performance suffers.
 * InstancedMesh renders hundreds of citizens in a single draw call.
 */
export function Citizens({
  agents = [],
  selectedCitizen,
  onSelectCitizen,
  onHover,
}) {
  const meshRef = useRef();

  // Color mapping based on occupation
  const occupationColors = useMemo(() => ({
    scientist: new THREE.Color('#8b5cf6'), // violet
    engineer: new THREE.Color('#06b6d4'),  // cyan
    technician: new THREE.Color('#38bdf8'),// sky
    merchant: new THREE.Color('#10b981'),  // emerald
    farmer: new THREE.Color('#84cc16'),    // lime
    entrepreneur: new THREE.Color('#f59e0b'), // amber
    administrator: new THREE.Color('#ec4899'), // pink
    citizen: new THREE.Color('#94a3b8'),   // slate
  }), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update instance matrices and colors whenever agents change
  useEffect(() => {
    if (!meshRef.current || agents.length === 0) return;

    agents.forEach((agent, i) => {
      const x = agent.location?.x ?? (50 + (i % 10) * 2);
      const z = agent.location?.y ?? (50 + Math.floor(i / 10) * 2);

      dummy.position.set(x, 0.45, z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color coding by occupation or status
      const color = occupationColors[agent.occupation] || occupationColors.citizen;
      meshRef.current.setColorAt(i, color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [agents, dummy, occupationColors]);

  // Click Raycaster Handler for InstancedMesh
  const handleClick = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && agents[e.instanceId]) {
      onSelectCitizen(agents[e.instanceId]);
    }
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && agents[e.instanceId]) {
      const agt = agents[e.instanceId];
      onHover({
        type: 'citizen',
        id: agt.id,
        title: agt.name || `Citizen ${agt.id}`,
        badge: (agt.occupation || 'citizen').toUpperCase(),
        action: agt.healthState?.currentAction || 'ACTIVE',
        wealth: `${Math.round(agt.wealth || 100)} NC`,
        happiness: `${Math.round(agt.healthState?.happiness || 100)}%`,
        position: [agt.location?.x ?? 50, 1.8, agt.location?.y ?? 50],
      });
    }
  };

  if (agents.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, agents.length]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
      }}
      castShadow
    >
      {/* Sleek cybernetic citizen capsule */}
      <cylinderGeometry args={[0.3, 0.35, 0.9, 8]} />
      <meshStandardMaterial roughness={0.3} metalness={0.7} />
    </instancedMesh>
  );
}

export default Citizens;
