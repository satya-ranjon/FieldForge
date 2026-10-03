import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  resources,
  resourceTypes,
  resourceTopics,
  filterResources,
  resourceLabel
} from '../src/components/resources/resource-model.ts';

test('initial library has unique records and the requested featured/latest groups', () => {
  assert.equal(resources.length, 8);
  assert.equal(new Set(resources.map((r) => r.id)).size, 8);
  assert.equal(resources.filter((r) => r.featured).length, 3);
  assert.equal(resources.filter((r) => r.latest).length, 4);
  assert.deepEqual(filterResources('  '), resources);
});
test('search normalizes case and repeated whitespace and matches all query terms', () => {
  assert.deepEqual(
    filterResources('  TECHNICIAN   RESPONSE ').map((r) => r.id),
    ['response-time']
  );
  assert.deepEqual(filterResources('response missing-word'), []);
});
test('search includes descriptions and topics', () => {
  assert.ok(filterResources('communication').some((r) => r.id === 'onboarding-checklist'));
  assert.deepEqual(
    filterResources('Dispatching').map((r) => r.id),
    ['response-time', 'retail-scale']
  );
});
test('every resource type returns only matching records', () => {
  for (const type of resourceTypes.filter((t) => t !== 'All')) {
    const result = filterResources('', type);
    assert.ok(result.length > 0, type);
    assert.ok(result.every((r) => r.type === type));
  }
  assert.equal(filterResources('', 'Templates').length, 2);
});
test('topic and resource-type filters intersect with the search', () => {
  assert.deepEqual(
    filterResources('technician', 'Templates', 'Technician Success').map((r) => r.id),
    ['onboarding-checklist']
  );
  assert.deepEqual(filterResources('', 'Help Center', 'Templates'), []);
  for (const topic of resourceTopics) assert.ok(filterResources('', 'All', topic).length > 0);
});
test('filtering never mutates data and clear restores all resources', () => {
  const before = JSON.stringify(resources);
  filterResources('network', 'Guides');
  assert.equal(JSON.stringify(resources), before);
  assert.equal(filterResources().length, 8);
});
test('case studies explicitly disclose their illustrative status', () => {
  const cases = resources.filter((r) => r.type === 'Case Studies');
  assert.equal(cases.length, 2);
  for (const article of cases) {
    assert.equal(article.illustrative, true);
    assert.match(article.sections.map((s) => s.body).join(' '), /illustrative/);
  }
  assert.equal(resourceLabel('Case Studies'), 'Case Study');
  assert.equal(resourceLabel('Product Updates'), 'Product Update');
});
test('all article actions have readable content and every thumbnail exists', () => {
  for (const resource of resources) {
    assert.ok(
      existsSync(new URL(`../public/marketing/resources-${resource.image}.png`, import.meta.url))
    );
    if (!resource.download) {
      assert.ok(resource.sections.length >= 3);
      assert.ok(resource.sections.every((s) => s.title.length > 0 && s.body.length > 80));
    }
  }
});
test('template downloads are real CSVs with consistent columns and usable rows', () => {
  const templates = resources.filter((r) => r.download);
  assert.equal(templates.length, 2);
  for (const template of templates) {
    assert.match(template.download, /^\/resources\/[a-z-]+\.csv$/);
    const csv = readFileSync(new URL(`../public${template.download}`, import.meta.url), 'utf8')
      .trim()
      .split('\n');
    assert.ok(csv.length >= 2);
    const columns = csv[0].split(',').length;
    assert.ok(columns >= 6);
    assert.ok(csv.slice(1).every((row) => row.split(',').length === columns));
  }
});
