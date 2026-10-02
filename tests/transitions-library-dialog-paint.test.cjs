// Execute the browser harness's ACTUAL inspect/assertPaint/parser against a DOM/CSS model.
// Positive Range geometry intentionally survives invisible text; this is assertion coverage,
// not native rendering or a claim that production currently paints these negative states.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const filename=process.argv[2]||path.join(__dirname,'transitions-library-dialog.browser.mjs'),source=fs.readFileSync(filename,'utf8');
function section(from,to){const start=source.indexOf(from),end=source.indexOf(to,start);assert(start>=0&&end>start,'Actual harness helper boundary missing');return source.slice(start,end);}
const extracted=section('const parse=v=>','const settle=')+section('function backdropState(style){','async function earlyOpen(')+'\nthis.actualInspect=inspect;this.actualAssertPaint=assertPaint;this.actualParse=parse;this.actualContrast=contrast;';
const rectangle = (left, top, width, height) => ({left, top, width, height, right:left+width, bottom:top+height, x:left, y:top});
function fixture() {
  const baseStyle = {
    color:'rgb(0, 0, 0)', backgroundColor:'rgb(255, 255, 255)',
    fontSize:'15px', opacity:'1', filter:'none', transform:'none',
    outlineWidth:'0px', outlineStyle:'none', outlineColor:'rgb(0, 0, 0)',backgroundImage:'none',
    visibility:'visible', display:'block', mixBlendMode:'normal',
  };
  function element(tag, id, rect, parentElement = null) {
    return {tagName:tag, id, parentElement, className:'', style:{...baseStyle},
      offsetWidth:rect.width, offsetHeight:rect.height,
      getBoundingClientRect:()=>({...rect,toJSON:()=>({...rect})}),
      matches:selector=>selector === ':modal' && id === 'dialog-1'};
  }
  const html = element('HTML','',rectangle(0,0,390,780));
  html.hasAttribute = name => name === 'data-st-blur';
  const body = element('BODY','',rectangle(0,0,390,780),html);
  const stage = element('DIV','stage',rectangle(0,0,390,600),body);
  const bg = element('DIV','app',rectangle(20,20,350,250),stage);
  const trigger = element('BUTTON','dialog-trigger',rectangle(180,150,160,44),bg);
  trigger.getAttribute = name => name === 'aria-expanded' ? 'true' : null;
  const dialog = element('DIALOG','dialog-1',rectangle(35,200,320,240),stage);
  const heading = element('H3','dlg-title',rectangle(55,225,280,25),dialog);
  const description = element('P','dlg-description',rectangle(55,265,280,70),dialog);
  const row = element('DIV','dialog-actions',rectangle(55,360,280,44),dialog);
  const cancel = element('BUTTON','cancel',rectangle(95,360,88,44),row);
  const confirm = element('BUTTON','confirm',rectangle(191,360,140,44),row);
  confirm.style.color = 'rgb(255, 255, 255)';
  confirm.style.backgroundColor = 'rgb(150, 0, 0)';
  Object.assign(dialog, {open:true,inert:false,dataset:{stOpen:'true'},
    closest:()=>stage,getAnimations:()=>[],
    querySelector:selector=>selector==='[autofocus]'?cancel:selector==='.dialog-destructive'?confirm:selector==='#dlg-title'?heading:selector==='#dlg-description'?description:null});
  stage.querySelector = selector => selector === '.app' ? bg : null;
  const texts = [
    [heading,'Delete Aurora website?'],
    [description,'This removes 24 pages and 318 assets. You can restore it from the trash for 30 days.'],
    [cancel,'Cancel'],[confirm,'Delete project'],
  ].map(([parentElement,textContent])=>({parentElement,textContent}));
  for(const text of texts)text.parentElement.textContent=text.textContent;
  const document = {
    activeElement:cancel,documentElement:html,
    querySelector:selector=>selector==='#dialog-1'?dialog:selector==='#dialog-trigger'?trigger:null,
    createTreeWalker:()=>{let i=0;return {nextNode:()=>texts[i++]||null};},
    createRange:()=>{let selected;return {selectNode:node=>{selected=node;},
      getClientRects:()=>[selected.parentElement.getBoundingClientRect()]};},
  };
  const scope = {assert,document,NodeFilter:{SHOW_TEXT:4},innerWidth:390,innerHeight:780,
    CSS:{supports:(property)=>property==='backdrop-filter'},performance:{now:()=>0},matchMedia:query=>({matches:query.includes('prefers-reduced-motion')}),
    getComputedStyle:(el,pseudo)=>pseudo==='::backdrop'?{
      backgroundColor:'rgba(0, 0, 0, 0.5)',filter:'none',backdropFilter:'none',
      getPropertyValue:property=>property==='backdrop-filter'?'none':'',position:'fixed',inset:'0px',
    }:el.style};
  vm.createContext(scope);vm.runInContext(extracted,scope,{filename:filename+' (extracted functions)'});
  return {scope,dialog,heading,description,cancel,confirm,texts,element};
}

