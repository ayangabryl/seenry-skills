// Deterministic strip geometry contracts; browser input/rendering is checked separately.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.argv[2]||path.resolve(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js'),'utf8');
let parts,stops=0;
const scope={tabParts:()=>parts,getComputedStyle:()=>({clipPath:'none'}),reduced:()=>false,stop:()=>stops++};
vm.createContext(scope);
vm.runInContext(source.slice(source.indexOf(' function parseInset('),source.indexOf(' function tabParts(')),scope);
vm.runInContext(source.slice(source.indexOf(' function revealTab('),source.indexOf(' function tabSelect(')),scope);
const cases=[];const check=(name,fn)=>{fn();cases.push(name);};
const list={clientWidth:200,clientLeft:2,scrollLeft:0,getBoundingClientRect:()=>({left:20}),scrollTo(options){assert.equal(options.behavior,'instant');this.scrollLeft=options.left;}};
const tab=(left,width)=>({getBoundingClientRect:()=>({left,right:left+width,width})});
check('A visible tab does not scroll the strip or page',()=>{scope.revealTab(list,tab(22,70));assert.equal(list.scrollLeft,0);});
check('An end tab reveals fully using the strip only',()=>{scope.revealTab(list,tab(220,70));assert.equal(list.scrollLeft,68);});
check('Returning to the leading tab scrolls back locally',()=>{scope.revealTab(list,tab(-46,70));assert.equal(list.scrollLeft,0);});
check('An oversized tab preserves its leading text rather than chasing the trailing edge',()=>{scope.revealTab(list,tab(22,250));assert.equal(list.scrollLeft,0);});
const tabs=[{offsetLeft:0,offsetWidth:76},{offsetLeft:80,offsetWidth:56},{offsetLeft:140,offsetWidth:58},{offsetLeft:202,offsetWidth:78}];
const ind={style:{}},root={dataset:{st:'tabs'}};parts={list,ind,ink:null,tabs};
check('Offscreen selection receives a painted indicator over the full content width',()=>{scope.indicate(root,tabs[3],false,true);assert.equal(ind.style.width,'280px');assert.equal(ind.style.right,'auto');assert.equal(ind.style.clipPath,'inset(0px 0px 0px 202px round 2px)');});
check('Narrower content retires previous indicator width instead of keeping phantom overflow',()=>{parts.tabs=[{offsetLeft:0,offsetWidth:70},{offsetLeft:74,offsetWidth:70}];scope.indicate(root,parts.tabs[1],false,true);assert.equal(ind.style.width,'200px');assert.equal(ind.style.clipPath,'inset(0px 56px 0px 74px round 2px)');});
check('Segmented controls retain their viewport-width indicator contract',()=>{const own={style:{}};parts={list,ind:own,ink:null,tabs};scope.indicate({dataset:{st:'segmented'}},tabs[1],false,true);assert.equal(own.style.width,undefined);assert.equal(own.style.clipPath,'inset(0px 64px 0px 80px round 8px)');});
const syncStart=source.indexOf('    const sync = () => { if (!el.isConnected) return ro.disconnect(); layoutInk(parts)');
const syncCode=source.slice(syncStart,source.indexOf('\n    const ro = new ResizeObserver(sync);',syncStart));
const selected={offsetLeft:202,offsetWidth:78,getAttribute:()=> 'true',getBoundingClientRect:()=>({left:224-list.scrollLeft,right:302-list.scrollLeft,width:78})};
const syncScope={el:{isConnected:true,dataset:{st:'tabs'}},parts:{list,tabs:[selected]},ro:{disconnect(){}},layoutInk(){},indicate(){},revealTab:scope.revealTab};
vm.createContext(syncScope);vm.runInContext(syncCode+'\nthis.runSync=sync;',syncScope);
check('Resize synchronization reveals the selected tab after a wide strip narrows',()=>{list.clientWidth=400;list.scrollLeft=0;syncScope.runSync();assert.equal(list.scrollLeft,0);list.clientWidth=200;syncScope.runSync();assert.equal(list.scrollLeft,80);});
check('Synchronization after reparent restores local visibility without changing selection',()=>{list.scrollLeft=0;syncScope.runSync();assert.equal(list.scrollLeft,80);assert.equal(selected.getAttribute('aria-selected'),'true');});
check('Segmented synchronization never introduces tab-strip scrolling',()=>{syncScope.el.dataset.st='segmented';list.scrollLeft=0;syncScope.runSync();assert.equal(list.scrollLeft,0);});
check('Fixed-width segmented lists observe each actual tab footprint',()=>{
 const start=source.indexOf('    const ro = new ResizeObserver(sync);'),end=source.indexOf('\n    tabSelect(el,',start),observed=new Set();let syncCalls=0;
 const tab1={},tab2={},list={};const c={parts:{list,tabs:[tab1,tab2]},sync:()=>syncCalls++,ResizeObserver:class{constructor(cb){this.callback=cb;}observe(e){observed.add(e);}}};
 vm.createContext(c);vm.runInContext(source.slice(start,end),c);assert(observed.has(list));assert(observed.has(tab1)&&observed.has(tab2),'Changing a tab width without resizing the list must still synchronize ink');
 if(observed.has(tab1))c.sync();assert.equal(syncCalls,1);
});
check('Observed spacing fixture preserves actual stale header geometry',()=>{
 const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/transitions/mac-segmented-ink-observed.json'),'utf8'));assert.equal(fixture.pairs.length,2);
 for(const pair of fixture.pairs){assert(pair.original.rect.width>pair.copy.rect.width);assert(Math.abs(pair.original.glyphRects[0].x-pair.copy.glyphRects[0].x)>2,'Original failure must retain visible glyph displacement');}
});
check('Ink copies use current tab boxes and text spacing, including word spacing',()=>{
 const children=[],ink={getBoundingClientRect:()=>({left:735,top:15}),replaceChildren:(...items)=>children.push(...items)},tabs=[{textContent:'System',getBoundingClientRect:()=>({left:735,top:15,width:87.234375,height:34})}];
 const c={doc:{createElement:()=>({style:{}})},getComputedStyle:()=>({font:'500 14px/21px sans-serif',letterSpacing:'1.68px',wordSpacing:'2.24px'})};vm.createContext(c);vm.runInContext(source.slice(source.indexOf(' function layoutInk('),source.indexOf(' function revealTab(')),c);c.layoutInk({ink,list:{getBoundingClientRect:()=>({})},tabs});
 assert.equal(children[0].style.width,'87.234375px');assert.equal(children[0].style.letterSpacing,'1.68px');assert.equal(children[0].style.wordSpacing,'2.24px');assert.equal(children[0].textContent,'System');
});
assert(stops>=3);console.log(`${cases.length}/${cases.length} tab strip geometry checks passed; browser input/render acceptance separate`);
