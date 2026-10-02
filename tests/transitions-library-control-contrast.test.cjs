// Canonical CSS token/cue contracts. Native compositing and pixels remain separate evidence.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const css=fs.readFileSync(process.argv[2]||path.resolve(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.css'),'utf8');
function block(selector){const start=css.indexOf(selector+' {');assert(start>=0,'Missing selector '+selector);return css.slice(css.indexOf('{',start)+1,css.indexOf('}',start));}
const tokens=s=>Object.fromEntries([...s.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
const base=tokens(block(':root')),dark=tokens(block('[data-theme="dark"]'));
const property=(selector,name)=>{const m=block(selector).match(new RegExp('(?:^|;)\\s*'+name+'\\s*:\\s*([^;]+)'));assert(m,'Missing property '+name);return m[1].trim();};
function color(value,theme){const ref=/^var\(--([\w-]+)\)$/.exec(value);if(ref)return color(theme[ref[1]],theme);const m=/^#([\da-f]{3,8})$/i.exec(value);assert(m,'Unsupported cue color '+value);let h=m[1];if(h.length===3||h.length===4)h=[...h].map(c=>c+c).join('');assert([6,8].includes(h.length));return [0,2,4,6].map((i,n)=>n===3?(h.length===8?parseInt(h.slice(i,i+2),16)/255:1):parseInt(h.slice(i,i+2),16)/255);}
const over=(a,b)=>[...a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3])),1];
const luminance=c=>c.slice(0,3).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const results=[];const check=(theme,cue,value)=>results.push({theme,cue,ratio:value,pass:value>=3});
for(const [name,theme] of [['light',base],['dark',{...base,...dark}]]){
 const surface=color(theme.surface,theme),thumb=color(property('.st-toggle-thumb','background'),theme);
 for(const [state,selector] of [['off','.st-toggle-track'],['on','.st-toggle input:checked + .st-toggle-track']]){
  const track=over(color(property(selector,'background'),theme),surface),ink=over(thumb,track);
  check(name,`${state} switch thumb/state cue`,ratio(ink,track));
  // Do not require the dark off track by itself when its contrasting thumb identifies the control.
  check(name,`${state} switch identifiable against surrounding surface`,Math.max(ratio(track,surface),ratio(ink,surface)));
 }
 const fill=over(color(property('.st-check > svg','background'),theme),surface);
 const shadow=property('.st-check > svg','box-shadow').match(/var\(--[\w-]+\)|#[\da-f]{3,8}/i);assert(shadow,'Unchecked checkbox boundary color must be explicit');const edge=over(color(shadow[0],theme),fill);
 check(name,'unchecked checkbox boundary against inner fill',ratio(edge,fill));check(name,'unchecked checkbox boundary against surrounding surface',ratio(edge,surface));
 const selectedFill=over(color(property('.st-check input:checked + svg, .st-check input:indeterminate + svg','background'),theme),surface),mark=over(color(property('.st-check > svg','stroke'),theme),selectedFill);
 check(name,'checked checkbox mark against fill',ratio(mark,selectedFill));
}
console.log(JSON.stringify({source:process.argv[2]||'bundled CSS',scope:'Static default theme colors on canonical opaque surface; not browser/WCAG certification',passed:results.filter(x=>x.pass).length,total:results.length,cases:results},null,2));if(results.some(x=>!x.pass))process.exitCode=1;
