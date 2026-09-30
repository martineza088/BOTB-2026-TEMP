import './style.css';
import { requirements, checkRequirements, PASS_SCORE } from './requirements.js';
import { readPdf } from './pdf.js';
import { requestReview } from './review-api.js';

const app = document.querySelector('#app');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
let results = [], step = 0, busy = false, filename = '', pages = [], reviewError = '', reviewing = false, confirmed = new Set();
const steps = ['Business packet', 'Review information', 'Connect your server'];

function render() {
  app.innerHTML = `<div class="shell"><aside><a class="brand" href="/" aria-label="OneBridge home"><img class="brand-logo" src="/onebridge-logo.png" alt="OneBridge - The Trusted Connection" width="1774" height="887"></a><p class="eyebrow">YOUR SETUP GUIDE</p><nav aria-label="Setup progress">${steps.map((label, index) => `<div class="step ${index === step ? 'active' : ''}" ${index === step ? 'aria-current="step"' : ''}><span>${index + 1}</span>${label}</div>`).join('')}</nav><div class="aside-note">A little preparation.<br>A useful business assistant.<p>Your packet gives your server the information it needs to answer business questions.</p></div></aside><main><header><span>Workspace / New server</span><button id="account" class="secondary">Account setup</button></header><div id="account-note" class="notice" hidden>Account sign-in needs an authentication provider. This local starter does not create an account or save your packet.</div><section class="content"><p class="eyebrow">STEP ${step + 1} OF 3</p>${step === 0 ? uploadView() : step === 1 ? reviewView() : connectionView()}</section></main></div>`;
  document.querySelector('#account').onclick = () => { document.querySelector('#account-note').hidden = !document.querySelector('#account-note').hidden; };
  document.querySelector('#analyze')?.addEventListener('click', analyze);
  const input = document.querySelector('#pdf');
  if (input) input.onchange = event => handleFile(event.target.files[0]);
  document.querySelector('#back')?.addEventListener('click', () => { step--; render(); });
  document.querySelector('#continue')?.addEventListener('click', () => { step++; render(); });
  document.querySelectorAll('[data-confirm]').forEach(input => input.onchange = () => {
    input.checked ? confirmed.add(input.dataset.confirm) : confirmed.delete(input.dataset.confirm);
    document.querySelector('#continue').disabled = confirmed.size !== requirements.length;
  });
  document.querySelector('#download')?.addEventListener('click', () => {
    const packet = { schemaVersion: 2, sourceFile: filename, reviewedAt: new Date().toISOString(), threshold: PASS_SCORE, sections: results.map(({ id, label, description, status, score, feedback, missing, content, pageNumbers, evidence }) => ({ id, label, description, status, score, feedback, missing, content, pageNumbers, evidence, userConfirmed: confirmed.has(id) })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'business-packet-review.json'; link.click(); URL.revokeObjectURL(url);
  });
}
function uploadView() {
  return `<h1>Start with your business.</h1><p class="lead">Upload your Business Information Packet/Document. We’ll help you check it before you connect a server.</p><div class="upload-card"><span class="file-icon" aria-hidden="true">PDF</span><h2>Your business packet</h2><p>One PDF, up to 20 MB and 100 pages.<br>Use selectable text; scanned pages need OCR.</p><label class="primary file-button">Choose PDF<input id="pdf" type="file" accept="application/pdf,.pdf" ${busy ? 'disabled' : ''}></label><p class="privacy">PDF extraction happens on this device. On the next screen, choose Gemini review to send the extracted section text to Google. No file is saved by this starter.</p><p id="upload-status" role="status" aria-live="polite"></p></div><h2 class="requirements-title">Use these five section headings</h2><div class="requirements">${requirements.map(item => `<div><span class="check" aria-hidden="true">✓</span><div><h3>${item.label}</h3><p>${item.description}</p></div></div>`).join('')}</div><div class="notice">Put each heading on its own line, exactly as shown. Numbered headings such as “01 / Business Profile” also work. Put location and hours under Business Profile.</div>`;
}
function reviewView() {
  return `<h1>Check the details.</h1><p class="lead">Review ${escape(filename)}. Review the detected sections, then request a semantic similarity assessment. Scores measure suitability for setup, not factual accuracy.</p><div class="notice"><p>Gemini receives extracted text from the five sections. A section passes at ${PASS_SCORE}/100 with no missing requirements. You must still confirm every section.</p><button id="analyze" class="primary" ${reviewing ? 'disabled' : ''}>${reviewing ? 'Reviewing…' : 'Send to Gemini for review'}</button><p role="status" aria-live="polite">${escape(reviewError)}</p></div><div class="review-list">${results.map(item => `<article><div class="review-heading"><h2>${item.label}</h2><span class="badge ${item.status}">${{ candidate: 'Meets criteria', unclear: 'Needs clarification', missing: 'Heading missing', pending: 'Awaiting Gemini review' }[item.status]}</span></div><p><b>Expected:</b> ${item.description}</p>${item.score !== null ? `<p><b>Similarity score: ${item.score}/100</b> (pass threshold: ${PASS_SCORE})</p><p>${escape(item.feedback)}</p>${item.missing?.length ? `<p><b>Missing:</b> ${item.missing.map(escape).join('; ')}</p>` : ''}` : ''}${item.evidence ? `<blockquote>${escape(item.evidence.excerpt)}<cite>Page ${item.evidence.page}</cite></blockquote>` : '<p class="missing-text">Add this information to your packet and upload the updated PDF.</p>'}<label class="confirmation"><input type="checkbox" data-confirm="${item.id}" ${confirmed.has(item.id) ? 'checked' : ''} ${item.status !== 'candidate' ? 'disabled' : ''}> I reviewed this information and confirm it is complete and current.</label></article>`).join('')}</div><div class="actions"><button id="back" class="secondary" ${reviewing ? 'disabled' : ''}>Upload another packet</button><button id="continue" class="primary" ${confirmed.size !== requirements.length ? 'disabled' : ''}>Continue to connection</button></div><p class="privacy">All five sections need a passing assessment and your confirmation. Missing or unclear details require an updated packet. AI scores can vary and require human review.</p>`;
}
function connectionView() {
  return `<h1>Your packet is reviewed.</h1><p class="lead">You’ve completed the first part of setup. Download the review to use when implementing your server.</p><div class="connection-card"><p class="eyebrow">NEXT: PRODUCT CONNECTION</p><h2>Connect your MCP product</h2><p>Server creation is not connected in this starter. Your product integration will create an authenticated server, store approved business information, and return its connection address.</p><button id="download" class="primary">Download packet review</button></div><div class="notice">The downloaded file includes excerpts and your confirmations. It is a review report, not a running MCP server or a complete business database.</div><div class="actions"><button id="back" class="secondary">Back to review</button></div>`;
}
async function handleFile(file) {
  if (!file || busy) return;
  busy = true; results = []; reviewError = ''; confirmed.clear();
  document.querySelector('#pdf').disabled = true;
  const status = document.querySelector('#upload-status');
  status.textContent = 'Reading your packet…';
  try {
    pages = await readPdf(file, (page, total) => status.textContent = `Checking page ${page} of ${total}…`);
    results = checkRequirements(pages); filename = file.name; step = 1; render();
  } catch (error) { status.textContent = error.message || 'The packet could not be checked. Try another PDF.'; }
  finally { busy = false; const input = document.querySelector('#pdf'); if (input) { input.disabled = false; input.value = ''; } }
}
render();

async function analyze() {
  if (reviewing) return;
  reviewing = true; reviewError = ''; confirmed.clear();
  results = checkRequirements(pages); render();
  try {
    const data = await requestReview(pages, { apiBase: import.meta.env.VITE_REVIEW_API_URL || '' });
    results = data.sections;
  } catch (error) { reviewError = error.name === 'TimeoutError' ? 'Review timed out. Try again.' : error.message; }
  finally { reviewing = false; render(); }
}
