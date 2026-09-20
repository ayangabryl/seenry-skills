const assert=require('node:assert/strict');
const {check}=require('../skills/seenry/scripts/decision_check.cjs');
(async()=>{const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});try{
const p=await b.newPage();
const rules=[{kind:'distinct-text',selector:'.identity',fields:['.name','.detail']},{kind:'contained-media',selector:'.avatar'}];
await p.setContent('<div class="identity"><div class="name"> Sam@example.com </div><div class="detail">sam@example.com</div></div><div class="avatar" style="width:24px;height:24px"><svg width="256" height="256"></svg></div>');
let r=await check(p,{rules});assert.equal(r.status,'needs-repair');assert.equal(r.results.filter(x=>x.status==='mismatch').length,2);
await p.locator('.detail').evaluate(e=>e.remove());await p.locator('svg').evaluate(e=>{e.style.width='16px';e.style.height='16px'});
assert.equal((await check(p,{rules})).status,'matched-decisions');
await p.locator('.identity').evaluate(e=>{e.innerHTML='<span class="name">Sam Reed</span><span class="detail">sam@example.com</span>'});
assert.equal((await check(p,{rules})).status,'matched-decisions');
await p.locator('.avatar').evaluate(e=>{e.innerHTML='<img style="width:16px;height:16px" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22256%22 height=%22256%22%3E%3C/svg%3E">'});
await p.locator('img').evaluate(e=>e.decode());assert.equal((await check(p,{rules})).status,'matched-decisions');
await p.locator('img').evaluate(e=>e.style.width='64px');assert.equal((await check(p,{rules})).status,'needs-repair');
await p.locator('.avatar').evaluate(e=>e.style.display='none');assert.equal((await check(p,{rules})).status,'incomplete');
await assert.rejects(()=>check(p,{rules:[{kind:'distinct-text',selector:'.identity',fields:['.name']}]}));
console.log('Content-family checks cover duplicate identity, optional fields, SVG/img containment and hidden states');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
