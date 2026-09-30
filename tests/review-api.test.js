import test from 'node:test';
import assert from 'node:assert/strict';
import { requestReview } from '../src/review-api.js';
import { requirements } from '../src/requirements.js';
const reply = (text, status = 200, type = 'application/json') => async () => new Response(text, { status, headers: { 'Content-Type': type } });
test('plain text hosting errors explain the missing backend instead of failing JSON.parse', async () => {
  await assert.rejects(requestReview([], { fetchImpl: reply('The page cannot be found', 404, 'text/plain') }), /page instead of JSON.*HTTP 404/);
});
test('SPA HTML fallback is rejected even with HTTP 200', async () => {
  await assert.rejects(requestReview([], { fetchImpl: reply('<html>App</html>', 200, 'text/html') }), /running backend/);
});
test('invalid JSON and incomplete assessments fail without passing', async () => {
  await assert.rejects(requestReview([], { fetchImpl: reply('not JSON') }), /invalid JSON/);
  await assert.rejects(requestReview([], { fetchImpl: reply('{}') }), /incomplete assessment/);
});
test('JSON backend errors remain readable', async () => {
  await assert.rejects(requestReview([], { fetchImpl: reply('{"error":"Gemini quota reached"}', 429) }), /Gemini quota reached/);
});
test('configured backend address receives the request', async () => {
  const data = { sections: requirements.map(section => ({ id: section.id })) };
  const result = await requestReview([], { apiBase: 'https://backend.example/', fetchImpl: async (url) => {
    assert.equal(url, 'https://backend.example/api/review'); return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } });
  assert.deepEqual(result, data);
});
