import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculatePricingPreview,
  formatPreviewMoney,
  MAX_PREVIEW_JOB_CENTS,
  parseJobAmount
} from '../src/components/pricing/pricing-model.ts';

test('parses whole dollars and decimal amounts into exact cents', () => {
  assert.equal(parseJobAmount(' 100 '), 10000);
  assert.equal(parseJobAmount('250.50'), 25050);
  assert.equal(parseJobAmount('1.1'), 110);
});
test('rejects malformed, negative, nonfinite and overprecision input', () => {
  for (const input of ['', ' ', '-10', '1e3', 'NaN', 'Infinity', '1.234', '$100', '1,000']) {
    assert.equal(parseJobAmount(input), null, input);
  }
});
test('enforces inclusive preview amount bounds', () => {
  assert.equal(parseJobAmount('1'), 100);
  assert.equal(parseJobAmount('1000000'), MAX_PREVIEW_JOB_CENTS);
  assert.equal(parseJobAmount('0.99'), null);
  assert.equal(parseJobAmount('1000000.01'), null);
});
test('adds customer fee while preserving full technician earnings', () => {
  assert.deepEqual(calculatePricingPreview(10000), {
    jobCents: 10000,
    platformFeeCents: 1200,
    technicianCents: 10000,
    customerTotalCents: 11200
  });
});
test('handles decimal amounts and rounds fractional cents once', () => {
  assert.equal(calculatePricingPreview(25050).platformFeeCents, 3006);
  assert.equal(calculatePricingPreview(104).platformFeeCents, 12);
  assert.equal(calculatePricingPreview(105).platformFeeCents, 13);
});
test('preserves payment breakdown across representative amounts', () => {
  for (const amount of [100, 101, 999, 10000, 25050, MAX_PREVIEW_JOB_CENTS]) {
    const result = calculatePricingPreview(amount);
    assert.equal(result.technicianCents, amount);
    assert.equal(result.customerTotalCents, result.technicianCents + result.platformFeeCents);
    assert.ok(Number.isSafeInteger(result.customerTotalCents));
  }
});
test('rejects invalid direct calculator inputs', () => {
  for (const amount of [0, -100, 99, 100.5, NaN, Infinity, MAX_PREVIEW_JOB_CENTS + 1]) {
    assert.throws(() => calculatePricingPreview(amount), RangeError);
  }
});
test('formats whole and fractional USD without dropping cents', () => {
  assert.equal(formatPreviewMoney(10000), '$100');
  assert.equal(formatPreviewMoney(25050), '$250.50');
  assert.equal(formatPreviewMoney(3006), '$30.06');
});
