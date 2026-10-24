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
          economicCrisis ? '#0a0f18' : activeEvent ? '#1e1022' : '#080a11',
          70,
          240,
        ]}
      />

      {/* 2. Major Event Aura (e.g. Solar Storm or Crisis) */}
      {activeEvent && (
        <group position={[50, 25, 50]}>
          <mesh ref={stormRingRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[45, 48, 64]} />
            <meshBasicMaterial
              color="#f43f5e"
              transparent
              opacity={0.35}
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
              color="#fbbf24"
              transparent
              opacity={0.15}
              wireframe
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default WorldEffects;
