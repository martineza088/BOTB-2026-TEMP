import { requirements } from './requirements.js';

export async function requestReview(pages, { fetchImpl = fetch, apiBase = '' } = {}) {
  let response;
  try {
    response = await fetchImpl(`${apiBase.replace(/\/$/, '')}/api/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ pages }), signal: AbortSignal.timeout(70_000),
    });
  } catch (error) {
    if (error.name === 'TimeoutError') throw new Error('Review timed out. Try again.');
    throw new Error('Cannot reach the review server. Check that the backend is running and its address is configured correctly.');
  }
  const text = await response.text();
  if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw new Error(`The review server returned a page instead of JSON (HTTP ${response.status}). Start the app with npm run dev or npm start. A static website needs a running backend and VITE_REVIEW_API_URL configured to its address.`);
  }
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`The review server returned invalid JSON (HTTP ${response.status}). Check the backend logs and try again.`); }
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : `Review failed (HTTP ${response.status}).`);
  if (!data || !Array.isArray(data.sections) || data.sections.length !== requirements.length || requirements.some(section => data.sections.filter(result => result?.id === section.id).length !== 1)) {
    throw new Error('The review server returned an incomplete assessment. Try again.');
  }
  return data;
}
