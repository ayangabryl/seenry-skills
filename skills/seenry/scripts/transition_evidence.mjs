/** Sample actual rendered state around host-owned actions. No product styles are changed. */
export async function captureTransition(page,{targets,durationMs=700,actions=[]}={}){
  if(!Array.isArray(targets)||!targets.length||targets.length>12)throw Error('Supply one to 12 observed targets');
  if(!Number.isFinite(durationMs)||durationMs<100||durationMs>5000)throw Error('Use 100–5000ms capture duration');
  const names=new Set();
  for(const t of targets){
    if(!t||typeof t.label!=='string'||!t.label||names.has(t.label)||typeof t.selector!=='string'||!t.selector)throw Error('Targets need unique labels and selectors');
    names.add(t.label);
    for(const key of['attributes','styles'])if(t[key]!==undefined&&(!Array.isArray(t[key])||t[key].length>8||t[key].some(x=>typeof x!=='string'||!x)))throw Error('Target fields must be bounded string lists');
  }
  if(!Array.isArray(actions)||actions.length>12||actions.some(a=>!Number.isFinite(a.atMs)||a.atMs<0||a.atMs>=durationMs||typeof a.run!=='function'))throw Error('Actions need an in-range atMs and a host callback');
  if(actions.some((a,i)=>i&&a.atMs<actions[i-1].atMs))throw Error('Actions must be in time order');
  const key='__seenry_probe_'+Date.now()+'_'+Math.random().toString(36).slice(2),performed=[];
  await page.evaluate(({key,targets,durationMs})=>{
    const started=performance.now(),state={frames:[],done:false,raf:null,timer:null,started};
    const sample=()=>({atMs:performance.now()-started,targets:targets.map(t=>{
      const elements=document.querySelectorAll(t.selector);if(elements.length!==1)return{label:t.label,matches:elements.length};
      const e=elements[0],r=e.getBoundingClientRect(),css=getComputedStyle(e);
      const attributes=Object.fromEntries((t.attributes||[]).map(k=>{const value=e.getAttribute(k);return[k,value===null?null:value.slice(0,3000)]}));
      return{label:t.label,matches:1,rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height},text:e.textContent.trim().slice(0,160),attributes,styles:Object.fromEntries((t.styles||['opacity','transform','background-color','color','border-color','box-shadow']).map(k=>[k,css.getPropertyValue(k)]))};
    })});
    const finish=()=>{if(state.done)return;state.frames.push(sample());state.done=true;cancelAnimationFrame(state.raf);clearTimeout(state.timer)};
    const tick=()=>{if(state.done)return;if(performance.now()-started>=durationMs){finish();return}state.frames.push(sample());state.raf=requestAnimationFrame(tick)};
    state.frames.push(sample());state.raf=requestAnimationFrame(tick);state.timer=setTimeout(finish,durationMs+150);state.stop=finish;window[key]=state;
  },{key,targets,durationMs});
  const nodeStarted=Date.now();let result;
  try{
    for(const action of actions){
      await page.waitForTimeout(Math.max(0,action.atMs-(Date.now()-nodeStarted)));
      const atMs=await page.evaluate(key=>performance.now()-window[key].started,key);
      try{await action.run(page);const completedAtMs=await page.evaluate(key=>performance.now()-window[key].started,key);performed.push({requestedAtMs:action.atMs,observedAtMs:atMs,completedAtMs,executed:true})}
      catch(error){performed.push({requestedAtMs:action.atMs,observedAtMs:atMs,executed:false,error:String(error)});break}
    }
    await page.waitForFunction(key=>window[key]?.done,key,{timeout:durationMs+2000});
    result=await page.evaluate(key=>({frames:window[key].frames}),key);
  }finally{
    await page.evaluate(key=>{window[key]?.stop?.();delete window[key]},key).catch(()=>{});
  }
  const report={schema:1,durationMs,targets,actions:performed,frames:result.frames,
    status:performed.some(a=>!a.executed||a.observedAtMs>durationMs||a.completedAtMs>durationMs)?'incomplete':'captured',
    limits:['Actual finite browser samples; no normal-speed human judgment or field-performance certification.','Executed actions are not proof of correct business results.','A missing/ambiguous target is recorded, not inferred to be stable.','The helper changes no product styles; only the supplied actions alter product state.','Only requested properties and attributes are sampled. No observed change does not establish that all animation is absent.','Attribute strings above 3000 characters are truncated.']};
  report.summary=summarizeTransition(report);return report;
}
export function summarizeTransition(report){
  return report.targets.map(t=>{
    const values=report.frames.map(f=>f.targets.find(x=>x.label===t.label)),present=values.filter(v=>v?.matches===1);
    const travel={};for(const edge of['left','top','right','bottom','width','height']){const numbers=present.map(v=>v.rect[edge]);travel[edge]=numbers.length?Math.max(...numbers)-Math.min(...numbers):null}
    const changedFields=field=>[...new Set(present.flatMap(v=>Object.keys(v[field])))].filter(k=>new Set(present.map(v=>v[field][k])).size>1);
    return{label:t.label,presentSamples:present.length,missingOrAmbiguousSamples:values.length-present.length,edgeTravel:travel,textChanged:new Set(present.map(v=>v.text)).size>1,changedAttributes:changedFields('attributes'),changedStyles:changedFields('styles')};
  });
}
