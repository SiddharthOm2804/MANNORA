import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

function NeuralCore() {
  const meshRef = useRef();
  const wireframeRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.25;
      meshRef.current.rotation.x += delta * 0.15;
    }
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y -= delta * 0.2;
      wireframeRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <group>
      {/* Inner glowing core */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#0891b2"
            emissiveIntensity={0.6}
            wireframe={true}
            roughness={0.2}
          />
        </mesh>
      </Float>

      {/* Outer neural geodesic wireframe */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
        <mesh ref={wireframeRef}>
          <icosahedronGeometry args={[2.2, 1]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#7c3aed"
            emissiveIntensity={0.4}
            wireframe={true}
            transparent={true}
            opacity={0.6}
          />
        </mesh>
      </Float>

      {/* Grid rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <ringGeometry args={[1.8, 2.8, 32]} />
        <meshBasicMaterial color="#1e293b" wireframe={true} transparent={true} opacity={0.4} />
      </mesh>
    </group>
  );
}

export default function NeuralCityCanvas() {
  return (
    <div className="w-full h-full min-h-[300px] relative pointer-events-none sm:pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#06b6d4" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#8b5cf6" />
        <NeuralCore />
      </Canvas>
    </div>
  );
}
