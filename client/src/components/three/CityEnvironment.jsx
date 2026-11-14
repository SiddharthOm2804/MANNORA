import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

function TreeCanopy({ blocked = [] }) {
  const trunks = useRef();
  const crowns = useRef();
  const instances = useMemo(() => {
    const points = [];
    for (let x = 8; x <= 92; x += 7) {
      for (let z = 8; z <= 92; z += 7) {
        const onRoad = [33, 50, 67].some((line) => Math.abs(line - x) < 4 || Math.abs(line - z) < 4);
        const inSolarPark = (x < 31 && z < 31) || (x > 69 && z > 69);
        const inCore = x > 39 && x < 61 && z > 39 && z < 61;
        const occupied = blocked.some((point) => Math.hypot(point.x - x, point.y - z) < 5.5);
        if (!onRoad && !inSolarPark && !inCore && !occupied && ((x * 3 + z * 5) % 4 !== 0)) points.push([x, z]);
      }
    }
    return points;
  }, [blocked]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    instances.forEach(([x, z], index) => {
      const scale = 0.72 + ((x + z) % 4) * 0.1;
      dummy.position.set(x, 1.15 * scale, z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunks.current?.setMatrixAt(index, dummy.matrix);
      trunks.current?.setColorAt(index, new THREE.Color(['#806341', '#94734b', '#6f5d3d'][(x + z) % 3]));
      dummy.position.set(x, 2.8 * scale, z);
      dummy.scale.set(scale * 1.55, scale * 1.7, scale * 1.55);
      dummy.updateMatrix();
      crowns.current?.setMatrixAt(index, dummy.matrix);
      crowns.current?.setColorAt(index, new THREE.Color(['#64a951', '#79b957', '#8bc565', '#5a9b49'][(x * 2 + z) % 4]));
    });
    if (trunks.current) { trunks.current.instanceMatrix.needsUpdate = true; trunks.current.instanceColor.needsUpdate = true; }
    if (crowns.current) { crowns.current.instanceMatrix.needsUpdate = true; crowns.current.instanceColor.needsUpdate = true; }
  }, [instances]);

  return <group>
    <instancedMesh ref={trunks} args={[null, null, instances.length]} castShadow receiveShadow>
      <cylinderGeometry args={[0.22, 0.32, 2.2, 6]} /><meshStandardMaterial color="#806341" roughness={0.9} />
    </instancedMesh>
    <instancedMesh ref={crowns} args={[null, null, instances.length]} castShadow>
      <icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#72ad53" roughness={0.88} flatShading />
    </instancedMesh>
  </group>;
}

export function CityEnvironment({ selectedDistrict, onSelectDistrict, onHover, showResources = true, showInfrastructure = true, cities = [], buildings = [] }) {
  const districts = useMemo(() => cities.map((city, index) => {
    const width = Math.max(16, Math.min(30, 12 + Math.log10(Math.max(1, Number(city.population) || 1)) * 2));
    const coordinates = city.coordinates || { x: 50, y: 50 };
    return { ...city, id: String(city._id || city.id || `city-${index}`), isCity: true, type: city.specialization || 'city', bounds: { x: coordinates.x, z: coordinates.y, width, depth: width }, tint: ['#c9e2bc', '#b9dca9', '#d9dfae', '#a9d8a5', '#b5d8c6'][index % 5], description: `${Number(city.population || 0).toLocaleString()} residents · ${city.specialization || 'City district'}` };
  }), [cities]);
  const blockedVegetation = useMemo(() => [...cities.map((city) => city.coordinates || { x: 50, y: 50 }), ...buildings.map((building) => building.coordinates).filter(Boolean)], [cities, buildings]);
  return <group>
    {/* Turquoise water surrounds the green city model. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50, -2.3, 50]} receiveShadow>
      <planeGeometry args={[240, 240]} /><meshStandardMaterial color="#64c8c2" roughness={0.82} />
    </mesh>
    {/* Raised green city plate gives the view a miniature diorama edge. */}
    <mesh position={[50, -0.85, 50]} castShadow receiveShadow>
      <boxGeometry args={[142, 1.7, 142]} /><meshStandardMaterial color="#83b96e" roughness={0.88} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50, 0.02, 50]} receiveShadow onClick={(e) => { e.stopPropagation(); onSelectDistrict(null); }}>
      <planeGeometry args={[140, 140]} /><meshStandardMaterial color="#b8d9a2" roughness={0.95} />
    </mesh>
    {/* Green neighborhood parcels preserve district selection without overpowering the map. */}
    {districts.map((district) => {
      const isSelected = selectedDistrict?.id === district.id;
      return <group key={district.id} position={[district.bounds.x, 0.06, district.bounds.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow
          onClick={(e) => { e.stopPropagation(); onSelectDistrict(district); }}
          onPointerOver={(e) => { e.stopPropagation(); onHover({ type: 'district', title: district.name, badge: district.type.toUpperCase(), description: district.description }); }}
          onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}>
          <planeGeometry args={[district.bounds.width, district.bounds.depth]} />
          <meshStandardMaterial color={isSelected ? '#9bc988' : district.tint} transparent opacity={isSelected ? 0.56 : 0.24} roughness={1} />
        </mesh>
        <mesh position={[0, 0.24, 0]} onClick={(e) => { e.stopPropagation(); onSelectDistrict(district); }} onPointerOver={(e) => { e.stopPropagation(); onHover({ type: 'district', title: district.name, badge: district.type.toUpperCase(), description: district.description }); }} onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}>
          <boxGeometry args={[5, 0.45, 5]} /><meshStandardMaterial color="#79956e" roughness={0.9} />
        </mesh>
        {isSelected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[Math.max(district.bounds.width, district.bounds.depth) * 0.42, Math.max(district.bounds.width, district.bounds.depth) * 0.44, 4]} />
          <meshBasicMaterial color="#388b68" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>}
      </group>;
    })}

    {showInfrastructure && <TreeCanopy blocked={blockedVegetation} />}
  </group>;
}

export default CityEnvironment;
