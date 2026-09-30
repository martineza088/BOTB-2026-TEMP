import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRequirements } from '../src/requirements.js';
import { applyAssessment, reviewPages } from '../server/review.js';
const pages = [{number:1,text:'Cover pricing $10\n01 / BUSINESS PROFILE\nJorge, Hutto.\nOpening hours\n7am to 7pm\n02 / PRODUCTS AND PRICING\nMuffler $90 USD'}, {number:2,text:'Clutch $250 USD\n03 / INVENTORY AND AVAILABILITY\nMuffler 8 in stock\n04 / SAMPLE BUSINESS POLICIES\nReturns within 30 days\n05 / BRANDING\nNavy, friendly voice'}];
const assessment = () => ({sections: checkRequirements(pages).map(s=>({id:s.id,score:90,feedback:'Good coverage',missing:[]}))});
test('numbered headings isolate content and preserve multi-page sections',()=>{
 const sections=checkRequirements(pages);
 assert.match(sections[0].content,/Opening hours/);
 assert.doesNotMatch(sections[0].content,/Muffler/);
 assert.doesNotMatch(sections[1].content,/Cover/);
 assert.match(sections[1].content,/Clutch/);
 assert.deepEqual(sections[1].pageNumbers,[1,2]);
});
test('keywords and inline heading mentions do not substitute for headings',()=>{
 assert.ok(checkRequirements([{number:1,text:'Our Products and Pricing include a muffler $90'}]).every(s=>s.status==='missing'));
});
test('empty headings never pass even if model reports 100',()=>{
 const sections=checkRequirements([{number:1,text:'Business Profile\nProducts and Pricing'}]);
 const result=applyAssessment(sections,{sections:sections.map(s=>({id:s.id,score:100,feedback:'test',missing:[]}))});
 assert.ok(result.every(s=>s.status!=='candidate'&&s.score===0));
});
test('threshold and missing requirements are both enforced',()=>{
 const response=assessment(); response.sections[0].score=79; response.sections[1].missing=['currency'];
 const result=applyAssessment(checkRequirements(pages),response);
 assert.equal(result[0].status,'unclear'); assert.equal(result[1].status,'unclear'); assert.equal(result[2].status,'candidate');
});
test('malformed, duplicated and out-of-range model results fail closed',()=>{
 for(const mutate of [r=>r.sections[0].score=101,r=>r.sections[0].score='90',r=>r.sections[1].id=r.sections[0].id,r=>r.sections.pop()]){
  const response=assessment(); mutate(response); assert.throws(()=>applyAssessment(checkRequirements(pages),response));
 }
});
test('Gemini request uses server key, rubric, structured output and section data',async()=>{
 const result=await reviewPages(pages,{apiKey:'test-key',fetchImpl:async(url,options)=>{
  assert.match(url,/gemini-2.5-flash-lite:generateContent$/);
  assert.equal(options.headers['x-goog-api-key'],'test-key');
  const body=JSON.parse(options.body); assert.equal(body.generationConfig.responseMimeType,'application/json');
  assert.match(body.systemInstruction.parts[0].text,/untrusted/);
  assert.equal(JSON.parse(body.contents[0].parts[0].text).sections.length,5);
  return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(assessment())}]}}]})};
 }}); assert.equal(result.sections[0].score,90);
});
test('missing key and quota failures surface errors without passing',async()=>{
 await assert.rejects(reviewPages(pages),/not configured/);
 await assert.rejects(reviewPages(pages,{apiKey:'test',fetchImpl:async()=>({ok:false,status:429})}),/quota/);
});
