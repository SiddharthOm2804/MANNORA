import React, { useMemo } from 'react';
import * as THREE from 'three';

const houseColors = ['#f1ead5', '#dce8dc', '#f5e2c7', '#d7e4e6', '#eadce1'];
const glassColors = ['#8fc9ca', '#83b8c3', '#a2cbd0'];

function GableRoof({ width, depth, wallHeight, color }) {
  const shape = useMemo(() => {
    const roof = new THREE.Shape();
    roof.moveTo(-width / 2 - 0.45, 0);
    roof.lineTo(width / 2 + 0.45, 0);
    roof.lineTo(0, 2.5);
    roof.closePath();
    return roof;
  }, [width]);
  return <mesh position={[0, wallHeight, -depth / 2 - 0.28]} castShadow receiveShadow>
    <extrudeGeometry args={[shape, { depth: depth + 0.56, bevelEnabled: false, steps: 1 }]} />
    <meshStandardMaterial color={color} roughness={0.86} />
  </mesh>;
}

function Home({ style, level, index }) {
  const wallHeight = 3.4 + (level > 2 ? 0.5 : 0);
  const w = style.width;
  const d = style.depth;
  const windowColor = '#75b7c0';
  return <group>
    <mesh position={[0, 0.08, 0]} receiveShadow>
      <boxGeometry args={[w + 2.8, 0.12, d + 3.2]} /><meshStandardMaterial color={index % 2 ? '#94c77c' : '#a3cc83'} roughness={1} />
    </mesh>
    {/* Bright plaster facade */}
    <mesh position={[0, wallHeight / 2 + 0.14, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, wallHeight, d]} /><meshStandardMaterial color={style.color} roughness={0.88} />
    </mesh>
    <GableRoof width={w} depth={d} wallHeight={wallHeight + 0.14} color={style.roofColor} />
    {/* Street-facing windows and entry */}
    {[-1, 1].map((side) => <mesh key={side} position={[side * 0.94, 1.85, -d / 2 - 0.035]}>
      <boxGeometry args={[0.76, 0.96, 0.08]} /><meshStandardMaterial color={windowColor} roughness={0.32} metalness={0.08} />
    </mesh>)}
    <mesh position={[0, 0.93, -d / 2 - 0.06]}>
      <boxGeometry args={[0.68, 1.58, 0.12]} /><meshStandardMaterial color="#8b684f" roughness={0.9} />
    </mesh>
    <mesh position={[0, 2.48, -d / 2 - 0.04]}>
      <boxGeometry args={[w * 0.77, 0.12, 0.08]} /><meshStandardMaterial color="#f8f1df" roughness={1} />
    </mesh>
  </group>;
}

function Tower({ style, height, index }) {
  const floors = Math.max(3, Math.round(height / 2.1));
  return <group>
    <mesh position={[0, height / 2 + 0.16, 0]} castShadow receiveShadow>
      <boxGeometry args={[style.width, height, style.depth]} />
      <meshStandardMaterial color={glassColors[index % glassColors.length]} roughness={0.32} metalness={0.12} />
    </mesh>
    {Array.from({ length: floors }, (_, floor) => <mesh key={floor} position={[0, 0.5 + floor * (height / floors), -style.depth / 2 - 0.025]}>
      <boxGeometry args={[style.width * 0.84, 0.09, 0.045]} /><meshStandardMaterial color="#e6f1dc" roughness={0.5} />
    </mesh>)}
    <mesh position={[0, height + 0.28, 0]} castShadow>
      <boxGeometry args={[style.width + 0.7, 0.38, style.depth + 0.7]} /><meshStandardMaterial color="#f1ead9" roughness={0.8} />
    </mesh>
    <mesh position={[0, height + 0.5, 0]}>
      <boxGeometry args={[style.width * 0.55, 0.08, style.depth * 0.55]} /><meshStandardMaterial color="#3c7884" metalness={0.24} roughness={0.4} />
    </mesh>
  </group>;
}

function Warehouse({ style, height }) {
  return <group>
    <mesh position={[0, height / 2 + 0.12, 0]} castShadow receiveShadow>
      <boxGeometry args={[style.width, height, style.depth]} /><meshStandardMaterial color={style.color} roughness={0.9} />
    </mesh>
    <mesh position={[0, height + 0.18, 0]} castShadow>
      <boxGeometry args={[style.width + 0.45, 0.34, style.depth + 0.45]} /><meshStandardMaterial color="#d8d2bd" roughness={0.88} />
    </mesh>
    <mesh position={[0, 1.1, -style.depth / 2 - 0.05]}>
      <boxGeometry args={[style.width * 0.42, 1.7, 0.1]} /><meshStandardMaterial color="#7e9ea0" roughness={0.6} />
    </mesh>
  </group>;
}

/** Low-rise homes, civic towers, and clean workshop blocks on planted city lots. */
export function Buildings({ buildings = [], selectedBuilding, onSelectBuilding, onHover, deficits = {}, showEconomy = false, showInfrastructure = true }) {
  return <group>
    {buildings.map((building, index) => {
      const type = building.type || building.category || 'residential';
      const isHome = type === 'residential' || type === 'park' || type === 'citizen';
      const isWarehouse = type === 'industrial' || type === 'power_plant';
      const style = isHome ? {
        color: houseColors[index % houseColors.length], roofColor: ['#49505a', '#535966', '#5e4e48'][index % 3], width: 4.4, depth: 4.2,
      } : isWarehouse ? {
        color: '#e2d8bf', roofColor: '#5a6661', width: 6.7, depth: 5.6,
      } : {
        color: '#94c8c4', roofColor: '#e7e3d4', width: type === 'commercial' ? 5.4 : 4.8, depth: 4.8,
      };
      const level = building.level || 1;
      const height = isHome ? 3.4 + (level > 2 ? 0.5 : 0) : isWarehouse ? 4.5 : 7 + Math.min(level, 4) * 1.8;
      const isSelected = selectedBuilding?.id === building.id;
      const isWarning = (deficits.energy && (type === 'industrial' || type === 'commercial')) || (building.health && building.health < 40);
      const x = building.coordinates?.x ?? 50;
      const z = building.coordinates?.y ?? 50;

      return <group key={building.id}
        position={[x, 0.09, z]}
        onClick={(event) => { event.stopPropagation(); onSelectBuilding(building); }}
        onPointerOver={(event) => { event.stopPropagation(); onHover({ type: 'building', id: building.id, title: building.name || `${type} building`, badge: type.toUpperCase(), workers: `${building.workers || 0} / ${building.capacity || 50} people`, status: isWarning ? 'RESOURCE PRESSURE' : undefined }); }}
        onPointerOut={(event) => { event.stopPropagation(); onHover(null); }}>
        {showInfrastructure && (isHome ? <Home style={style} level={level} index={index} /> : isWarehouse ? <Warehouse style={style} height={height} /> : <Tower style={style} height={height} index={index} />)}
        {isSelected && <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.2, 4.65, 40]} /><meshBasicMaterial color="#378764" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>}
        {showInfrastructure && isWarning && <mesh position={[0, height + 2.1, 0]}>
          <sphereGeometry args={[0.45, 12, 8]} /><meshBasicMaterial color="#e5754a" />
        </mesh>}
        {showEconomy && Number(building.capacity) > 0 && <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.0, 5.18, 32]} /><meshBasicMaterial color="#d8a957" transparent opacity={0.45 + 0.35 * Math.min(1, Number(building.workers || 0) / Number(building.capacity))} />
        </mesh>}
      </group>;
    })}
  </group>;
}

export default Buildings;
