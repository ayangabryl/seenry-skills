// Real-input local reflow checks. Four-property spacing is an accessibility preference,
// not browser zoom, and successful geometry is not a visual-quality score.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const runtime=arg('--playwright');if(!runtime)throw new Error('Pass --playwright /existing/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(resolve(runtime)).href);
const gallery=resolve(arg('--gallery',fileURLToPath(new URL('../skills/seenry/assets/components/transitions/gallery.html',import.meta.url))));
const out=resolve(arg('--out','reflow-browser-results'));mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const report={browser:browser.version(),source:{html:sha(gallery),runtime:sha(join(dirname(gallery),'seenry-transitions.js'))},scope:'Exact local fixture; normal and four-property spaced text, reduced motion, trusted input. Not actual zoom or a quality score.',runs:[]};
const spacingCSS=':root:not(#seenry-text-spacing-test) *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}:root:not(#seenry-text-spacing-test) p{margin-block-end:2em!important}';
const settle=async page=>{await page.waitForTimeout(700);};
async function bounds(page,{key,content}){return page.evaluate(({key,content})=>{
 const card=document.querySelector(`[data-key="${key}"]`),root=card.querySelector(content),stage=card.querySelector('.stage'),replay=card.querySelector('[data-replay]');
 const r=e=>{const x=e.getBoundingClientRect();return {left:x.left,top:x.top,right:x.right,bottom:x.bottom,width:x.width,height:x.height};};
 const visible=e=>{if(e.closest('[hidden],.st-sr,[data-st-ghost],.st-text-exit'))return false;for(let n=e;n;n=n.parentElement){const x=getComputedStyle(n);if(x.display==='none'||x.visibility==='hidden'||Number(x.opacity)<=.01)return false;}return true;};
 const texts=[],walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
 while((n=walk.nextNode()))if(n.textContent.trim()&&visible(n.parentElement)){const range=document.createRange();range.selectNode(n);for(const b of range.getClientRects())if(b.width&&b.height)texts.push({text:n.textContent.trim(),left:b.left,right:b.right,top:b.top,bottom:b.bottom});}
 return {content:r(root),contentVisible:visible(root),stage:r(stage),replay:r(replay),replayVisible:visible(replay),texts};
 },{key,content});}
function contentFits(b,label,expected=[]){
 assert(b.contentVisible===true&&b.content.width>0&&b.content.height>0&&b.texts.length>0,`${label}: content must have visible positive geometry and text`);
 assert(b.replayVisible===true&&b.replay.width>0&&b.replay.height>0&&b.replay.left>=b.stage.left-1&&b.replay.right<=b.stage.right+1&&b.replay.top>=b.stage.top-1&&b.replay.bottom<=b.stage.bottom+1,`${label}: Replay must itself remain visible in the stage`);
 const text=b.texts.map(t=>t.text).join('').replace(/\s+/g,'');for(const value of expected)assert(text.includes(value.replace(/\s+/g,'')),`${label}: expected visible text missing: ${value}`);
 assert(b.content.left>=b.stage.left-1&&b.content.right<=b.stage.right+1,`${label}: content outside stage horizontally`);
 assert(b.content.top>=b.stage.top-1&&b.content.bottom<=b.replay.top-8,`${label}: Replay lane overlaps content`);
 for(const t of b.texts)assert(t.left>=b.content.left-1&&t.right<=b.content.right+1&&t.top>=b.content.top-1&&t.bottom<=b.content.bottom+1,`${label}: clipped text ${t.text}`);
}
async function titleFits(page){return page.evaluate(()=>{
 const title=document.querySelector('#expand-title'),close=document.querySelector('#expand-1 .close-x'),surface=document.querySelector('#expand-1 .expand-surface'),range=document.createRange();range.selectNodeContents(title);
 const rect=e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom};};const c=rect(close),s=rect(surface),lines=[...range.getClientRects()].map(b=>({left:b.left,right:b.right,top:b.top,bottom:b.bottom}));
 const area=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
 const details=document.querySelector('#expand-1 [data-st-expand-content]'),dr=document.createRange();dr.selectNodeContents(details);
 const detailRuns=[],walker=document.createTreeWalker(details,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){if(!node.textContent.trim()||node.parentElement.closest('.st-sr,[hidden],[data-st-ghost]'))continue;let visible=true;for(let n=node.parentElement;n&&surface.contains(n);n=n.parentElement){const x=getComputedStyle(n);if(x.display==='none'||x.visibility==='hidden'||Number(x.opacity)<=.01)visible=false;}if(!visible)continue;const r=document.createRange();r.selectNode(node);for(const b of r.getClientRects())if(b.width&&b.height)detailRuns.push({text:node.textContent,left:b.left,right:b.right,top:b.top,bottom:b.bottom});}
 let titleVisible=true;for(let n=title;n;n=n.parentElement){const x=getComputedStyle(n);if(n.hidden||x.display==='none'||x.visibility==='hidden'||Number(x.opacity)<=.01)titleVisible=false;}
 return {close:c,surface:s,titleVisible,titleText:title.textContent.trim(),lines,overlap:lines.reduce((sum,r)=>sum+area(r,c),0),inside:lines.every(r=>r.right>r.left&&r.bottom>r.top&&r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1),detailRuns,detailsBottom:dr.getBoundingClientRect().bottom};
 });}
