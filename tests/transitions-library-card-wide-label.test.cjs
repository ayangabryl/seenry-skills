// Actual wide-layout observations + a bounded flex cross-axis cascade model.
// Native width, glyph and collision assertions remain the acceptance gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(process.argv[2] || path.join(__dirname, '../skills/seenry/assets/components/transitions/gallery.html'), 'utf8');
const observed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/transitions/native-card-wide-label-observed.json')));
const markedSelector = '.stage:has(.cover-open) .expand-surface';
const block = (text, start) => { const i = text.indexOf(start); assert(i >= 0, start); return text.slice(i + start.length, text.indexOf('}', i)); };
const declarations = body => Object.fromEntries(body.split(';').filter(Boolean).map(s => { const p=s.indexOf(':');return [s.slice(0,p).trim(),s.slice(p+1).trim()]; }));
function crossAxis(css, wide) {
 const earlier = wide ? declarations(block(css, '@container(width > 384px){\n .stage .expand-surface{')) : {};
 const later = declarations(block(css, markedSelector + '{'));
 return {...earlier, ...later};
}
function labelWidth(css, row) {
 const c = crossAxis(css, true);
 assert.equal(c.display, 'flex'); assert.equal(c['flex-direction'], 'column');
 // The authored header fills the surface's cross axis only when stretch survives.
 return c['align-items'] === 'stretch' ? (row.surface.right - row.surface.left) - 12 - 60 - 12 - 52 : row.destinationTitle.width;
}
assert.equal(observed.cases.length, 7);
assert.equal(crossAxis(html, false)['align-items'], 'stretch');
const repaired = block(html, markedSelector + '{');
const old = html.replace(markedSelector + '{' + repaired, markedSelector + '{' + repaired.replace('align-items:stretch;', ''));
assert.notEqual(old, html);
for (const row of observed.cases) {
 assert(row.sourceTitle.width - row.destinationTitle.width > 100, row.case + ' must retain the observed mismatch');
 assert(Math.abs(labelWidth(html, row) - row.sourceTitle.width) < .1, row.case + ' must use the shared available label measure');
 assert(Math.abs(labelWidth(old, row) - row.sourceTitle.width) > 100, row.case + ' removed cross-axis reset must expose the observed shrink');
 assert.equal(row.sourceFont, row.destinationFont);
}
console.log('7/7 observed wide-label cascade cases pass; removing the marked cross-axis reset reproduces all 7 width mismatches. Fresh native layout remains required.');
