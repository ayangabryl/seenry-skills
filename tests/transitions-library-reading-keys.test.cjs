// Production inline reading-region handler against deterministic event/scroll models.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.argv[2]?path.dirname(path.resolve(process.argv[2])):path.resolve(__dirname,'../skills/seenry/assets/components/transitions');
const html=fs.readFileSync(path.join(root,'gallery.html'),'utf8');
const start=html.indexOf(' function scrollMessageByKey('),end=html.indexOf(" $('mail-view').addEventListener('keydown',scrollMessageByKey);",start);
assert(start>=0&&end>start,'Real scoped reading-region key handler must exist');const scope={document:{activeElement:null}};vm.createContext(scope);vm.runInContext(html.slice(start,end),scope);
let count=0;function fixture(options={}){const region={scrollHeight:129,clientHeight:100,scrollTop:0,matches:s=>s==='#mail-view > .detail[tabindex="0"]',...options};scope.document.activeElement=region;return region;}
function event(region,key,extra={}){return {target:region,key,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra};}
function check(name,fn){fn();count++;console.log('PASS',name);}
check('End consumes the region key and reveals full scroll extent',()=>{const r=fixture(),e=event(r,'End');scope.scrollMessageByKey(e);assert.equal(r.scrollTop,29);assert(e.defaultPrevented);});
check('Home returns to the region start',()=>{const r=fixture({scrollTop:29}),e=event(r,'Home');scope.scrollMessageByKey(e);assert.equal(r.scrollTop,0);assert(e.defaultPrevented);});
check('Rapid Home then End follows latest input without deferred stale work',()=>{const r=fixture({scrollTop:29});scope.scrollMessageByKey(event(r,'Home'));scope.scrollMessageByKey(event(r,'End'));assert.equal(r.scrollTop,29);});
check('PageDown advances by viewport and clamps at last content',()=>{const r=fixture({scrollHeight:350});scope.scrollMessageByKey(event(r,'PageDown'));assert.equal(r.scrollTop,100);scope.scrollMessageByKey(event(r,'PageDown'));scope.scrollMessageByKey(event(r,'PageDown'));assert.equal(r.scrollTop,250);});
check('PageUp clamps at beginning',()=>{const r=fixture({scrollTop:29});scope.scrollMessageByKey(event(r,'PageUp'));assert.equal(r.scrollTop,0);});
for(const modifier of ['altKey','ctrlKey','metaKey','shiftKey'])check(modifier+' preserves native shortcut/selection',()=>{const r=fixture(),e=event(r,'End',{[modifier]:true});scope.scrollMessageByKey(e);assert.equal(r.scrollTop,0);assert.equal(e.defaultPrevented,false);});
check('Nested editable/control targets retain their own keys',()=>{const r=fixture({matches:()=>false}),e=event(r,'End');scope.scrollMessageByKey(e);assert.equal(r.scrollTop,0);assert.equal(e.defaultPrevented,false);});
check('Already handled keys are untouched',()=>{const r=fixture(),e=event(r,'End',{defaultPrevented:true,preventDefault(){throw Error('unexpected')}});scope.scrollMessageByKey(e);assert.equal(r.scrollTop,0);});
check('Unrelated keys remain native',()=>{const r=fixture(),e=event(r,'ArrowDown');scope.scrollMessageByKey(e);assert.equal(r.scrollTop,0);assert.equal(e.defaultPrevented,false);});
check('Nonoverflowing region delegates document navigation',()=>{const r=fixture({scrollHeight:100}),e=event(r,'End');scope.scrollMessageByKey(e);assert.equal(e.defaultPrevented,false);});
check('Unfocused synthetic region does not hijack navigation',()=>{const r=fixture(),e=event(r,'End');scope.document.activeElement={};scope.scrollMessageByKey(e);assert.equal(e.defaultPrevented,false);assert.equal(r.scrollTop,0);});
check('IME composition is never intercepted',()=>{const r=fixture(),e=event(r,'End',{isComposing:true});scope.scrollMessageByKey(e);assert.equal(e.defaultPrevented,false);assert.equal(r.scrollTop,0);});
check('Missing event target is safe',()=>scope.scrollMessageByKey(event(null,'End')));
console.log(`${count}/${count} reading-key contracts pass; actual native input acceptance separate`);
