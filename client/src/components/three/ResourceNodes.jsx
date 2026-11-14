import React from 'react';

const RESOURCE_COLORS = { energy: '#f2bd58', water: '#56b9d1', agriculture: '#83ba65', minerals: '#b99a72', technology: '#9c92df', rawMaterials: '#c68b68' };

/** Display only resource sources that exist in the world's saved building data. */
export function ResourceNodes({ buildings = [], resources = {}, deficits = {}, onHover, onSelect }) {
  const producers = buildings.filter((building) => Object.values(building.production || {}).some((amount) => Number(amount) > 0));
  return <group>
    {producers.map((building) => {
      const produced = Object.entries(building.production || {}).filter(([, amount]) => Number(amount) > 0);
      const primary = produced[0]?.[0];
      if (!primary) return null;
      const color = RESOURCE_COLORS[primary] || '#a6c6b7';
      const position = [building.coordinates?.x ?? 50, 0, building.coordinates?.y ?? 50];
      const detail = produced.map(([key, amount]) => `${key}: ${Number(amount) * (building.level || 1)}`).join(' · ');
      return <group key={`source-${building.id}`} position={position}
        onClick={(event) => { event.stopPropagation(); onSelect?.(building); }}
        onPointerOver={(event) => { event.stopPropagation(); onHover({ type: 'resource_node', title: building.name, badge: 'RESOURCE SOURCE', description: detail, status: deficits[primary] ? 'SUPPLY DEFICIT' : 'PRODUCING' }); }}
        onPointerOut={(event) => { event.stopPropagation(); onHover(null); }}>
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[1.35, 1.7, 0.45, 12]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
        </mesh>
        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.52, 12, 10]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.1, 2.28, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.82} />
        </mesh>
      </group>;
    })}
  </group>;
}

export default ResourceNodes;
