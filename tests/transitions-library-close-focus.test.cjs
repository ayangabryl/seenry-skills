// Replays the actual candidate10 accessibility findings and tests the production focus
// handoff. This is a causal/state check; rendered focus and contrast need native pixels.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const input=process.argv[2]||path.resolve(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js'),source=fs.readFileSync(input,'utf8');
const gallery=fs.readFileSync(process.argv[4]||path.resolve(path.dirname(input),'gallery.html'),'utf8');
const observed=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/transitions/mac-close-focus-observed.json'),'utf8'));
const helper=source.slice(source.indexOf(' const expandCloseFocus ='),source.indexOf(' // Close belongs to the currently painted card'));
assert(helper.includes('function revealFocusedExpandClose('),'Focused Close needs an opacity-channel handoff, not a delayed focus workaround');
const calls=[],scope={WeakMap,stop:(element,channel)=>calls.push({element,channel})};vm.createContext(scope);vm.runInContext(helper,scope);
class Control{
 constructor(visible=false){this.visible=visible;this.style={opacity:'.7',translate:'3px 4px',zIndex:'9',background:'navy'};this.handlers={};this.focused=false;}
 matches(s){assert.equal(s,':focus-visible');return this.visible;}
 addEventListener(name,handler){(this.handlers[name]||=([])).push(handler);}
 emit(name){for(const handler of this.handlers[name]||[])handler();}
}
const results=[],record=(name,fn)=>{calls.length=0;fn();results.push({name,pass:true});};
const expectedStops=(control,surface)=>{assert.equal(calls.length,2);assert.equal(calls[0].element,control);assert.equal(calls[1].element,surface);assert(calls.every(c=>c.channel==='o'));};
record('Pointer focus retains the authored Close and surface entrance choreography',()=>{
 const c=new Control(false),surface={contains:()=>true},state={open:true};scope.watchExpandCloseFocus(c,state,surface);c.emit('focus');scope.revealFocusedExpandClose(c);assert.equal(calls.length,0);
});
record('Native visible focus immediately cancels only the Close and owner-surface opacity channels',()=>{
 const c=new Control(true),surface={contains:()=>true},state={open:true},styles={...c.style};scope.watchExpandCloseFocus(c,state,surface);c.emit('focus');expectedStops(c,surface);assert.deepEqual(c.style,styles);
});
record('A still-focused reversal gets the same immediate handoff without waiting for another focus event',()=>{
 const c=new Control(true),surface={contains:()=>true},state={open:true};scope.watchExpandCloseFocus(c,state,surface);scope.revealFocusedExpandClose(c);expectedStops(c,surface);
});
record('Keyboard input on an already pointer-focused Close reveals native visible focus',()=>{
 const c=new Control(false),surface={contains:()=>true},state={open:true};scope.watchExpandCloseFocus(c,state,surface);c.emit('focus');assert.equal(calls.length,0);c.visible=true;c.emit('keydown');expectedStops(c,surface);
});
record('Reduced-motion parent fade cannot hide a focused original button',()=>{
 const c=new Control(true),surface={reducedMotion:true,contains:()=>true},state={open:true};scope.watchExpandCloseFocus(c,state,surface);scope.revealFocusedExpandClose(c);expectedStops(c,surface);assert.equal(surface.reducedMotion,true);
});
record('Closed state does not interfere with outgoing opacity channels or authored styles',()=>{
 const c=new Control(true),surface={contains:()=>true},state={open:false},styles={...c.style};scope.watchExpandCloseFocus(c,state,surface);c.emit('focus');c.emit('keydown');assert.equal(calls.length,0);assert.deepEqual(c.style,styles);
});
record('Registration is idempotent and reused controls target only their current owner',()=>{
 const c=new Control(true),old={open:false},current={open:true},s1={contains:()=>true},s2={contains:()=>true};scope.watchExpandCloseFocus(c,old,s1);scope.watchExpandCloseFocus(c,current,s2);assert.equal(c.handlers.focus.length,1);assert.equal(c.handlers.keydown.length,1);c.emit('focus');expectedStops(c,s2);
});
record('Focused nested Close reveals only its owned ancestor path, leaving sibling details untouched',()=>{
 const c=new Control(true),surface={contains:()=>true},wrapper={parentElement:surface},sibling={parentElement:surface},state={open:true};c.parentElement=wrapper;scope.watchExpandCloseFocus(c,state,surface);scope.revealFocusedExpandClose(c);assert.deepEqual(calls.map(x=>x.element),[c,wrapper,wrapper,wrapper,surface]);assert(!calls.some(x=>x.element===sibling));assert.deepEqual(calls.map(x=>x.channel),['o','o','clip','t','o']);
});
record('A moved control cannot cancel opacity outside its recorded surface owner',()=>{
 const c=new Control(true),surface={contains:()=>false};scope.watchExpandCloseFocus(c,{open:true},surface);scope.revealFocusedExpandClose(c);assert.equal(calls.length,0);
});
record('Focus is acquired once before geometry, with no late re-acquisition or timing workaround',()=>{
 const expand=source.slice(source.indexOf(' function expand(source'),source.indexOf(' function collapse(detail)'));
 const focus=expand.indexOf('closeControl.focus?.({preventScroll: true})');assert(focus>expand.indexOf('watchExpandCloseFocus(closeControl, s, surface)'));assert(focus<expand.indexOf('const hangs ='));
 assert.equal((expand.match(/closeControl\.focus\?\./g)||[]).length,1);assert(expand.includes('if (!closeControl) focusFirst(detail);\n  if (closeControl) revealFocusedExpandClose(closeControl);'));
 assert(!helper.includes('setTimeout')&&!helper.includes('requestAnimationFrame'));assert(!helper.includes('.style.'));
});
record('Original Close owns hit testing above artwork with an opaque surface backing',()=>{
 assert(gallery.includes('.expand-surface .close-x{position:absolute;isolation:isolate;background:var(--frame);z-index:3}'));
 assert(source.includes("zIndex: '2'"));assert(!/\.expand-surface \.close-x:hover\{background:color-mix/.test(gallery),'Obsolete translucent hover backing must not override the opaque base');assert(gallery.includes('.expand-surface .close-x:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}'));
});
record('All explicit focus outlines use the defined shared focus-ring token',()=>{const css=fs.readFileSync(path.join(path.dirname(input),'seenry-transitions.css'),'utf8');assert(!gallery.includes('var(--focus)'));assert(css.includes('--focus-ring:')); /* Other controls’ legacy tokens are a separate catalogue finding. */assert(/--focus-ring:\s*#[0-9a-f]{6}/i.test(css));});
const stats={runs:0,invisibleFocusRuns:0,missingFocusRuns:0,stolenHitRuns:0,invisibleFocusFrames:0,stolenHitFrames:0};
for(const run of observed.runs){
 const frames=run.trace.filter(r=>r.open==='true'&&!r.closing);assert(frames.length>2);
 const invisible=frames.filter(r=>r.focusedClose&&r.close.focusVisible&&(!r.close.painted||r.close.opacity<.99));
 const missing=frames.filter(r=>!r.focusedClose||!r.close.focusVisible),stolen=frames.filter(r=>!r.close.ownsCenter);
 stats.runs++;stats.invisibleFocusRuns+=invisible.length>0;stats.missingFocusRuns+=missing.length>0;stats.stolenHitRuns+=stolen.length>0;stats.invisibleFocusFrames+=invisible.length;stats.stolenHitFrames+=stolen.length;
 record(`${run.label}-${run.delay}: preserve the actual opaque-focus failure as causal evidence`,()=>{assert.equal(run.geometryAndInputPassed,true);assert(invisible.length>0);assert.equal(missing.length,0);});
}
record('All9 actual focus failures and actual artwork hit theft remain represented',()=>{assert.equal(stats.runs,9);assert.equal(stats.invisibleFocusRuns,9);assert(stats.stolenHitRuns>0&&stats.stolenHitFrames>0);});
const report={sourceSha256:require('crypto').createHash('sha256').update(source).digest('hex'),scope:'Actual failure reproduction and production handoff state checks; fresh native rendering required',observed:stats,passed:results.length,total:results.length,results};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(`${results.length}/${results.length} focused Close state checks pass; actual candidate10 failures retained:${stats.invisibleFocusRuns}/9 opacity,${stats.stolenHitRuns} hit-ownership; no rendered pass claimed`);
