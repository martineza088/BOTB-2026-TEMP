import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { extractPageText } from '../src/pdf-text.js';
import { checkRequirements } from '../src/requirements.js';
const example = new URL('../output/pdf/jorge-auto-parts-business-information-packet.pdf',import.meta.url);
test('example PDF extracts all five correctly delimited sections',{skip:!existsSync(example)},async()=>{
 const task=getDocument({data:new Uint8Array(readFileSync(example)),isEvalSupported:false});
 try {
  const pdf=await task.promise, pages=[];
  for(let number=1;number<=pdf.numPages;number++){
   const page=await pdf.getPage(number); pages.push({number,text:extractPageText((await page.getTextContent()).items)});
  }
  const sections=checkRequirements(pages);
  assert.ok(sections.every(s=>s.status==='pending'));
  assert.match(sections[0].content,/7:00 AM/);
  assert.match(sections[1].content,/249.99/);
  assert.match(sections[2].content,/Reserved/);
  assert.doesNotMatch(sections[1].content,/Current inventory snapshot/);
  assert.match(sections[3].content,/Returns and exchanges/);
  assert.match(sections[4].content,/#142B49/);
 } finally {await task.destroy();}
});
