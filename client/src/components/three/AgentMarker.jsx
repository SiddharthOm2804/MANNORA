import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

/**
 * AgentMarker highlights the actively selected citizen with a floating 3D beacon
 * and animated ground reticle.
 */
export function AgentMarker({ citizen }) {
  const reticleRef = useRef();

  useFrame((_, delta) => {
    if (reticleRef.current) {
      reticleRef.current.rotation.z += delta * 1.5;
    }
  });

  if (!citizen || !citizen.location) return null;

  const x = citizen.location.x ?? 50;
  const z = citizen.location.y ?? 50;

  return (
    <group position={[x, 0, z]}>
      {/* Ground Reticle */}
      <mesh ref={reticleRef} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.1, 16]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
      </mesh>

      {/* Floating Beacon Pointer */}
      <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh position={[0, 2.5, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.35, 0.8, 4]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.8}
            roughness={0.1}
          />
        </mesh>
      </Float>
    </group>
  );
}

export default AgentMarker;
