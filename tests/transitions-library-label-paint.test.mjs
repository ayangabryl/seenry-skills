import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {glyphIntersections,labelPaintFindings} from './transitions-library-label-paint.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/card-v2-320-observed-label-collision.json',import.meta.url)));
const state=n=>({text:n.text,glyphs:n.glyphRects,painted:n.visibility==='visible'&&Number(n.opacity)>.01});
const row={open:'true',closing:null,title:state(fixture.nodes[0]),meta:state(fixture.nodes[1]),ghosts:[state(fixture.nodes[2])],metaGhosts:[state(fixture.nodes[3])]};
const expected={title:'Night Swim',meta:'9 tracks'};
let hits=labelPaintFindings(row,expected);assert.equal(hits.length,1);assert.equal(hits[0].kind,'title-meta-glyph-intersection');assert(Math.abs(hits[0].height-5.271514892578125)<.00001);
// The known actual failure cannot be accepted through hidden originals or a duplicate title.
const blank=structuredClone(row);blank.ghosts[0].painted=false;assert(labelPaintFindings(blank,expected).some(f=>f.kind==='title-paint-count'));
const hiddenCount=structuredClone(row);hiddenCount.metaGhosts[0].painted=false;assert(labelPaintFindings(hiddenCount,expected).some(f=>f.kind==='meta-paint-count'));
const wrong=structuredClone(row);wrong.metaGhosts[0].text='11 tracks';assert(labelPaintFindings(wrong,expected).some(f=>f.kind==='meta-identity'));
const duplicate=structuredClone(row);duplicate.title.painted=true;assert(labelPaintFindings(duplicate,expected).some(f=>f.kind==='title-paint-count'));
// A separated stack stays separated through one common unscaled translation.
for(let progress=0;progress<=1;progress+=.025){const safe=structuredClone(row);for(const node of [safe.ghosts[0],safe.metaGhosts[0]])for(const r of node.glyphs){r.x+=100*progress;r.y+=60*progress;}safe.metaGhosts[0].glyphs[0].y+=10;assert.deepEqual(labelPaintFindings(safe,expected),[]);}
assert.deepEqual(glyphIntersections([{x:0,y:0,width:20,height:10}],[{x:30,y:0,width:20,height:10}]),[]);
assert.deepEqual(labelPaintFindings({...row,open:'false',closing:null},expected),[]);
const repaired=JSON.parse(readFileSync(new URL('./fixtures/card-label-v1-320-observed-clearance.json',import.meta.url)));
assert.equal(repaired.input,'trusted-keyboard-click');assert.equal(repaired.samples.length,7);
for(const sample of repaired.samples){
 const [title,meta]=sample.travelers.map(state);
 assert.deepEqual(labelPaintFindings({open:'true',ghosts:[title],metaGhosts:[meta]},expected),[],`Actual repaired sample at${sample.ms}ms`);
 assert.equal(sample.travelers[0].transform,sample.travelers[1].transform);
 const titleInk=title.glyphs.at(-1),countInk=meta.glyphs[0];assert(Math.abs(countInk.y-(titleInk.y+titleInk.height)-5)<.001);
}
console.log('9 label-paint contracts passed, including the actual 5.272px collision fixture');
