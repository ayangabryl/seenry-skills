// Optional host adapter. Install Playwright in the project or pass its module file.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {collectScrollEvidence} from './scroll_evidence.mjs';
import {captureTransition} from './transition_evidence.mjs';
import {probeInteractions,validateProbe} from './interaction_probe.mjs';
import decisionChecks from './decision_check.cjs';
async function performAction(page,action){
  const locator=action.selector?page.locator(action.selector):null;
  if(action.type==='click')await locator.click({timeout:4000});
  else if(action.type==='fill')await locator.fill(action.value,{timeout:4000});
  else if(action.type==='press'){if(locator)await locator.press(action.key,{timeout:4000});else await page.keyboard.press(action.key);}
  else if(action.type==='scroll')await page.evaluate(p=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*p,behavior:'instant'}),action.progress);
  else if(action.type==='wait')await page.waitForTimeout(Math.min(action.ms||200,2000));
  else if(action.type==='visible')await locator.waitFor({state:'visible',timeout:3000});
  else throw new Error('Unsupported action type: '+action.type);
}
const flags=Object.fromEntries(process.argv.slice(2).reduce((rows,value,i,all)=>value.startsWith('--')?[...rows,[value.slice(2),all[i+1]]]:rows,[]));
if(!flags.url||!flags.out)throw new Error('Use --url URL --out DIRECTORY [--playwright MODULE] [--scenario JSON]');
const out=path.resolve(flags.out);await mkdir(path.dirname(out),{recursive:true});
try{await mkdir(out);}catch(error){if(error.code==='EEXIST')throw new Error('Use a new output directory; preserve earlier captures and reports.');throw error;}
const {chromium}=await import(flags.playwright?pathToFileURL(path.resolve(flags.playwright)).href:'playwright');
const scenario=flags.scenario?JSON.parse(await readFile(flags.scenario,'utf8')):{actions:[]};
if(scenario.probe)validateProbe(scenario.probe);
const browser=await chromium.launch({headless:true,...(flags['executable-path']?{executablePath:flags['executable-path']}:{})});const results=[];
try{
  for(const [name,width,reduced] of [['wide',1440,false],['intermediate',1000,false],['narrow',390,false],['reflow',320,true]]){
    const folder=path.join(out,name);await mkdir(folder,{recursive:true});
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:reduced?'reduce':'no-preference',recordVideo:{dir:folder,size:{width,height:900}},acceptDownloads:true});
    const page=await context.newPage();const errors=[],responses=[],steps=[];
    page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>responses.push({url:r.url(),error:r.failure()?.errorText}));
    page.on('response',r=>{if(r.status()>=400)responses.push({url:r.url(),status:r.status()});});
    try{
      await page.goto(flags.url,{waitUntil:'load',timeout:30000});
      await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,3000))]));
      await page.waitForTimeout(350);
      await page.screenshot({path:path.join(folder,'opening.png')});
      await page.screenshot({path:path.join(folder,'page.png'),fullPage:true});
      const measurements=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1?[...document.querySelectorAll('body *')].filter(element=>{
          const style=getComputedStyle(element),rect=element.getBoundingClientRect();
          return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0&&rect.right>innerWidth+1;
        }).slice(0,16).map(element=>({tag:element.tagName.toLowerCase(),id:element.id||null,className:typeof element.className==='string'?element.className:null,right:Math.round(element.getBoundingClientRect().right),text:element.textContent?.trim().slice(0,70)||''})):[],
        hiddenFocusable:[...document.querySelectorAll('[aria-hidden="true"]')].filter(region=>!region.closest('[inert],[hidden]')).map(region=>{
          const selector='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
          const controls=[...region.querySelectorAll(selector)].filter(element=>{
            if(element.closest('[inert],[hidden]'))return false;
            const style=getComputedStyle(element),rect=element.getBoundingClientRect();
            return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
          });
          return {tag:region.tagName.toLowerCase(),id:region.id||null,controls:controls.length,examples:controls.slice(0,3).map(element=>element.id||element.getAttribute('aria-label')||element.textContent?.trim().slice(0,40)||element.tagName.toLowerCase())};
        }).filter(region=>region.controls>0).slice(0,12),
        offscreenFocusable:[...document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element=>{
          if(element.closest('[inert],[hidden]'))return false;
          const style=getComputedStyle(element),rect=element.getBoundingClientRect();
          if(style.display==='none'||style.visibility==='hidden'||rect.width<=0||rect.height<=0)return false;
          if(rect.right<0||rect.left>innerWidth)return true;
          if(rect.bottom>=0&&rect.top<=innerHeight)return false;
          for(let parent=element;parent;parent=parent.parentElement)if(getComputedStyle(parent).position==='fixed')return true;
          return false;
        }).slice(0,16).map(element=>({tag:element.tagName.toLowerCase(),id:element.id||null,text:element.textContent?.trim().slice(0,40)||'',left:Math.round(element.getBoundingClientRect().left),top:Math.round(element.getBoundingClientRect().top)})),
        images:[...document.images].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0,width:i.naturalWidth,height:i.naturalHeight})),
        headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>({level:e.tagName,text:e.textContent.trim()})),
        animations:document.getAnimations().map(a=>({state:a.playState,iterations:a.effect?.getTiming().iterations})),
        fonts:document.fonts.status,
        visualSignals:(()=>{
          const visible=[...document.querySelectorAll('main *,header *,nav *,footer *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight});
          const label=e=>({tag:e.tagName,id:e.id||null,text:e.textContent.trim().slice(0,80)});
          return {
            uppercaseLabels:visible.filter(e=>e.children.length===0&&/^[A-Z\s\d/·:.-]{4,48}$/.test(e.textContent.trim())&&/[A-Z]{3}/.test(e.textContent)).slice(0,30).map(label),
            shadowedSurfaces:visible.filter(e=>getComputedStyle(e).boxShadow!=='none').slice(0,30).map(e=>({...label(e),shadow:getComputedStyle(e).boxShadow})),
            repeatedGrids:visible.filter(e=>getComputedStyle(e).display==='grid'&&e.children.length>=3).slice(0,20).map(e=>({...label(e),children:e.children.length,columns:getComputedStyle(e).gridTemplateColumns})),
            textRoles:[...new Set(visible.filter(e=>e.children.length===0&&e.textContent.trim()).map(e=>{const s=getComputedStyle(e);return s.fontFamily+' / '+s.fontSize+' / '+s.fontWeight}))].slice(0,30),
            limit:'Opening viewport signals for contextual review; none is automatically a design failure or AI-authorship evidence.'
          };
        })()}));
      const traversal=scenario.traverse===false?{status:'skipped',reason:'Explicit scenario choice'}:await collectScrollEvidence(page,{capture:async step=>{
        await page.screenshot({path:path.join(folder,`scroll-${step.index}.png`)});
      }});
      await page.screenshot({path:path.join(folder,'page-after-scroll.png'),fullPage:true});
      for(const [index,action] of (scenario.actions||[]).entries()){
        try{
          let transition;
          if(action.type==='transition'){
            transition=await captureTransition(page,{targets:action.targets,durationMs:action.durationMs,
              actions:(action.actions||[]).map(item=>({atMs:item.atMs??0,run:()=>performAction(page,item)}))});
            await writeFile(path.join(folder,`transition-${index}.json`),JSON.stringify(transition,null,2));
            if(transition.status!=='captured')throw new Error(`Transition capture incomplete; inspect transition-${index}.json`);
          }else if(action.type==='decision-check'){
            const checked=await decisionChecks.check(page,{rules:action.rules});
            await writeFile(path.join(folder,`decision-${index}.json`),JSON.stringify(checked,null,2));
            if(checked.status!=='matched-decisions')throw new Error(`Project decisions ${checked.status}; inspect decision-${index}.json`);
          }else await performAction(page,action);
          steps.push({index,action,executed:true,...(transition?{transitionArtifact:`transition-${index}.json`,transitionSummary:transition.summary,transitionActions:transition.actions}:{})});
          await page.screenshot({path:path.join(folder,`step-${index}.png`)});
        }catch(error){steps.push({index,action,executed:false,error:String(error)});}
      }
      const interactionProbe=scenario.probe?await probeInteractions(page,scenario.probe,{onCase:async record=>{await page.screenshot({path:path.join(folder,`probe-${scenario.probe.cases.findIndex(c=>c.id===record.id)}.png`)});}}):null;
      await page.addStyleTag({content:'*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}'});
      const spacing=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
      await page.screenshot({path:path.join(folder,'text-spacing.png'),fullPage:true});
      results.push({name,measurements,traversal,textSpacing:spacing,interactionProbe,errors,responses,steps});
    }catch(error){results.push({name,error:String(error),errors,responses,steps});}
    finally{await context.close();}
  }
}finally{await browser.close();}
await writeFile(path.join(out,'report.json'),JSON.stringify({schema:3,url:flags.url,results,
  limitations:['Browser emulation only; videos recorded but not automatically watched.','Executed actions are not assertions of correct business results.','No visual-quality, screen-reader or field-performance certification.']},null,2));
console.log(JSON.stringify({out,viewports:results.length,actionFailures:results.flatMap(r=>r.steps||[]).filter(x=>!x.executed).length}));
