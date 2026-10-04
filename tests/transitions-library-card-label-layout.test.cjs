// Source contracts plus actual measured 320px width; fresh rendering remains required.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const input=process.argv[2]||path.resolve(__dirname,'../skills/seenry/assets/components/transitions/gallery.html');
const html=fs.readFileSync(input,'utf8');
const composition=(css,width)=>{
 const rows=/@container\(max-width:(\d+(?:\.\d+)?)px\)\{\s*\.covers\{grid-template-columns:1fr/.exec(css);
 const strict=/@container\(width > (\d+(?:\.\d+)?)px\)/.exec(css),inclusive=/@container\(min-width:(\d+(?:\.\d+)?)px\)\{\s*\.stage \.expand-surface\{display:grid/.exec(css);
 assert(rows&&(strict||inclusive),'Both album composition queries must exist');
 return {source:width<=Number(rows[1])?'row':'tile',detail:(strict?width>Number(strict[1]):width>=Number(inclusive[1]))?'tile':'row'};
};
assert.equal((html.match(/class="cover-label"/g)||[]).length,3);assert.equal((html.match(/class="cover-open" aria-hidden="true"/g)||[]).length,3);
assert(html.includes('.stage #covers .cover-label b{font-size:16px;line-height:22px;font-weight:600;letter-spacing:-.01em}'));
assert(html.includes('.stage .expand-surface{inset-inline:var(--album-gutter);padding:6px;border-radius:18px}'));
for(const width of [320,340,361,384,384.001,384.5,384.999,385,420,532]){const c=composition(html,width);assert.equal(c.source,c.detail,`Composition mismatch at${width}px`);}
const old=html.replace('@container(width > 384px)','@container(min-width:385px)');assert.notEqual(old,html);assert.deepEqual(composition(old,384.5),{source:'tile',detail:'row'},'Removed complementary-query guard must expose the inherited gap');
// Actual source/target measure is101px at320 with the observed253px stage border box.
assert.equal(253-2*8-2*6-60-12-52,101);
assert(html.includes('.stage:has(.cover-open) .covers{grid-template-columns:1fr;gap:8px;width:min(100%,420px)}'));assert(html.includes('.stage:has(.cover-open) .expand-surface{inset-inline:max(var(--album-gutter),calc(50% - 210px));display:flex;'));
console.log('7 Card label layout contracts pass; generic fractional negative control catches384.5px gap; opted-in catalogue retains matched rows');
