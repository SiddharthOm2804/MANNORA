import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * WorldEffects renders environmental atmosphere particles,
 * disaster event auras (solar storms, heat waves), and economic crisis alerts.
 */
export function WorldEffects({
  deficits = {},
  economicCrisis = false,
  activeEvent = null,
}) {
  const stormRingRef = useRef();
  const alertAuraRef = useRef();

  useFrame((_, delta) => {
    if (stormRingRef.current) {
      stormRingRef.current.rotation.z += delta * 0.8;
    }
    if (alertAuraRef.current) {
      alertAuraRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group>
      {/* 1. Atmospheric Fog */}
      <fog
        attach="fog"
        args={[
          economicCrisis ? '#ddc1a9' : activeEvent ? '#d5d9bf' : '#95d4d3',
          145,
          300,
        ]}
      />

      {/* 2. Major Event Aura (e.g. Solar Storm or Crisis) */}
      {activeEvent && (
        <group position={[50, 25, 50]}>
          <mesh ref={stormRingRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[45, 48, 64]} />
            <meshBasicMaterial
              color="#e97958"
              transparent
              opacity={0.24}
            />
          </mesh>
        </group>
      )}

      {/* 3. Resource Deficit System Warning Shield */}
      {(deficits.energy || deficits.water || deficits.agriculture) && (
        <group position={[50, 0.5, 50]}>
          <mesh ref={alertAuraRef}>
            <cylinderGeometry args={[58, 58, 2, 32, 1, true]} />
            <meshBasicMaterial
              color="#d5ad55"
              transparent
              opacity={0.1}
              wireframe
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default WorldEffects;
