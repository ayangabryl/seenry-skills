/** Retain selected rendered relationships. This measures drift, not design quality. */
const KEYS=new Set(['left','right','top','bottom','width','height','centerX','centerY']);
const box=el=>{const b=el.getBoundingClientRect();return {left:b.left+scrollX,right:b.right+scrollX,top:b.top+scrollY,bottom:b.bottom+scrollY,width:b.width,height:b.height,centerX:b.left+scrollX+b.width/2,centerY:b.top+scrollY+b.height/2};};
const one=selector=>{const nodes=document.querySelectorAll(selector);if(nodes.length!==1)throw new Error(`Expected one element for ${selector}, found ${nodes.length}`);const el=nodes[0];if(!el.getClientRects().length||getComputedStyle(el).visibility==='hidden')throw new Error(`Target is not rendered: ${selector}`);return el;};
const sample=spec=>{
 const nodes=new Map(),targets=spec.targets.map(t=>{
  const el=one(t.selector);nodes.set(t.id,el);const style=getComputedStyle(el);
  return {id:t.id,styles:Object.fromEntries(t.styles.map(name=>{const value=style.getPropertyValue(name);if(!value.trim())throw new Error(`CSS property unavailable for ${t.id}: ${name}`);return [name,value];}))};
 });
 const relations=spec.relations.map(r=>({id:r.id,value:box(nodes.get(r.to))[r.toEdge]-box(nodes.get(r.from))[r.fromEdge]}));
 return {targets,relations};
};
function validate(spec){
 if(!spec||!Array.isArray(spec.targets)||!spec.targets.length||spec.targets.length>12||!Array.isArray(spec.relations)||spec.relations.length>24)throw new TypeError('Use 1–12 targets and at most 24 relationships');
 const ids=new Set();for(const t of spec.targets){if(!t.id||ids.has(t.id)||typeof t.selector!=='string'||!Array.isArray(t.styles)||t.styles.length>16||t.styles.some(s=>typeof s!=='string'||!s.trim()))throw new TypeError('Use unique target IDs, selectors and explicit CSS properties');ids.add(t.id);}
 const relations=new Set();for(const r of spec.relations){if(!r.id||relations.has(r.id)||!ids.has(r.from)||!ids.has(r.to)||!KEYS.has(r.fromEdge)||!KEYS.has(r.toEdge)||!Number.isFinite(r.tolerance)||r.tolerance<0||r.tolerance>100)throw new TypeError('Use unique relations between declared edges with a 0–100px tolerance');relations.add(r.id);}
 if(!spec.relations.length&&!spec.targets.some(t=>t.styles.length))throw new TypeError('Declare at least one property or relationship to retain');
}
export function captureDesignContinuity(spec,{sourceSha256,selectionNote}={}){
 validate(spec);
 if(document.fonts?.status==='loading')throw new Error('Wait for fonts before capturing the selected state');
 if(!/^[a-f0-9]{64}$/.test(sourceSha256||'')||typeof selectionNote!=='string'||!selectionNote.trim())throw new TypeError('Identify the selected source hash and why these relationships survived review');
 return {schema:1,kind:'selected rendered relationships; not visual acceptance',sourceSha256,selectionNote,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},spec:structuredClone(spec),observed:sample(spec),fontStatus:document.fonts?.status||'unavailable',limits:['Font-family is a computed declaration, not proof that its glyphs rendered.','Document coordinates compensate only root scrolling; sticky, fixed and nested scrolling require the same controlled state.','Capture settled states at the same viewport after fonts and transitions settle.','A retained relationship may need a deliberate revision; never preserve it against functional or responsive requirements.']};
}
export function compareDesignContinuity(contract){
 if(contract?.schema!==1)throw new TypeError('Unsupported continuity record');validate(contract.spec);
 if(innerWidth!==contract.viewport.width||innerHeight!==contract.viewport.height||devicePixelRatio!==contract.viewport.dpr)return {status:'unverified',reason:'Viewport or device scale differs; use the corresponding selected-width record',checks:[]};
 if(document.fonts?.status==='loading')return {status:'unverified',reason:'Fonts are still loading',checks:[]};
 let current;try{current=sample(contract.spec);}catch(error){return {status:'unverified',reason:error.message,checks:[]};}
 const checks=[];
 for(const expected of contract.observed.targets){const actual=current.targets.find(t=>t.id===expected.id);for(const [property,value]of Object.entries(expected.styles)){checks.push({target:expected.id,property,expected:value,actual:actual.styles[property],result:value===actual.styles[property]?'retained':'changed'});}}
 for(const expected of contract.observed.relations){const actual=current.relations.find(r=>r.id===expected.id),spec=contract.spec.relations.find(r=>r.id===expected.id),delta=actual.value-expected.value;checks.push({relation:expected.id,expected:expected.value,actual:actual.value,delta,tolerance:spec.tolerance,result:Math.abs(delta)<=spec.tolerance?'retained':'changed'});}
 return {status:checks.some(c=>c.result==='changed')?'changed':'retained',checks,current,limits:contract.limits};
}
