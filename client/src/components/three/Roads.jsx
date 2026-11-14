import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/** Light neighborhood streets batched as instanced planes to keep draw calls low. */
export function Roads() {
  const sidewalks = useRef();
  const asphalt = useRef();
  const centerLines = useRef();
  const roads = useMemo(() => [
    { x: 50, z: 50, width: 5.2, length: 126, rotation: 0, arterial: true },
    { x: 50, z: 50, width: 5.2, length: 126, rotation: Math.PI / 2, arterial: true },
    { x: 33, z: 50, width: 3, length: 118, rotation: 0 },
    { x: 67, z: 50, width: 3, length: 118, rotation: 0 },
    { x: 50, z: 33, width: 3, length: 118, rotation: Math.PI / 2 },
    { x: 50, z: 67, width: 3, length: 118, rotation: Math.PI / 2 },
    { x: 18, z: 50, width: 2.1, length: 90, rotation: 0 },
    { x: 82, z: 50, width: 2.1, length: 90, rotation: 0 },
    { x: 50, z: 18, width: 2.1, length: 90, rotation: Math.PI / 2 },
    { x: 50, z: 82, width: 2.1, length: 90, rotation: Math.PI / 2 },
  ], []);
  const arterialRoads = useMemo(() => roads.filter((road) => road.arterial), [roads]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    roads.forEach((road, index) => {
      dummy.position.set(road.x, 0.11, road.z);
      dummy.rotation.set(-Math.PI / 2, 0, road.rotation);
      dummy.scale.set(road.width + 1.25, road.length, 1);
      dummy.updateMatrix();
      sidewalks.current?.setMatrixAt(index, dummy.matrix);
      dummy.position.y = 0.125;
      dummy.scale.set(road.width, road.length, 1);
      dummy.updateMatrix();
      asphalt.current?.setMatrixAt(index, dummy.matrix);
    });
    arterialRoads.forEach((road, index) => {
      dummy.position.set(road.x, 0.14, road.z);
      dummy.rotation.set(-Math.PI / 2, 0, road.rotation);
      dummy.scale.set(0.12, road.length * 0.94, 1);
      dummy.updateMatrix();
      centerLines.current?.setMatrixAt(index, dummy.matrix);
    });
    [sidewalks.current, asphalt.current, centerLines.current].forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
  }, [roads, arterialRoads]);

  return <group>
    <instancedMesh ref={sidewalks} args={[null, null, roads.length]} receiveShadow>
      <planeGeometry args={[1, 1]} /><meshStandardMaterial color="#d9d3bd" roughness={1} />
    </instancedMesh>
    <instancedMesh ref={asphalt} args={[null, null, roads.length]} receiveShadow>
      <planeGeometry args={[1, 1]} /><meshStandardMaterial color="#596062" roughness={0.93} />
    </instancedMesh>
    <instancedMesh ref={centerLines} args={[null, null, arterialRoads.length]}>
      <planeGeometry args={[1, 1]} /><meshBasicMaterial color="#eee7cf" transparent opacity={0.82} />
    </instancedMesh>
  </group>;
}

export default Roads;
