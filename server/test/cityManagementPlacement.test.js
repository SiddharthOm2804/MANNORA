import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseLot } from '../src/services/cityManagementService.js';

test('production facility placement stays clear of roads, trees, cities, and existing buildings', () => {
  const world = {
    cities: [{ coordinates: { x: 50, y: 50 } }, { coordinates: { x: 24, y: 24 } }],
    buildings: [{ coordinates: { x: 40, y: 40 } }],
  };
  const lot = chooseLot(world);
  assert.ok(lot, 'a clear lot should be available');
  assert.ok(lot.x >= 8 && lot.x <= 92 && lot.y >= 8 && lot.y <= 92);
  assert.ok(![18, 33, 50, 67, 82].some((road) => Math.abs(lot.x - road) < 5 || Math.abs(lot.y - road) < 5));
  for (const occupied of [...world.cities.map((city) => city.coordinates), ...world.buildings.map((building) => building.coordinates)]) {
    assert.ok(Math.hypot(lot.x - occupied.x, lot.y - occupied.y) >= 9);
  }
});

test('facility placement returns no lot rather than placing inside occupied city space', () => {
  const cities = [];
  for (let x = 0; x <= 100; x += 5) for (let y = 0; y <= 100; y += 5) cities.push({ coordinates: { x, y } });
  assert.equal(chooseLot({ cities, buildings: [] }), null);
});
