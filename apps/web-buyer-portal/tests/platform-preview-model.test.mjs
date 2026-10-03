import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  platformOrders,
  filterPlatformOrders
} from '../src/components/platform/platform-preview-model.ts';

test('initial preview shows all five distinct sample orders', () => {
  assert.equal(filterPlatformOrders('').length, 5);
  assert.equal(new Set(platformOrders.map(({ id }) => id)).size, 5);
});
test('search finds names, IDs, titles, and locations without case or whitespace sensitivity', () => {
  for (const query of [' marcus ', 'wo-2847', 'hVaC', 'Austin']) {
    assert.deepEqual(
      filterPlatformOrders(query).map(({ id }) => id),
      ['WO-2847']
    );
  }
});
test('status filter returns only matching orders', () => {
  assert.deepEqual(
    filterPlatformOrders('', 'Scheduled').map(({ id }) => id),
    ['WO-2846', 'WO-2843']
  );
  assert.deepEqual(
    filterPlatformOrders('', 'Completed').map(({ id }) => id),
    ['WO-2845']
  );
});
test('query and status compose and can produce an empty result', () => {
  assert.deepEqual(
    filterPlatformOrders('Dallas', 'Scheduled').map(({ id }) => id),
    ['WO-2846']
  );
  assert.equal(filterPlatformOrders('Dallas', 'Completed').length, 0);
  assert.equal(filterPlatformOrders('not-a-job').length, 0);
});
test('filtering does not mutate the source and clearing restores every row', () => {
  const before = JSON.stringify(platformOrders);
  filterPlatformOrders('Marcus', 'In Progress');
  assert.equal(JSON.stringify(platformOrders), before);
  assert.equal(filterPlatformOrders('').length, 5);
});
