import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRequirements } from '../src/requirements.js';

test('empty documents mark all requirements missing', () => {
  assert.ok(checkRequirements([]).every(result => result.status === 'missing'));
});
test('a pricing heading alone is not sufficient', () => {
  const result = checkRequirements([{ number: 1, text: 'Pricing' }]).find(result => result.id === 'pricing');
  assert.equal(result.status, 'unclear');
});
test('price evidence retains its source page and is only a candidate', () => {
  const result = checkRequirements([{ number: 3, text: 'Pricing: our sandwiches cost $12.00 each. Delivery fees are $3.00 per order.' }]).find(result => result.id === 'pricing');
  assert.equal(result.status, 'candidate');
  assert.equal(result.evidence.page, 3);
  assert.match(result.evidence.excerpt, /\$12\.00/);
});
