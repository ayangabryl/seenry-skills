// Trusted input and composited default-theme control cues; does not claim full WCAG conformance.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i<0?d:process.argv[i+1];};
const modulePath=arg('--playwright');if(!modulePath)throw new Error('Pass --playwright /existing/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(resolve(modulePath)).href);
const gallery=resolve(arg('--gallery',fileURLToPath(new URL('../skills/seenry/assets/components/transitions/gallery.html',import.meta.url))));
const out=resolve(arg('--out','control-contrast-results'));mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
const report={browser:browser.version(),cssSHA256:createHash('sha256').update(readFileSync(join(dirname(gallery),'seenry-transitions.css'))).digest('hex'),scope:'Settled native checked/unchecked states, default light/dark themes, opaque modeled backgrounds plus raw pixels. Essential cues only, not decorative borders or whole-page conformance.',runs:[]};
const parse=v=>{let m=/^rgba?\((.*)\)$/.exec(v);if(m){const a=m[1].split(',').map(Number);return [...a.slice(0,3).map(x=>x/255),a[3]??1];}m=/^color\(srgb (.*)\)$/.exec(v);if(m){const a=m[1].replace('/',' ').trim().split(/\s+/).map(Number);return [...a.slice(0,3),a[3]??1];}throw new Error('Unsupported measured color '+v);};
const over=(a,b)=>[...a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3])),1];
const lum=c=>c.slice(0,3).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
try{
 for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:390,height:1000},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block',acceptDownloads:false});const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
  await page.addInitScript(()=>{window.__controlEvents=[];for(const type of ['click','change'])document.addEventListener(type,e=>{if(e.target.closest?.('.st-toggle,.st-check'))window.__controlEvents.push({type,target:e.target.id,checked:e.target.checked,trusted:e.isTrusted,at:performance.now()});},true);});
  for(const [key,inputSelector,cueSelector] of [['switch','#sw-1','#sw-1 + .st-toggle-track'],['checkbox','#chk-1','#chk-1 + svg']]){
   await page.goto(pathToFileURL(gallery).href);await page.evaluate(()=>document.fonts.ready);const input=page.locator(inputSelector),label=page.locator(key==='switch'?'.st-toggle:has(#sw-1)':'.st-check:has(#chk-1)');await label.scrollIntoViewIfNeeded();
   for(const checked of [false,true]){
    if(await input.isChecked()!==checked)await label.click();
    const card=label.locator('xpath=ancestor::article');await card.evaluate(async e=>{await Promise.all(e.getAnimations({subtree:true}).filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
    const run={theme,key,checked,status:'running'};report.runs.push(run);
    try{
     assert.equal(await input.isChecked(),checked,'Native input state must match measured state');
     run.measured=await page.locator(cueSelector).evaluate((el,key)=>{
      const s=getComputedStyle(el),box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
      const chain=[];for(let n=el.parentElement;n;n=n.parentElement){const c=getComputedStyle(n);chain.unshift({tag:n.tagName,className:n.className,background:c.backgroundColor,image:c.backgroundImage,opacity:c.opacity,visibility:c.visibility,display:c.display});}
      const glyph=key==='switch'?el.querySelector('.st-toggle-thumb'):el.querySelector('path'),g=glyph&&getComputedStyle(glyph);
      return {rect:box(el),background:s.backgroundColor,shadow:s.boxShadow,opacity:s.opacity,visibility:s.visibility,display:s.display,chain,glyph:g?{rect:box(glyph),background:g.backgroundColor,visibility:g.visibility,display:g.display,stroke:g.stroke,strokeWidth:g.strokeWidth,opacity:g.opacity,d:glyph.getAttribute('d'),dashOffset:g.strokeDashoffset}:null};
     },key);
     const m=run.measured;assert(m.rect.width>0&&m.rect.height>0);assert.equal(Number(m.opacity),1);assert.equal(m.visibility,'visible');assert.notEqual(m.display,'none');let adjacent=[1,1,1,1];
     for(const layer of m.chain){assert.equal(layer.image,'none','Gradient background needs manual contrast adjudication');assert.equal(Number(layer.opacity),1,'Measure settled fully opaque ancestors');assert.equal(layer.visibility,'visible');assert.notEqual(layer.display,'none');adjacent=over(parse(layer.background),adjacent);}
     const fill=over(parse(m.background),adjacent);run.composited={adjacent,fill};run.ratios={};
     const check=(name,value)=>{run.ratios[name]=value;assert(Number.isFinite(value)&&value>=3,`${theme}/${key}/${checked?'checked':'unchecked'} ${name}: ${value}`);};
     if(key==='switch'){
      assert(m.glyph&&m.glyph.rect.width>0&&m.glyph.rect.height>0);assert.equal(Number(m.glyph.opacity),1);assert.equal(m.glyph.visibility,'visible');assert.notEqual(m.glyph.display,'none');const thumb=over(parse(m.glyph.background),fill);run.composited.thumb=thumb;
      check('thumb-against-track',ratio(thumb,fill));check('component-against-surroundings',Math.max(ratio(thumb,adjacent),ratio(fill,adjacent)));
     }else if(!checked){
      const color=m.shadow.match(/rgba?\([^)]*\)|color\(srgb[^)]*\)/);assert(color,'Unchecked control must have a visible boundary');const shadowShape=m.shadow.replace(color[0],'').trim();const lengths=[...shadowShape.matchAll(/(-?[\d.]+)px/g)].map(x=>Number(x[1]));assert(/\binset\b/.test(shadowShape)&&lengths.length===4&&lengths[3]>0,'Unchecked boundary requires a positive inset spread');const edge=over(parse(color[0]),fill);run.composited.boundary=edge;
      check('boundary-against-fill',ratio(edge,fill));check('boundary-against-surroundings',ratio(edge,adjacent));
     }else{
      assert(m.glyph&&m.glyph.d&&parseFloat(m.glyph.strokeWidth)>0&&m.glyph.rect.width>0&&m.glyph.rect.height>0);assert.equal(Number(m.glyph.opacity),1);assert.equal(m.glyph.visibility,'visible');assert.notEqual(m.glyph.display,'none');assert.equal(parseFloat(m.glyph.dashOffset),0);const mark=over(parse(m.glyph.stroke),fill);run.composited.mark=mark;check('checkmark-against-fill',ratio(mark,fill));
     }
     if(checked)assert((await page.evaluate(()=>window.__controlEvents)).some(e=>e.type==='change'&&e.trusted&&e.checked),'Checked state must follow trusted native change');
     assert.deepEqual(errors,[]);run.status='passed';
    }catch(e){run.status='failed';run.error=e.message;}
    finally{run.events=await page.evaluate(()=>window.__controlEvents);await label.screenshot({path:join(out,`${theme}-${key}-${checked?'checked':'unchecked'}.png`)});writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2));}
   }
  }
  await context.close();
 }
}finally{await browser.close();}
console.log(JSON.stringify({cases:report.runs.length,passed:report.runs.filter(x=>x.status==='passed').length,failed:report.runs.filter(x=>x.status!=='passed').length,out},null,2));if(report.runs.some(x=>x.status!=='passed'))process.exitCode=1;
