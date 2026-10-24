import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * SimulationCamera provides smooth orbit, zoom, pan, and focus animations:
 * - City wide view
 * - District focus
 * - Building focus
 * - Citizen focus
 */
export function SimulationCamera({
  focusTarget, // { position: [x, y, z], distance?: number }
  controlsRef,
}) {
  const { camera } = useThree();
  const targetLookAt = useRef(new THREE.Vector3(50, 0, 50));
  const targetCamPos = useRef(new THREE.Vector3(50, 75, 115));

  useEffect(() => {
    if (!focusTarget) {
      // Default City Overview
      targetLookAt.current.set(50, 0, 50);
      targetCamPos.current.set(50, 75, 115);
      return;
    }

    const [tx, ty, tz] = focusTarget.position || [50, 0, 50];
    const dist = focusTarget.distance || (focusTarget.type === 'citizen' ? 12 : focusTarget.type === 'building' ? 24 : 45);

    targetLookAt.current.set(tx, ty, tz);
    targetCamPos.current.set(tx, ty + dist * 0.8, tz + dist);
  }, [focusTarget]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    // Smooth lerp camera position and orbit target
    camera.position.lerp(targetCamPos.current, delta * 3.5);
    controlsRef.current.target.lerp(targetLookAt.current, delta * 3.5);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={6}
      maxDistance={220}
      maxPolarAngle={Math.PI / 2.05} // Prevent going beneath ground plane
    />
  );
}

export default SimulationCamera;
