// Optional host adapter. Install Playwright in the project or pass its module file.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const flags=Object.fromEntries(process.argv.slice(2).reduce((rows,value,i,all)=>value.startsWith('--')?[...rows,[value.slice(2),all[i+1]]]:rows,[]));
if(!flags.url||!flags.out)throw new Error('Use --url URL --out DIRECTORY [--playwright MODULE] [--scenario JSON]');
const out=path.resolve(flags.out);await mkdir(path.dirname(out),{recursive:true});
try{await mkdir(out);}catch(error){if(error.code==='EEXIST')throw new Error('Use a new output directory; preserve earlier captures and reports.');throw error;}
const {chromium}=await import(flags.playwright?pathToFileURL(path.resolve(flags.playwright)).href:'playwright');
const scenario=flags.scenario?JSON.parse(await readFile(flags.scenario,'utf8')):{actions:[]};
const browser=await chromium.launch({headless:true});const results=[];
try{
  for(const [name,width,reduced] of [['wide',1440,false],['narrow',390,false],['reflow',320,true]]){
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
      for(const [index,action] of (scenario.actions||[]).entries()){
        try{
          const locator=action.selector?page.locator(action.selector):null;
          if(action.type==='click')await locator.click({timeout:4000});
          else if(action.type==='fill')await locator.fill(action.value,{timeout:4000});
          else if(action.type==='press'){if(locator)await locator.press(action.key,{timeout:4000});else await page.keyboard.press(action.key);}
          else if(action.type==='scroll')await page.evaluate(p=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*p,behavior:'instant'}),action.progress);
          else if(action.type==='wait')await page.waitForTimeout(Math.min(action.ms||200,2000));
          else if(action.type==='visible')await locator.waitFor({state:'visible',timeout:3000});
          else throw new Error('Unsupported action type: '+action.type);
          steps.push({index,action,executed:true});
          await page.screenshot({path:path.join(folder,`step-${index}.png`)});
        }catch(error){steps.push({index,action,executed:false,error:String(error)});}
      }
      await page.addStyleTag({content:'*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}'});
      const spacing=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
      await page.screenshot({path:path.join(folder,'text-spacing.png'),fullPage:true});
      results.push({name,measurements,textSpacing:spacing,errors,responses,steps});
    }catch(error){results.push({name,error:String(error),errors,responses,steps});}
    finally{await context.close();}
  }
}finally{await browser.close();}
await writeFile(path.join(out,'report.json'),JSON.stringify({schema:1,url:flags.url,results,
  limitations:['Browser emulation only; videos recorded but not automatically watched.','Executed actions are not assertions of correct business results.','No visual-quality, screen-reader or field-performance certification.']},null,2));
console.log(JSON.stringify({out,viewports:results.length,actionFailures:results.flatMap(r=>r.steps||[]).filter(x=>!x.executed).length}));
