// Execute the actual declaration lists under the Card Close cascade contract.
// This is a CSS source/cascade model; native computed style remains a browser check.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const input=path.resolve(process.argv[2]||path.join(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js')),css=fs.readFileSync(input.replace('.js','.css'),'utf8'),html=fs.readFileSync(path.join(path.dirname(input),'gallery.html'),'utf8');
const rule=(source,selector)=>{const start=source.indexOf(selector+'{')>=0?source.indexOf(selector+'{'):source.indexOf(selector+' {');assert(start>=0,selector);return source.slice(source.indexOf('{',start)+1,source.indexOf('}',start));};
const list=(block,property)=>{const found=new RegExp(property+':\\s*([^;]+)').exec(block);assert(found,property);return found[1].replace(/\s*!important/,'').split(',').map(s=>s.trim());};
const generic=rule(html,'.stage :is(button,a,[role=tab],[role=menuitem],[role=option],summary,.opt,.task,.msg,.cover-card)'),guard=rule(css,'[data-st="expand"] [data-st-close]'),release=rule(css,'[data-st="expand"] [data-st-close]:not(:active)');
// The earlier active rule owns only transform; use the later authored duration rule.
const active=/\.expand-surface \.close-x:active\{transform:scale\(\.96\);transition-duration:([^}]+)\}/.exec(html);assert(active);
const duration=(properties,durations,property)=>durations[properties.indexOf(property)%durations.length];
const properties=list(guard,'transition-property'),durations=list(release,'transition-duration');
assert(!properties.includes('opacity'));assert.equal(properties.length,durations.length);assert.equal(duration(properties,durations,'transform'),'100ms');assert(!release.includes('!important'),'Reduced-motion global duration must retain priority');
assert.equal(active[1],'60ms');assert.equal(duration(properties,['60ms'],'transform'),'60ms','Active authored feedback remains60ms because release selector excludes active');
assert(css.includes('transition-duration: 100ms !important'));
assert(css.includes('[data-st="expand"] [data-st-close] { transition-property: color, background-color, box-shadow !important; transform: none !important; }'),'Reduced Close cannot inherit geometry restoration');
const old=duration(properties,list(generic,'transition-duration'),'transform');assert.equal(old,'180ms','Removing the remapped duration reproduces the shifted fourth-slot clock');assert.notEqual(old,'100ms');
console.log('4/4 Card Close CSS clock contracts pass; normal100ms, active60ms, reduced priority and removed-remap control');