const results=[];function test(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message.split('\n')[0]});}}
const accepted=f=>{const s=f.scope.actualInspect();f.scope.actualAssertPaint(s,{motion:'reduce',input:'pointer',settled:true});return s;};
test('positive opaque decision copy and actions pass actual helpers',()=>{const s=accepted(fixture());assert(s.heading&&s.description,'Actual heading/description paint chains must be recorded');assert(s.texts.every(t=>t.paint?.chain?.length),'Every actual text run needs paint evidence');});
test('positive transparent text backgrounds composite onto the opaque dialog',()=>{const f=fixture();f.heading.style.backgroundColor='rgba(0, 0, 0, 0)';f.description.style.backgroundColor='color(srgb 0 0 0 / 0)';accepted(f);});
test('positive modern color(srgb) computed colors including hover mix are accepted',()=>{const f=fixture();for(const e of [f.heading,f.description]){e.style.color='color(srgb 0 0 0)';e.style.backgroundColor='color(srgb 1 1 1 / 1)';}f.dialog.style.backgroundColor='color(srgb 1 1 1)';f.confirm.style.color='color(srgb 1 1 1)';f.confirm.style.backgroundColor='color(srgb '+[212,47,47].map(v=>v*.88/255).join(' ')+')';accepted(f);});
test('positive own text backing is used rather than assuming modal background',()=>{const f=fixture();f.heading.style.color='rgb(255, 255, 255)';f.heading.style.backgroundColor='rgb(0, 0, 0)';accepted(f);});
for(const target of ['heading','description'])for(const [name,style]of [['opacity zero',{opacity:'0'}],['partial opacity',{opacity:'.5'}],['hidden visibility',{visibility:'hidden'}],['transparent foreground',{color:'rgba(0, 0, 0, 0)'}],['blurred foreground',{filter:'blur(8px)'}],['insufficient foreground contrast',{color:'rgb(180, 180, 180)'}]])test('reject '+target+' '+name+' despite positive Range boxes',()=>{const f=fixture();Object.assign(f[target].style,style);assert.throws(()=>accepted(f));});
for(const opacity of ['0','.5'])test('reject modal backing alpha '+opacity,()=>{const f=fixture();f.dialog.style.backgroundColor=`rgba(255, 255, 255, ${opacity})`;assert.throws(()=>accepted(f));});
test('reject unanalyzed image on modal backing',()=>{const f=fixture();f.dialog.style.backgroundImage='linear-gradient(white,black)';assert.throws(()=>accepted(f));});
test('reject invisible nested decision text even when heading ancestor itself is visible',()=>{const f=fixture(),span=f.element('SPAN','copy-span',rectangle(55,225,280,25),f.heading);span.textContent=f.heading.textContent;span.style.opacity='0';f.texts[0].parentElement=span;assert.throws(()=>accepted(f));});
test('reject contrast failure on an actual local text backing',()=>{const f=fixture();f.heading.style.backgroundColor='rgb(0, 0, 0)';assert.throws(()=>accepted(f));});
test('reject unanalyzed image backing beneath decision copy',()=>{const f=fixture();f.description.style.backgroundImage='linear-gradient(white,black)';assert.throws(()=>accepted(f));});
test('retain rejection of hidden action',()=>{const f=fixture();f.cancel.style.visibility='hidden';assert.throws(()=>accepted(f));});
test('retain positive modal and content geometry requirement',()=>{const f=fixture();f.heading.getBoundingClientRect=()=>{const r=rectangle(900,225,280,25);return {...r,toJSON:()=>r};};assert.throws(()=>accepted(f));});
test('retain native modality requirement',()=>{const f=fixture();f.dialog.matches=()=>false;assert.throws(()=>accepted(f));});
test('parser accepts equivalent classic, modern RGB and sRGB serializations',()=>{const f=fixture();const samples=['rgb(255, 0, 128)','rgb(100% 0% 50.19607843137255% / 100%)','color(srgb 1 0 0.5019607843137255 / 1)'];const parsed=samples.map(v=>Array.from(f.scope.actualParse(v)));for(const p of parsed){assert.equal(p[3],1);assert(Math.abs(p[2]-128/255)<1e-12);}assert.equal(f.scope.actualParse('rgba(0, 0, 0, 0)')[3],0);assert.throws(()=>f.scope.actualParse('color(display-p3 1 0 0)'));assert.throws(()=>f.scope.actualParse('rgb(NaN, 0, 0)'));});
const report={harnessSha256:crypto.createHash('sha256').update(source).digest('hex'),scope:'Actual harness helpers executed against modeled DOM/CSS/Range data; not native/render acceptance',passed:results.filter(x=>x.pass).length,total:results.length,results};if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
