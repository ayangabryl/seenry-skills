// Production ghost() with modeled DOM scroll properties; actual paint needs browser review.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=process.argv[2]||path.resolve(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js');
const source=fs.readFileSync(file,'utf8');
class E{
 constructor(name='div'){this.name=name;this.children=[];this.dataset={};this.style={};this.attrs={};this.scrollLeft=0;this.scrollTop=0;this.clientLeft=0;this.clientTop=0;this.className='';this.classList={add:value=>this.className+=' '+value};}
 append(child){this.children.push(child);child.parentElement=this;}
 get firstElementChild(){return this.children[0]||null;}
 getBoundingClientRect(){return {left:10,top:20,width:220,height:206};}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='id')this.id=String(v);}
 removeAttribute(k){delete this.attrs[k];if(k==='id')delete this.id;if(k==='data-st')delete this.dataset.st;}
 cloneNode(deep){const c=new E(this.name);c.dataset={...this.dataset};c.style={...this.style};c.attrs={...this.attrs};c.id=this.id;c.className=this.className;if(deep)this.children.forEach(x=>c.append(x.cloneNode(true)));return c;}
}
const descendants=e=>e.children.flatMap(x=>[x,...descendants(x)]);
const scope={positioned:e=>e,qa:(e,selector)=>selector==='*'?descendants(e):descendants(e).filter(x=>x.id||x.dataset.st),getComputedStyle:()=>({clipPath:'none',backgroundColor:'rgb(255,255,255)',backgroundImage:'none',color:'rgb(0,0,0)',borderColor:'rgb(0,0,0)',borderRadius:'8px',font:'14px sans-serif'})};
vm.createContext(scope);vm.runInContext(source.slice(source.indexOf(' function ghost('),source.indexOf(' const followers =')),scope);
const cases=[];const test=(name,fn)=>{fn();cases.push(name);};
test('Snapshot preserves scrolled root and nested reading surfaces',()=>{const host=new E(),root=new E(),view=new E(),body=new E();host.append(root);root.append(view);view.append(body);root.scrollTop=4;view.scrollLeft=12;body.scrollTop=96;const g=scope.ghost(root,host);assert.equal(g.scrollTop,4);assert.equal(g.children[0].scrollLeft,12);assert.equal(g.children[0].children[0].scrollTop,96);});
test('Negative horizontal offsets and zero positions remain exact',()=>{const host=new E(),root=new E(),child=new E();host.append(root);root.append(child);root.scrollLeft=-48;const g=scope.ghost(root,host);assert.equal(g.scrollLeft,-48);assert.equal(g.scrollTop,0);assert.equal(g.children[0].scrollTop,0);});
test('Paint copies stay noninteractive and do not duplicate IDs/interactive initialization',()=>{const host=new E(),root=new E(),child=new E();host.append(root);root.append(child);root.id='mail';child.id='mail-view';child.dataset.st='tabs';child.className='mail-view';const g=scope.ghost(root,host);assert.equal(g.id,undefined);assert.equal(g.children[0].id,undefined);assert.equal(g.children[0].dataset.st,undefined);assert.equal(g.children[0].dataset.stGhostOf,'tabs');assert.equal(g.inert,true);assert.equal(g.attrs['aria-hidden'],'true');assert.equal(g.children[0].className,'mail-view');});
test('Source scroll state is unchanged by producing a snapshot',()=>{const host=new E(),root=new E(),body=new E();host.append(root);root.append(body);root.scrollTop=9;body.scrollTop=120;scope.ghost(root,host);assert.equal(root.scrollTop,9);assert.equal(body.scrollTop,120);});
console.log(`${cases.length}/${cases.length} snapshot scroll contracts pass; browser paint acceptance separate`);
