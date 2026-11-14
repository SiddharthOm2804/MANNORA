import React, { useMemo } from 'react';

/**
 * CityLighting connects simulation time (hour of day from SimulationClock)
 * to real-time 3D lighting, sun positioning, and ambient color schemes.
 *
 * Diurnal cycle:
 * - 06:00 - 09:00: Dawn (warm rose/gold, rising sun angle)
 * - 09:00 - 17:00: Midday (bright cyan/white sun, sharp shadows)
 * - 17:00 - 20:00: Dusk (deep amber sunset, elongated shadows)
 * - 20:00 - 06:00: Night (deep blue moonlight, high emissive neon building glow)
 */
export function CityLighting({
  hour = 12,
  deficits = {},
  economicCrisis = false,
  activeEvent = null,
}) {
  // Compute sun position and ambient colors based on clock hour (0 to 23)
  const lighting = useMemo(() => {
    const isNight = hour >= 21 || hour < 5;
    const isDawn = hour >= 5 && hour < 8;
    const isDusk = hour >= 18 && hour < 21;

    // Angle of sun in radians (noon at top)
    const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
    const sunX = 50 + Math.cos(sunAngle) * 70;
    const sunY = Math.max(10, Math.sin(sunAngle) * 80);
    const sunZ = 50 + Math.sin(sunAngle) * 40;

    let ambientColor = '#e7f0dc';
    let ambientIntensity = 1.1;
    let sunColor = '#fff2d2';
    let sunIntensity = 2.1;

    if (isNight) {
      ambientColor = '#8eaaa7';
      ambientIntensity = 0.75;
      sunColor = '#c3d6d0'; // Moonlight
      sunIntensity = 0.65;
    } else if (isDawn) {
      ambientColor = '#ecd8bc';
      ambientIntensity = 0.95;
      sunColor = '#f4bb77'; // Warm dawn
      sunIntensity = 1.5;
    } else if (isDusk) {
      ambientColor = '#e5c8aa';
      ambientIntensity = 0.9;
      sunColor = '#e99b69'; // Sunset orange
      sunIntensity = 1.35;
    } else {
      // Day
      ambientColor = '#e7f0dc';
      ambientIntensity = 1.1;
      sunColor = '#fff4dd';
      sunIntensity = 2.1;
    }

    // Environmental event tinting
    if (activeEvent?.type === 'SOLAR_STORM') {
      sunColor = '#f43f5e';
      sunIntensity = 1.6;
    }

    if (economicCrisis) {
      ambientIntensity *= 0.8;
    }

    return {
      sunPos: [sunX, sunY, sunZ],
      ambientColor,
      ambientIntensity,
      sunColor,
      sunIntensity,
    };
  }, [hour, activeEvent, economicCrisis]);

  return (
    <group>
      {/* Dynamic Ambient Sky Light */}
      <ambientLight color={lighting.ambientColor} intensity={lighting.ambientIntensity} />

      {/* Primary Directional Sun/Moon */}
      <directionalLight
        position={lighting.sunPos}
        intensity={lighting.sunIntensity}
        color={lighting.sunColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={250}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      {/* Sub-surface grid glow */}
      <hemisphereLight args={['#dff2ed', '#93aa78', 0.75]} />
      <pointLight position={[50, 18, 50]} intensity={0.24} color="#fff0c8" distance={110} />
    </group>
  );
}

export default CityLighting;
