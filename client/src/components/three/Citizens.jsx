import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Citizens renders population agents using high-performance InstancedMesh.
 *
 * DO NOT create thousands of expensive individual meshes if performance suffers.
 * InstancedMesh renders hundreds of citizens in a single draw call.
 */
export const Citizens = React.memo(function Citizens({
  agents = [],
  selectedCitizen,
  onSelectCitizen,
  onHover,
  showSocial = false,
  showPopulation = true,
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

  // Cap visible instances to maintain 60 FPS even with thousands of agents
  const placedAgents = useMemo(() => agents.filter((agent) => Number.isFinite(Number(agent.location?.x ?? agent.x)) && Number.isFinite(Number(agent.location?.y ?? agent.y))).slice(0, 1500), [agents]);
  const displayLimit = placedAgents.length;

  const socialGeometry = useMemo(() => {
    if (!showSocial) return null;
    const located = new Map(placedAgents.map((agent) => [String(agent.id), [Number(agent.location?.x ?? agent.x), 0.8, Number(agent.location?.y ?? agent.y)]]));
    const vertices = [];
    for (const agent of placedAgents) {
      const from = located.get(String(agent.id));
      for (const [targetId, relation] of Object.entries(agent.relationships || {})) {
        const to = located.get(String(targetId));
        if (!to || String(agent.id) >= String(targetId) || Number(relation?.strength ?? relation?.bond ?? 0) < 0.55) continue;
        vertices.push(new THREE.Vector3(...from), new THREE.Vector3(...to));
        if (vertices.length >= 600) break;
      }
      if (vertices.length >= 600) break;
    }
    if (!vertices.length) return null;
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    return geometry;
  }, [placedAgents, showSocial]);
  useEffect(() => () => socialGeometry?.dispose(), [socialGeometry]);

  // Update instance matrices and colors whenever agents change
  useEffect(() => {
    if (!meshRef.current || displayLimit === 0) return;

    for (let i = 0; i < displayLimit; i++) {
      const agent = placedAgents[i];
      const x = Number(agent.location?.x ?? agent.x);
      const z = Number(agent.location?.y ?? agent.y);

      dummy.position.set(x, 0.45, z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color coding by occupation or status
      const color = occupationColors[agent.occupation] || occupationColors.citizen;
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [placedAgents, displayLimit, dummy, occupationColors]);

  // Click Raycaster Handler for InstancedMesh
  const handleClick = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && placedAgents[e.instanceId]) {
      onSelectCitizen(placedAgents[e.instanceId]);
    }
  };

  const handlePointerOver = (e) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && placedAgents[e.instanceId]) {
      const agt = placedAgents[e.instanceId];
      onHover({
        type: 'citizen',
        id: agt.id,
        title: agt.name || `Citizen ${agt.id}`,
        badge: (agt.occupation || 'citizen').toUpperCase(),
        action: agt.healthState?.currentAction || 'ACTIVE',
        wealth: `${Math.round(agt.wealth || 100)} ₹`,
        happiness: `${Math.round(agt.healthState?.happiness || 100)}%`,
        position: [agt.location?.x ?? 50, 1.8, agt.location?.y ?? 50],
      });
    }
  };

  if (displayLimit === 0 && !socialGeometry) return null;

  return (
    <group>
    {socialGeometry && <lineSegments geometry={socialGeometry}><lineBasicMaterial color="#e1a9bf" transparent opacity={0.45} /></lineSegments>}
    {showPopulation && displayLimit > 0 && <instancedMesh
      ref={meshRef}
      args={[null, null, displayLimit]}
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
    </instancedMesh>}
    </group>
  );
});

export default Citizens;
