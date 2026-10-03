import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  solutionTechnicians,
  findSolutionTechnicians,
  solutionJobs,
  getSolutionJobs
} from '../src/components/solutions/solutions-preview-model.ts';

test('blank search returns all three sample technicians', () => {
  assert.deepEqual(findSolutionTechnicians('  '), solutionTechnicians);
});
test('technician search normalizes case and whitespace', () => {
  assert.deepEqual(
    findSolutionTechnicians('  MARCUS  ').map((t) => t.name),
    ['Marcus Lee']
  );
});
test('technician search includes skills and locations', () => {
  assert.deepEqual(
    findSolutionTechnicians('structured cabling').map((t) => t.name),
    ['Priya Shah']
  );
  assert.deepEqual(
    findSolutionTechnicians('austin').map((t) => t.name),
    ['Jordan Miles']
  );
});
test('unmatched search is empty and does not mutate sample data', () => {
  const before = JSON.stringify(solutionTechnicians);
  assert.deepEqual(findSolutionTechnicians('missing technician'), []);
  findSolutionTechnicians('Marcus');
  assert.equal(JSON.stringify(solutionTechnicians), before);
  assert.equal(findSolutionTechnicians('').length, 3);
});
test('map and list expose the same four unique jobs', () => {
  assert.deepEqual(getSolutionJobs('Map'), solutionJobs);
  assert.deepEqual(getSolutionJobs('List'), solutionJobs);
  assert.equal(new Set(solutionJobs.map((j) => j.id)).size, 4);
});
test('unassigned view excludes assigned work and preserves the source', () => {
  const before = JSON.stringify(solutionJobs);
  assert.deepEqual(
    getSolutionJobs('Unassigned').map((j) => j.id),
    ['WO-2848', 'WO-2849', 'WO-2850']
  );
  assert.ok(getSolutionJobs('Unassigned').every((j) => j.technician === ''));
  assert.equal(JSON.stringify(solutionJobs), before);
});
