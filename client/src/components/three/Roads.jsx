import React, { useMemo } from 'react';

/**
 * Roads renders the primary arterial network and intra-district transit grid
 * in NEURAL CITY connecting residential, commercial, industrial, and resource zones.
 */
export function Roads() {
  // Road segments: { x, z, length, width, rotation }
  const roadNetwork = useMemo(() => {
    const roads = [];

    // Main North-South Arterial
    roads.push({ x: 50, z: 50, width: 3.2, length: 110, rotation: 0 });
    // Main East-West Arterial
    roads.push({ x: 50, z: 50, width: 3.2, length: 110, rotation: Math.PI / 2 });

    // Inner Ring Boulevard (around Central Matrix)
    roads.push({ x: 50, z: 33, width: 2.2, length: 36, rotation: Math.PI / 2 });
    roads.push({ x: 50, z: 67, width: 2.2, length: 36, rotation: Math.PI / 2 });
    roads.push({ x: 33, z: 50, width: 2.2, length: 36, rotation: 0 });
    roads.push({ x: 67, z: 50, width: 2.2, length: 36, rotation: 0 });

    // Outer Sector Connectors
    roads.push({ x: 20, z: 30, width: 1.8, length: 24, rotation: Math.PI / 2 });
    roads.push({ x: 80, z: 30, width: 1.8, length: 24, rotation: Math.PI / 2 });
    roads.push({ x: 20, z: 70, width: 1.8, length: 24, rotation: Math.PI / 2 });
    roads.push({ x: 80, z: 70, width: 1.8, length: 24, rotation: Math.PI / 2 });

    return roads;
  }, []);

  return (
    <group position={[0, 0.03, 0]}>
      {roadNetwork.map((road, idx) => (
        <group
          key={idx}
          position={[road.x, 0, road.z]}
          rotation={[-Math.PI / 2, 0, road.rotation]}
        >
          {/* Asphalt surface */}
          <mesh receiveShadow>
            <planeGeometry args={[road.width, road.length]} />
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.7}
              metalness={0.2}
            />
          </mesh>

          {/* Luminous Centerline lane markings */}
          <mesh position={[0, 0, 0.005]}>
            <planeGeometry args={[0.2, road.length * 0.95]} />
            <meshBasicMaterial
              color="#0284c7"
              transparent
              opacity={0.65}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default Roads;
