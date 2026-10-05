const assert=require('node:assert/strict');
const {check}=require('../skills/seenry/scripts/decision_check.cjs');
(async()=>{const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});try{
const p=await b.newPage();
const rule={kind:'state-change',selector:'.row',action:{type:'click',selector:'.row'},preserveNodes:true,focusOnAction:true,waitMs:80};
await p.setContent('<button class="row" onclick="this.outerHTML=this.outerHTML">Track</button>');
let r=await check(p,{rules:[rule]});assert.equal(r.status,'needs-repair');assert(r.results[0].findings.some(x=>x.includes('replaced node')));assert(r.results[0].findings.some(x=>x.includes('focus')));
await p.setContent('<button class="row" onclick="this.setAttribute(\'aria-current\',\'true\')">Track</button>');
assert.equal((await check(p,{rules:[rule]})).status,'matched-decisions');
await p.setContent('<button class="row" onclick="this.style.width=\'200px\'">Track</button>');
assert.equal((await check(p,{rules:[rule]})).status,'needs-repair');
await p.setContent('<button class="row" onclick="document.querySelector(\'#panel\').style.height=\'0px\'">Fold</button><div id="panel" style="height:80px;padding:20px"></div>');
const fold={kind:'state-change',selector:'.row',action:{type:'click',selector:'.row'},boundsAfter:[{selector:'#panel',maxHeight:.5}],waitMs:40};
r=await check(p,{rules:[fold]});assert(r.results[0].findings.some(x=>x.includes('retains height')));
await p.locator('#panel').evaluate(e=>e.style.padding='0');
assert.equal((await check(p,{rules:[fold]})).status,'matched-decisions');
await assert.rejects(()=>check(p,{rules:[{...rule,waitMs:-1}]}));
await assert.rejects(()=>check(p,{rules:[{...rule,action:{type:'press',selector:'.row'}}]}));
console.log('State change checks catch node replacement, focus loss, geometry drift and retained padding');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)})