try{
 for(const width of [320,390,720,1440])for(const theme of ['light','dark'])for(const spaced of [false,true]){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block',acceptDownloads:false});
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,route=>route.abort());
  const run={width,theme,spaced,status:'running',checks:[],cases:[]};report.runs.push(run);
  const task=async(name,fn)=>{try{const data=await fn();run.cases.push({name,status:'passed',data});}catch(e){run.cases.push({name,status:'failed',error:e.message});await page.screenshot({path:join(out,`${width}-${theme}-${spaced?'spacing':'normal'}-${name}-FAILED.png`)}).catch(()=>{});}};
  try{
   await page.goto(pathToFileURL(gallery).href);await page.evaluate(()=>document.fonts.ready);
   if(spaced){assert.notEqual(await page.evaluate(()=>document.documentElement.id),'seenry-text-spacing-test');await page.addStyleTag({content:spacingCSS});}
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await task('search',async()=>{const x=await page.locator('#library-search').evaluate(e=>({width:e.clientWidth,placeholder:e.placeholder}));assert(x.width>=Math.min(240,width-32),'Search field must retain a readable placeholder width');assert.equal(x.placeholder,'Search transitions');return x;});
   await task('photo-label',async()=>{
    const data=await page.locator('.photo-bar>span,.photo-bar>button').evaluateAll(nodes=>nodes.map(e=>{const s=getComputedStyle(e);return {text:e.textContent.trim(),color:s.color,background:s.backgroundColor};}));
    assert.equal(data.length,2);for(const x of data){
     const parse=value=>{const match=/^rgba?\(([^)]+)\)$/.exec(value);assert(match,'Measured photo label color must be supported');const n=match[1].split(',').map(Number);return {rgb:n.slice(0,3).map(v=>v/255),alpha:n[3]??1};};
     const fg=parse(x.color),bg=parse(x.background);assert.equal(fg.alpha,1);assert.equal(bg.alpha,1,'Photo label needs independent opaque backing');
     const lum=c=>c.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);const a=lum(fg.rgb),b=lum(bg.rgb);x.ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert(x.ratio>=4.5,'Photo control text contrast');
    }return data;
   });
   await task('initial-ai',async()=>contentFits(await bounds(page,{key:'ai',content:'.chat'}),'Initial AI content',['Answered from 4 entries','Three releases shipped']));
   await task('expand-title',async()=>{await page.locator('#expand-src').click();await settle(page);const b=await titleFits(page);assert.equal(b.titleText,'Night Swim');assert.equal(b.titleVisible,true,'Shared title must remain visibly painted after settling');assert.equal(await page.locator('#expand-1').getAttribute('data-st-open'),'true');assert(b.lines.length>0);assert(b.overlap<=1,'Title overlaps close target');assert(b.inside,'Title outside painted surface');assert(b.detailRuns.length>0,'Album information must be visibly painted');const detailText=b.detailRuns.map(r=>r.text).join('').replace(/\s+/g,'');for(const text of ['9tracks','Lowtide','Harbourlights'])assert(detailText.includes(text),'Expected album information missing');assert(b.detailRuns.every(r=>r.left>=b.surface.left-1&&r.right<=b.surface.right+1&&r.top>=b.surface.top-1&&r.bottom<=b.surface.bottom+1),'Album information is clipped');await page.locator('#expand-1 .close-x').click();await settle(page);return b;});
   await task('resize',async()=>{await page.locator('#resize-action').click();await settle(page);assert.equal(await page.locator('#resize-action').getAttribute('aria-expanded'),'true');assert(await page.locator('#resize-content').isVisible());const b=await bounds(page,{key:'resize',content:'.resize-demo'});contentFits(b,'Expanded digest',['8 updates across the team','Next review: Friday at 10:00']);return b;});
   await task('like',async()=>{await page.locator('#like-1').click();await settle(page);assert.equal(await page.locator('#like-1').getAttribute('aria-pressed'),'true');assert.equal((await page.locator('#like-1 .st-sr').textContent()).trim(),'129');const b=await bounds(page,{key:'like',content:'.post'});contentFits(b,'Like card',['Shipped the new onboarding today','129']);return b;});
   await task('accordion',async()=>{await page.locator('#acc-2 summary').click();await settle(page);assert.equal(await page.locator('#acc-2').evaluate(e=>e.open),true);assert(await page.locator('#acc-2 .st-details-body').isVisible());const b=await bounds(page,{key:'accordion',content:'.faq'});contentFits(b,'Expanded accordion',['Students and teachers get the Team plan free for a year','Where is data stored?']);return b;});
   await task('form',async()=>{
    const input=page.locator('#invite-email');await input.fill('mara@aurora');await page.locator('#invite button[type=submit]').click();await settle(page);
    assert.equal(await input.getAttribute('aria-invalid'),'true');const r=await input.boundingBox();assert(r.width>=180,'Email field must remain readable beside or above the action');const b=await bounds(page,{key:'error',content:'.invite'});contentFits(b,'Form and error',['Enter a full email address']);return b;
   });
   await task('final-ai',async()=>{await page.locator('[data-replay=ai]').click();assert.notEqual(await page.locator('#think').getAttribute('data-st-done'),'true','Replay must enter a new thinking state');await page.waitForFunction(()=>document.querySelector('#think').dataset.stDone==='true');await settle(page);const b=await bounds(page,{key:'ai',content:'.chat'});contentFits(b,'Final AI content',['Answered from 4 entries','Three releases shipped']);return b;});
   if(spaced){const applied=await page.evaluate(()=>{const targets=[document.querySelector('#expand-title'),document.querySelector('#think'),document.querySelector('.post p')];return targets.map(e=>{const s=getComputedStyle(e),f=parseFloat(s.fontSize);return {lineHeight:parseFloat(s.lineHeight)/f,letterSpacing:parseFloat(s.letterSpacing)/f,wordSpacing:parseFloat(s.wordSpacing)/f,paragraph:e.matches('p')?parseFloat(s.marginBlockEnd)/f:null};});});for(const x of applied){assert(Number.isFinite(x.lineHeight)&&Math.abs(x.lineHeight-1.5)<.001);assert(Number.isFinite(x.letterSpacing)&&Math.abs(x.letterSpacing-.12)<.001);assert(Number.isFinite(x.wordSpacing)&&Math.abs(x.wordSpacing-.16)<.001);if(x.paragraph!==null)assert(Math.abs(x.paragraph-2)<.001);}run.spacingSamples=applied;}
   assert.deepEqual(errors,[]);run.status=run.cases.every(c=>c.status==='passed')?'passed':'failed';
  }catch(e){run.status='blocked';run.error=e.message;}
  finally{run.pageErrors=errors;writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2));await context.close();console.log(`${width}/${theme}/${spaced?'spacing':'normal'}: ${run.status}`);}
 }
}finally{await browser.close();}
console.log(JSON.stringify({profiles:report.runs.length,passed:report.runs.filter(r=>r.status==='passed').length,failed:report.runs.filter(r=>r.status!=='passed').length,out},null,2));
if(report.runs.some(r=>r.status!=='passed'))process.exitCode=1;
