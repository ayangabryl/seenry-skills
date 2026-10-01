// Regression checks for actual Mac-rendered findings. Timing/render claims require browser rerun.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../skills/seenry/assets/components/transitions'),source=fs.readFileSync(path.join(root,'seenry-transitions.js'),'utf8');
const html=fs.readFileSync(path.join(root,'gallery.html'),'utf8'),css=fs.readFileSync(path.join(root,'seenry-transitions.css'),'utf8'),gallery=fs.readFileSync(path.join(root,'gallery.js'),'utf8');
let completed=false;process.on('beforeExit',()=>{if(!completed){console.error('Rendered-finding regression harness did not complete');process.exitCode=1}});
const cases=[]; const record=(name,check)=>{check();cases.push({name,pass:true});};
const collapse=source.slice(source.indexOf(' function collapse(detail) {'),source.indexOf(' /* ---------- Page:',source.indexOf(' function collapse(detail) {')));
(async()=>{
 for(const reduced of [false,true]){
  let complete;
  const geometry=()=>({left:0,top:0,right:200,bottom:100,width:200,height:100});
  const trigger={style:{visibility:'hidden'},attrs:{},setAttribute(k,v){this.attrs[k]=v},getBoundingClientRect:geometry,focus(){}};
  const detail={dataset:{stOpen:'true'},inert:false,style:{},contains:()=>false,tagName:'DIV',getBoundingClientRect:geometry};
  const state={open:true,closing:false,version:1,source:trigger};
  const active=new Set([detail]);
  const pending=()=>new Promise(resolve=>{complete=resolve});
  const scope={layerState:()=>state,q:()=>null,qa:()=>[],doc:{activeElement:null},getComputedStyle:()=>({borderRadius:'12px',borderTopLeftRadius:'12px'}),reduced:()=>reduced,active,stopAll(){},parseInset:()=>[0,0,0,0],cardClip:()=>'',sharedPairs:()=>[],travel:pending,play:reduced?pending:()=>Promise.resolve(true)};
  vm.createContext(scope);vm.runInContext(collapse,scope);scope.collapse(detail);
  record(`Collapse publishes closed logical state immediately (reduce=${reduced})`,()=>{assert.equal(detail.dataset.stOpen,'false');assert.equal(detail.dataset.stClosing,'true');assert.equal(detail.inert,true);assert.equal(trigger.attrs['aria-expanded'],'false');});
  // Simulate the next open's authoritative state/version while old exit is pending.
  state.open=true;state.closing=false;state.version++;detail.dataset.stOpen='true';delete detail.dataset.stClosing;detail.inert=false;
  complete(true);await Promise.resolve();await Promise.resolve();
  record(`Stale collapse completion preserves reopened card (reduce=${reduced})`,()=>{assert.equal(detail.dataset.stOpen,'true');assert.equal(detail.inert,false);assert(active.has(detail));});
 }
 record('Closing card remains painted while logically closed',()=>assert(css.includes('[data-st="expand"]:not([data-st-open="true"]):not([data-st-closing="true"]) { visibility: hidden; }')));
 record('Reopening clears closing presentation marker',()=>assert(source.includes("detail.dataset.stOpen = 'true'; delete detail.dataset.stClosing;")));
 const filterFunctions=gallery.slice(gallery.indexOf(' function updateFilterOverflow()'),gallery.indexOf(" filterList.addEventListener('scroll'"));
 const filterList={scrollWidth:653,clientWidth:320,scrollLeft:0,getBoundingClientRect:()=>({right:320}),querySelectorAll:()=>[{getBoundingClientRect:()=>({right:650-filterList.scrollLeft})}]},filterScroll={dataset:{}};
 const filterScope={filterList,filterScroll};vm.createContext(filterScope);vm.runInContext(filterFunctions,filterScope);
 record('Overflow cue appears only while more categories remain',()=>{filterScope.updateFilterOverflow();assert.equal(filterScroll.dataset.more,'true');filterList.scrollLeft=330;filterScope.updateFilterOverflow();assert.equal(filterScroll.dataset.more,'false');});
 record('Selected category is revealed without keyboard motion delay',()=>{let observed;filterScope.revealFilterTab({scrollIntoView:o=>observed=o});assert.equal(observed.inline,'nearest');assert.equal(observed.behavior,'instant');});
 record('Final responsive layer replaces fixed 190px filter viewport',()=>{const final=html.slice(html.indexOf('/* Rendered QA:'));assert(final.includes('.filter-scroll .filter [role=tablist]{width:100%;min-width:0'));assert(final.includes('flex:1 1 0;min-width:0'));});
 record('Photo caption does not assert unsupported city identity',()=>{assert(html.includes('Mountain retreat'));assert(!html.includes('Lisbon, 6:42 pm'));});
 record('Tooltip placeholder width is bounded by its preview',()=>assert(html.includes('[data-key="tooltip"] .editor-line{width:min(300px,100%);max-width:100%}')));
 record('Narrow album previews recompose into readable rows',()=>{assert(html.includes('.covers{grid-template-columns:1fr;gap:8px}'));assert(html.includes('grid-template-columns:60px minmax(0,1fr)'));});
 record('Narrow state buttons stack instead of clipping labels',()=>assert(html.includes('[data-key="button"] .stack-center>.row{flex-direction:column;align-items:stretch;width:100%}')));
 record('Destructive action cannot shrink below its own label',()=>assert(html.includes('.stage .settings-card .field-row:last-child>.st-button{flex:0 0 auto;white-space:nowrap}')));
 record('Narrow list and switch content reserve a separate Replay lane',()=>assert(html.includes('[data-key="list"] .stage,[data-key="switch"] .stage{height:auto;min-height:300px;padding-bottom:78px}')));
 record('Narrow list actions can wrap without ejecting Add',()=>{assert(html.includes('.stage .tasks .app-bar{height:auto;min-height:40px;padding:8px;flex-wrap:wrap;gap:6px}'));assert(html.includes('.tasks #sort-btn{min-width:0;flex:1}'));});
 record('Trailing padding cannot cover the final category with a cue',()=>{filterList.scrollLeft=330;filterScope.updateFilterOverflow();assert.equal(filterScroll.dataset.more,'false');});
 record('Palette initialization scrolls only its result list',()=>{assert(!source.includes("opt.scrollIntoView?.({block: 'nearest'})"));assert(source.includes("const lb = opt.closest('[role=\"listbox\"]')"));});
 completed=true;console.log(`${cases.length}/${cases.length} rendered-finding logic/static regressions passed; browser retest pending`);
})().catch(e=>{console.error(e);process.exitCode=1});
