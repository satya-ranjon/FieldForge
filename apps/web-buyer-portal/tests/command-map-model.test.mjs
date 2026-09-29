import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialMapView,
  changeMapView,
  mapViewport,
  demoTechnicians
} from '../src/components/marketing/command-map-model.ts';

test('initial view contains the entire demo geography', () => {
  assert.deepEqual(mapViewport(initialMapView), { x: 0, y: 0, width: 1000, height: 600 });
});
test('zoom respects both limits and preserves the center', () => {
  assert.deepEqual(changeMapView(initialMapView, -1), initialMapView);
  const zoomed = changeMapView(initialMapView, 1);
  assert.equal(zoomed.x, 500);
  assert.equal(zoomed.y, 300);
  assert.ok(mapViewport(zoomed).width < 1000);
  assert.equal(changeMapView(zoomed, 10).zoom, 3);
});
test('panning clamps all four edges within the geography', () => {
  for (const dx of [-10000, 10000])
    for (const dy of [-10000, 10000]) {
      const view = changeMapView({ ...initialMapView, zoom: 2 }, 0, dx, dy);
      const bounds = mapViewport(view);
      assert.ok(bounds.x >= -1e-9 && bounds.y >= -1e-9);
      assert.ok(bounds.x + bounds.width <= 1000 + 1e-9);
      assert.ok(bounds.y + bounds.height <= 600 + 1e-9);
    }
});
test('zooming back out resets a previously panned center', () => {
  const panned = changeMapView({ ...initialMapView, zoom: 2 }, 0, 250, 100);
  assert.notEqual(panned.x, 500);
  assert.deepEqual(changeMapView(panned, -2), initialMapView);
});
test('every selectable technician has a unique identity and valid coordinates', () => {
  assert.equal(new Set(demoTechnicians.map((tech) => tech.name)).size, 9);
  for (const tech of demoTechnicians) {
    assert.ok(tech.x > 0 && tech.x < 1000 && tech.y > 0 && tech.y < 600);
    assert.ok(tech.status && tech.location && tech.initials);
  }
});
