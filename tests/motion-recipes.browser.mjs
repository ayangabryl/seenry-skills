import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const index=process.argv.indexOf('--playwright');
if(index<0)throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(process.argv[index+1]).href);
const recipes=readFileSync(new URL('../skills/seenry-motion/references/recipes.md',import.meta.url),'utf8');
const css=[...recipes.matchAll(/```css\n([\s\S]*?)```/g)].map(m=>m[1]).join('\n');
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
const cases=[
  {name:'recipes',override:''},
  {name:'delayed observation',override:'',observationDelay:350},
  {name:'missing dialog opacity',override:'dialog { transition: scale 200ms ease !important; }',reject:'dialogEnter'},
  {name:'missing details transition',override:'details::details-content { transition: none !important; }',reject:'detailsAnimating'},
];
const evidence={browser:browser.version(),recipeSha256:createHash('sha256').update(recipes).digest('hex'),scope:'Popover/dialog: actual browser-created CSS transitions, controlled timeline samples and natural completion. Details: declared CSS contract and a complete natural RAF geometry trace because Chromium does not enumerate its pseudo-element transition. Not perceptual motion acceptance.',cases:[]};
try {
  for(const test of cases){
    const page=await browser.newPage();
    try {
      await page.setContent(`<style>${css}\n${test.override}</style>
        <button class="btn">Press</button>
        <div class="menu" popover id="menu">Menu</div>
        <dialog id="dlg">Dialog</dialog>
        <details id="det"><summary>More</summary><p>Hidden content line one.<br>Line two.</p></details>
        <div class="tabs"><button class="tab" role="tab" aria-selected="true" style="position:relative">A</button></div>`);
      const result=await page.evaluate(async({observationDelay})=>{
        const out={checks:{},trace:[]};
        try {
        const record=(name,data)=>out.trace.push({name,at:performance.now(),...data});
        const animationsFor=(el,change,name)=>{
          // Flush the authored starting state, then collect the transitions synchronously.
          // Waiting two RAFs can miss a short transition when a runner is descheduled.
          getComputedStyle(el).display; el.getBoundingClientRect();
          const started=performance.now();change();
          const animations=el.getAnimations({subtree:true});
          const captured=animations.map(a=>({type:a.constructor.name,property:a.transitionProperty??null,pseudo:a.effect?.pseudoElement??null,duration:a.effect?.getComputedTiming().duration,currentTime:a.currentTime,playState:a.playState,keyframes:a.effect?.getKeyframes()}));
          for(const a of animations){a.pause();a.currentTime=0;}
          record(name,{started,captured});return animations;
        };
        const owns=(el,animations,property,pseudo=null)=>animations.some(a=>a instanceof CSSTransition&&a.transitionProperty===property&&a.effect?.target===el&&(a.effect.pseudoElement??null)===pseudo&&Number.isFinite(a.effect.getComputedTiming().duration)&&a.effect.getComputedTiming().duration>0);
        const seek=(animations,fraction)=>{for(const a of animations){const t=a.effect.getComputedTiming();if(Number.isFinite(t.duration))a.currentTime=t.delay+t.duration*fraction;}};
        const finish=async(animations)=>{
          // A deadline bounds a broken animation. Completion is its actual finished promise,
          // not an assumption that a fixed sleep happened to land after its final frame.
          let timer;
          try {
            await Promise.race([Promise.all(animations.map(a=>{a.play();return a.finished;})),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('CSS transition did not complete within 5 seconds')),5000);})]);
          } finally {clearTimeout(timer);}
        };
        const appearance=el=>{const cs=getComputedStyle(el);return {opacity:Number(cs.opacity),scale:cs.scale,display:cs.display,height:el.getBoundingClientRect().height};};
        const spring=getComputedStyle(document.documentElement).getPropertyValue('--spring-bounce').trim();
        out.checks.springParses=CSS.supports('transition-timing-function',spring);
        for(const [name,el,open] of [['popoverEnter',document.getElementById('menu'),e=>e.showPopover()],['dialogEnter',document.getElementById('dlg'),e=>e.showModal()]]){
          const animations=animationsFor(el,()=>open(el),name),hasMotion=owns(el,animations,'opacity')&&owns(el,animations,'scale');
          out.checks[name]=hasMotion;
          if(!hasMotion)return out;
          if(observationDelay)await new Promise(r=>setTimeout(r,observationDelay));
          const start=appearance(el);seek(animations,.5);const middle=appearance(el);
          await finish(animations);const end=appearance(el);
          record(name+' samples',{start,middle,end});
          out.checks[name]=start.opacity<=.01&&middle.opacity>start.opacity&&middle.opacity<end.opacity&&end.opacity>=.99&&end.display!=='none';
        }
        const dlg=document.getElementById('dlg'),exit=animationsFor(dlg,()=>dlg.close(),'dialogExit');
        out.checks.dialogExitAnimating=owns(dlg,exit,'opacity')&&owns(dlg,exit,'scale');
        if(!out.checks.dialogExitAnimating)return out;
        if(observationDelay)await new Promise(r=>setTimeout(r,observationDelay));
        const exitStart=appearance(dlg);seek(exit,.5);const exitMiddle=appearance(dlg);
        out.checks.dialogStaysForExit=exitStart.display!=='none'&&exitMiddle.display!=='none'&&exitStart.opacity>exitMiddle.opacity&&exitMiddle.opacity>0;
        await finish(exit);const exitEnd=appearance(dlg);out.checks.dialogCloses=exitEnd.display==='none'&&!dlg.open;
        record('dialogExit samples',{start:exitStart,middle:exitMiddle,end:exitEnd});
        const det=document.getElementById('det'),h0=det.getBoundingClientRect().height;
        const ds=getComputedStyle(det,'::details-content');
        const properties=ds.transitionProperty.split(',').map(s=>s.trim());
        const millis=s=>s.trim().endsWith('ms')?parseFloat(s):parseFloat(s)*1000;
        const durations=ds.transitionDuration.split(',').map(millis),delays=ds.transitionDelay.split(',').map(millis);
        const durationFor=property=>{const i=properties.findIndex(p=>p===property||p==='all');return i<0?0:durations[i%durations.length];};
        const duration=durationFor('block-size'),declared={properties,durations,delays,blockSize:ds.blockSize,overflow:ds.overflow,interpolateSize:getComputedStyle(document.documentElement).interpolateSize};
        const expectedSpan=Math.max(0,...durations.map((d,i)=>d+delays[i%delays.length]));
        const detailsTrace=[];const started=performance.now();det.open=true;
        record('details start',{h0,declared,samples:detailsTrace,elementAnimations:det.getAnimations({subtree:true}).map(a=>({property:a.transitionProperty??null,pseudo:a.effect?.pseudoElement??null}))});
        // This pseudo-element moves in Chromium despite an empty getAnimations() inventory.
        // Observe its entire natural transition; never assume a 60ms timer samples the middle.
        const observation=new Promise((resolve,reject)=>{
          let stable=0,previous=h0,timer=setTimeout(()=>reject(new Error('Details RAF observation did not settle within 5 seconds')),5000);
          const frame=()=>{
            const at=performance.now()-started,height=det.getBoundingClientRect().height;detailsTrace.push({at,height});
            stable=Math.abs(height-previous)<.001?stable+1:0;previous=height;
            if(at>=Math.max(300,expectedSpan+50)&&stable>=3){clearTimeout(timer);resolve();return;}
            if(at<5000)requestAnimationFrame(frame);
          };requestAnimationFrame(frame);
        });
        // The delayed reader does not postpone or discard the native RAF collector.
        await Promise.all([observation,observationDelay?new Promise(r=>setTimeout(r,observationDelay)):Promise.resolve()]);
        const h2=det.getBoundingClientRect().height,intermediate=detailsTrace.filter(s=>s.height>h0+.01&&s.height<h2-.01);
        record('details samples',{h0,h2,declared,intermediateCount:intermediate.length,samples:detailsTrace});
        out.checks.detailsAnimating=Number.isFinite(duration)&&duration>0&&declared.interpolateSize==='allow-keywords'&&h2>h0+.01&&intermediate.length>0;
        out.checks.viewTransitions=typeof document.startViewTransition==='function';
        out.checks.scrollTimeline=CSS.supports('animation-timeline: view()');
        return out;
        } catch(error) {out.error={name:error.name,message:error.message};return out;}
      },{observationDelay:test.observationDelay??0});
      evidence.cases.push({name:test.name,observationDelay:test.observationDelay??0,...result});
      assert.equal(result.error,undefined,JSON.stringify(result.error));
      if(test.reject){
        assert.equal(result.checks[test.reject],false,`${test.name}: missing authored motion must fail its own assertion`);
        for(const [key,value] of Object.entries(result.checks))if(key!==test.reject)assert.equal(value,true,`${test.name}: unrelated ${key}`);
      } else {
        const expected=['springParses','popoverEnter','dialogEnter','dialogExitAnimating','dialogStaysForExit','dialogCloses','detailsAnimating','viewTransitions','scrollTimeline'];
        assert.deepEqual(Object.keys(result.checks).sort(),expected.sort(),'All recipe checks must execute');
        for(const [key,value] of Object.entries(result.checks))assert.equal(value,true,key);
      }
    } finally {await page.close();}
  }
  console.log('MOTION_RECIPE_RESULTS '+JSON.stringify(evidence));
  console.log('Motion recipes: actual CSS transition samples and natural completion passed; missing-motion negative controls rejected. Perceptual review remains separate.');
} catch(error) {console.error('MOTION_RECIPE_EVIDENCE '+JSON.stringify(evidence));throw error;}
finally {await browser.close();}
