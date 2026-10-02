// Source-level CSS footprint contract, checked against observed Mac border boxes.
// This does not replace computed-style/Range measurements or pixel review in a browser.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const gallery=process.argv[2]||path.resolve(__dirname,'../skills/seenry/assets/components/transitions/gallery.html');
const html=fs.readFileSync(gallery,'utf8');
const fixture=process.argv[3]||path.resolve(__dirname,'fixtures/transitions/mac-spaced-title-observed.json');
const runs=JSON.parse(fs.readFileSync(fixture,'utf8')).runs;
assert(html.includes('.covers{grid-template-columns:repeat(3,minmax(0,1fr))}'));
assert(html.includes('.cover-card{display:block;padding:6px;margin:-6px;'));
assert(html.includes('.stage{height:300px;min-height:300px;border:0;border-radius:12px;background:var(--stage);padding:20px 20px 60px;'));
assert(html.includes('.stage:has(.covers){container-type:inline-size}'));
const query=/@container\(max-width:(\d+)px\)\{\s*\.covers\{grid-template-columns:1fr/.exec(html);assert(query,'Album-row query must exist');
const threshold=Number(query[1]),gap=12,padding=6,margin=-6,coverCap=420;
const gridTrack=width=>(Math.min(width,coverCap)-2*gap)/3;
// Stretch sizing subtracts margins. Negative inline margins enlarge the button border box.
const sourceBorder=width=>gridTrack(width)-2*margin;
const availableTitleWidth=width=>sourceBorder(width)-padding;
const observations=[];
for(const width of [390,1440]){
 const r=runs.find(r=>r.width===width&&r.spaced),g=r.g;
 // Surface inset12 + stage padding20 => container content = surface width -16.
 const contentWidth=g.st.w+24-40,predicted=sourceBorder(contentWidth);
 assert(Math.abs(predicted-g.sf.w)<.02,`${width}: observed button border box must include its negative margins`);
 assert(contentWidth<=threshold,`${width}: baseline tile must use the row layout`);
 observations.push({viewport:width,contentWidth,observedSourceWidth:g.sf.w,predictedSourceWidth:predicted});
}
const measuredTitle=108.515625,boundaries=[];
for(const width of [360.001,360.5,361,362,364,368,384,400,420,480]){
 const available=availableTitleWidth(width);assert(available>=measuredTitle,`Night Swim does not fit at ${width}`);
 boundaries.push({contentWidth:width,gridTrackWidth:gridTrack(width),sourceBorderWidth:sourceBorder(width),availableTitleWidth:available,remaining:available-measuredTitle});
}
const minimumContentWidth=3*(measuredTitle+padding+2*margin)+2*gap;
assert.equal(minimumContentWidth,331.546875);assert(threshold>minimumContentWidth);
const result={scope:'Static CSS footprint plus observed Mac geometry; no fresh browser pass claimed',threshold,minimumContentWidth,maximumTitleAtFirstThreeColumnWidth:availableTitleWidth(threshold),observations,boundaries,longerLabels:'Golden Hour and Greenhouse need actual destination Range measurements near the threshold; this contract only proves the recorded Night Swim footprint.'};
const longestFixture=JSON.parse(fs.readFileSync(path.resolve(__dirname,'fixtures/transitions/mac-longest-title-boundary-observed.json'),'utf8'));
const widthsByTitle=new Map();let observedBlankRuns=0;
for(const run of longestFixture.runs){
 const title=run.settled.title||run.settled;const width=title.rect.width;const name=run.layout.sourceText;widthsByTitle.set(name,Math.max(width,widthsByTitle.get(name)||0));
 const blanks=run.trace.filter(row=>!row.title.painted&&!row.ghosts.some(t=>t.painted)).length;
 if(name==='Golden Hour'&&run.contentWidth===361){assert(blanks>=20,'Known sustained RAF blank must remain represented');observedBlankRuns++;assert.equal(run.status,'failed');}
 else {assert.equal(blanks,0,'Other actual cases did not blank');assert.equal(run.status,'passed');}
}
assert.equal(observedBlankRuns,1);assert.equal(widthsByTitle.size,3);assert.equal(widthsByTitle.get('Golden Hour'),118.875);
const pressScale=.98,clearance=4,longest=Math.max(...widthsByTitle.values());
const requiredWithoutClearance=3*(longest/pressScale+padding+2*margin)+2*gap;
const requiredWithClearance=3*((longest+clearance)/pressScale+padding+2*margin)+2*gap;
assert(threshold>=requiredWithClearance,'Row cutoff must fit the longest observed label plus4px clearance at full press scale');assert(threshold<coverCap,'Generic unanchored breakpoint remains below420px; the anchored catalog opts into rows');
const labelBoundaries=[];
for(const contentWidth of [320,360,361,362.625,368,369.904,384,384.01,385,400,420,480])for(const [title,width] of widthsByTitle){
 const rows=contentWidth<=threshold,available=(rows?contentWidth-84:availableTitleWidth(contentWidth))*pressScale;
 assert(available>=width,`${title} cannot disappear at ${contentWidth}px under held press`);
 if(!rows)assert(available>=width+clearance,`${title} lacks measured clear room at ${contentWidth}px`);
 labelBoundaries.push({contentWidth,title,width,rows,available,remaining:available-width});
}
assert(html.includes('.cover-card:active{transform:scale(.98)}'),'Press scale contract must match source');
result.longestLabels={observedBlankRuns,widths:Object.fromEntries(widthsByTitle),pressScale,clearance,requiredWithoutClearance,requiredWithClearance,labelBoundaries};
result.longerLabels='All three observed destination envelopes are now included; fresh native rendering remains required.';
const browserHarness=fs.readFileSync(path.resolve(__dirname,'transitions-library-title-boundary.browser.mjs'),'utf8');
const pressFunction=browserHarness.slice(browserHarness.indexOf('function heldPressObserved('),browserHarness.indexOf('const browser=await chromium.launch'));
const heldPressObserved=require('node:vm').runInNewContext(pressFunction+';heldPressObserved');
const pointer={active:true,hover:true,hoverCapable:true,coarse:false,transform:'matrix(.98,0,0,.98,0,0)'},touch={active:true,hover:false,hoverCapable:false,coarse:true,transform:'matrix(.98,0,0,.98,0,0)'};
assert(heldPressObserved(pointer));assert(heldPressObserved(touch));
assert(heldPressObserved({...pointer,transform:'matrix(.980019,0,0,.980019,0,0)'}),'Subpixel settling residue still realizes the authored press scale');
assert.equal(heldPressObserved({...pointer,transform:'matrix(.99,0,0,.99,0,0)'}),false,'A materially incomplete press does not meet the contract');
for(const p of [{...pointer,active:false},{...pointer,transform:'none'},{...pointer,transform:'matrix(1,0,0,1,0,-1)'},{...touch,transform:'matrix(1,0,0,1,0,-1)'},{...touch,transform:'matrix(.98,0,0,1,0,0)'}])assert.equal(heldPressObserved(p),false,'Unrealized, translated or non-uniform input cannot count as held-state coverage');
const anchored={...pointer,anchored:true,transform:'none',artworkTransform:'matrix(.98,0,0,.98,0,0)'};assert(heldPressObserved(anchored));for(const p of [{...anchored,active:false},{...anchored,transform:'matrix(.98,0,0,.98,0,0)'},{...anchored,transform:'matrix(1,0,0,1,0,-1)'},{...anchored,artworkTransform:'none'},{...anchored,artworkTransform:'matrix(.99,0,0,.99,0,0)'}])assert.equal(heldPressObserved(p),false,'Anchored input requires genuine active artwork press and a stationary action lane');
assert(browserHarness.includes('page.waitForFunction(heldPressObserved,await target.elementHandle(),{timeout:100})'),'Only a bounded100ms observable input precondition wait is permitted');
assert(browserHarness.includes('run.pressedInitial=await pressed()')&&browserHarness.includes('observedHoldMs:'),'Initial/final input measurements and actual hold timing must remain recorded');
result.heldPressPreconditions='9positive/negative helper checks; hover remains still and held input uses authored .98 scale. Actual pointer evidence does not prove physical coarse-device coverage.';
if(process.argv[4])fs.writeFileSync(process.argv[4],JSON.stringify(result,null,2)+'\n');
console.log(`PASS historical unanchored source-border model plus anchored held-artwork checks:2 observed source-border checks,10 Night Swim boundaries,36 all-label/press-scale boundaries; longest required${requiredWithoutClearance.toFixed(6)}px, +4px clearance${requiredWithClearance.toFixed(6)}px, row cutoff${threshold}px; fresh render pending`);
