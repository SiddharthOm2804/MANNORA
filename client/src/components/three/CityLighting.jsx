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

    let ambientColor = '#0f172a';
    let ambientIntensity = 0.45;
    let sunColor = '#38bdf8';
    let sunIntensity = 1.2;

    if (isNight) {
      ambientColor = '#080d1a';
      ambientIntensity = 0.35;
      sunColor = '#60a5fa'; // Moonlight
      sunIntensity = 0.35;
    } else if (isDawn) {
      ambientColor = '#1e1b4b';
      ambientIntensity = 0.55;
      sunColor = '#fb923c'; // Warm dawn
      sunIntensity = 0.9;
    } else if (isDusk) {
      ambientColor = '#1c1917';
      ambientIntensity = 0.5;
      sunColor = '#f97316'; // Sunset orange
      sunIntensity = 0.85;
    } else {
      // Day
      ambientColor = '#0c1a2e';
      ambientIntensity = 0.7;
      sunColor = '#f8fafc';
      sunIntensity = 1.3;
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
      <pointLight position={[50, 8, 50]} intensity={0.4} color="#06b6d4" distance={80} />
    </group>
  );
}

export default CityLighting;
