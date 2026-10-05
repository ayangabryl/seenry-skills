// Trusted, project-authored scenarios. No page-supplied code or aesthetic scoring.
const properties=new Set(['text','value','attribute','count','visible','checked','enabled']);
function string(value,label){if(typeof value!=='string'||!value.trim())throw new TypeError(`${label} needs a nonempty string`);}
function actions(list){if(!Array.isArray(list)||list.length>12)throw new TypeError('Use at most 12 actions per sequence');for(const a of list){if(!a||!['click','fill','press','select','check','uncheck'].includes(a.type))throw new TypeError('Unsupported probe action');string(a.selector,'Action selector');if(['fill','select'].includes(a.type)&&typeof a.value!=='string')throw new TypeError('Action value must be a string');if(a.type==='press')string(a.key,'Key');}}
function assertions(list){if(!Array.isArray(list)||!list.length||list.length>12)throw new TypeError('Supply 1–12 explicit assertions before and after the input');for(const a of list){if(!a||!properties.has(a.property))throw new TypeError('Unsupported assertion property');string(a.selector,'Assertion selector');if(a.property==='attribute')string(a.name,'Attribute');const kind=['visible','checked','enabled'].includes(a.property)?'boolean':a.property==='count'?'number':'string';if(a.expected!==null&&typeof a.expected!==kind)throw new TypeError('Expected value has the wrong type');if(a.expected===null&&a.property!=='attribute')throw new TypeError('Only an absent attribute uses null');if(kind==='number'&&(!Number.isInteger(a.expected)||a.expected<0))throw new TypeError('Count must be a nonnegative integer');}}
export function validateProbe(spec){
 if(!spec||!Array.isArray(spec.controls)||!spec.controls.length||spec.controls.length>24||new Set(spec.controls).size!==spec.controls.length)throw new TypeError('Declare 1–24 distinct decisive control IDs');spec.controls.forEach(x=>string(x,'Control ID'));
 if(!Array.isArray(spec.cases)||!spec.cases.length||spec.cases.length>36)throw new TypeError('Supply 1–36 focused interaction cases');const ids=new Set();
 for(const c of spec.cases){string(c.id,'Case ID');if(ids.has(c.id))throw new TypeError('Case IDs must be distinct');ids.add(c.id);if(!spec.controls.includes(c.control))throw new TypeError('Case control is not declared');actions(c.setup||[]);actions(c.actions);if(!c.actions.length)throw new TypeError('Each case must exercise its control');assertions(c.before);assertions(c.after);}
 return spec;
}
async function act(page,a){const el=page.locator(a.selector);if(await el.count()!==1)throw Error(`Action selector must match exactly once: ${a.selector}`);const opts={timeout:2500};if(a.type==='click')await el.click(opts);else if(a.type==='fill')await el.fill(a.value,opts);else if(a.type==='press')await el.press(a.key,opts);else if(a.type==='select')await el.selectOption(a.value,opts);else if(a.type==='check')await el.check(opts);else await el.uncheck(opts);}
async function observe(page,a){const el=page.locator(a.selector),count=await el.count();if(a.property==='count')return count;if(count!==1)throw Error(`Assertion selector must match exactly once: ${a.selector}`);if(a.property==='text')return (await el.textContent()).trim();if(a.property==='value')return el.inputValue();if(a.property==='attribute')return el.getAttribute(a.name);if(a.property==='visible')return el.isVisible();if(a.property==='checked')return el.isChecked();return el.isEnabled();}
async function verify(page,list){const result=[];for(const a of list){try{const actual=await observe(page,a);result.push({...a,actual,passed:Object.is(actual,a.expected)});}catch(error){result.push({...a,passed:false,error:String(error)});}}return result;}
export async function probeInteractions(page,spec,{onCase}={}){
 validateProbe(spec);const cases=[];
 for(const c of spec.cases){const record={id:c.id,control:c.control,setup:[],actions:[],before:[],after:[],status:'unverified'};
  try{
   for(const action of c.setup||[]){await act(page,action);record.setup.push({action,executed:true});}
   record.before=await verify(page,c.before);
   if(record.before.some(x=>!x.passed)){record.status='failed-precondition';}
   else{for(const action of c.actions){await act(page,action);record.actions.push({action,executed:true});}record.after=await verify(page,c.after);record.status=record.after.every(x=>x.passed)?'passed':'failed-result';}
  }catch(error){record.status='failed-action';record.error=String(error);}
  if(onCase)await onCase(record);cases.push(record);
 }
 const exercised=[...new Set(cases.filter(c=>c.actions.length).map(c=>c.control))],missing=spec.controls.filter(c=>!exercised.includes(c));
 return {schema:1,url:page.url(),viewport:page.viewportSize(),status:cases.some(c=>c.status!=='passed')?'failed':missing.length?'unverified':'passed',controls:spec.controls,exercised,missing,cases,
  limits:['Covers only declared controls, cases and expected values; the author must identify the meaningful task.','Synchronous state assertions run after actual input; use the application test runner for asynchronous completion, files, network and deeper invariants.','A passed probe is neither visual acceptance nor proof of complete product behavior.']};
}
