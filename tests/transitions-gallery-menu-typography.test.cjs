// Source/selector contracts only. This models the actual competing specificity;
// native computed fonts, text fit and control hit geometry still need capture.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../skills/seenry/assets/components/transitions/gallery.html'), 'utf8');
const styles = html.split('<style>')[1].split('</style>')[0];
const marker = '/* One phone type contract also outranks the gallery\'s ID-specific :is/:not floor. */';
const start = styles.indexOf(marker), end = styles.indexOf('@media(max-width:360px)', start);
const phone = styles.slice(start, end);
const rules = [...phone.matchAll(/([^{}]+)\{font-size:(\d+)px\}/g)].map(match => ({selector: match[1].trim(), size: Number(match[2])}));
const meaningfulLeaves = ['[data-menu-count]', '[data-menu-reset]', '[data-menu-file-note]', '[data-menu-budget]', '[data-menu-status]', '[data-menu-deleted]', '[data-menu-undo]', '[data-menu-empty]', '.menu-demo-disclosure', '#menu-copy-limit'];
const generic = '.stage :is(span,b,button,label,input,kbd,div.st-details-body):not(.st-number,.st-number *,.price,.price *,[data-st=badge],[data-st=badge] *,#avatar-group *)';
const paragraphs = '.stage :is(p,.answer,.bubble,.profile .st-real p)';

function splitList(value) {
 const parts = []; let depth = 0, from = 0;
 for (let i = 0; i < value.length; i++) {
  if ('(['.includes(value[i])) depth++;
  else if (')]'.includes(value[i])) depth--;
  else if (value[i] === ',' && depth === 0) { parts.push(value.slice(from, i).trim()); from = i + 1; }
 }
 parts.push(value.slice(from).trim()); return parts;
}
const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
function specificity(selector) {
 const score = [0, 0, 0]; let rest = selector;
 // :is/:not/:has use the most specific argument even if another branch matches.
 for (;;) {
  const match = /:(is|not|has|where)\(/.exec(rest); if (!match) break;
  let depth = 1, end = match.index + match[0].length;
  for (; end < rest.length && depth; end++) { if (rest[end] === '(') depth++; if (rest[end] === ')') depth--; }
  assert.equal(depth, 0);
  if (match[1] !== 'where') {
   const highest = splitList(rest.slice(match.index + match[0].length, end - 1)).map(specificity).sort(compare).at(-1);
   highest.forEach((value, i) => score[i] += value);
  }
  rest = rest.slice(0, match.index) + rest.slice(end);
 }
 rest = rest.replace(/\[[^\]]+\]/g, () => { score[1]++; return ''; });
 rest = rest.replace(/#[\w-]+/g, () => { score[0]++; return ''; });
 rest = rest.replace(/\.[\w-]+/g, () => { score[1]++; return ''; });
 rest = rest.replace(/::[\w-]+/g, () => { score[2]++; return ''; });
 rest = rest.replace(/:[\w-]+/g, () => { score[1]++; return ''; });
 score[2] += [...rest.matchAll(/(?:^|[\s>+~])([a-z][\w-]*)/gi)].length;
 return score;
}
// Resolve only the actual competing declarations named by this regression,
// including their source order. This is not a general CSS/rendering evaluator.
function winner(...selectors) {
 return selectors.map(selector => {
  const offset = styles.lastIndexOf(selector + '{'); assert(offset >= 0, selector);
  const declaration = styles.slice(offset + selector.length + 1).split('}')[0];
  return {selector, offset, score: specificity(selector), size: Number(/font-size:(\d+)px/.exec(declaration)?.[1])};
 }).sort((a, b) => compare(a.score, b.score) || a.offset - b.offset).at(-1);
}
function fixture() {
 const file = path.join(__dirname, 'transitions-gallery-menu.test.cjs');
 const scope = {require: id => id === 'node:test' ? {test() {}} : require(id), __dirname, process, console};
 vm.runInNewContext(fs.readFileSync(file, 'utf8') + '\nthis.makeFixture=fixture;', scope, {filename: file});
 return scope.makeFixture();
}

test('phone typography is limited to the existing 650px breakpoint and font sizes', () => {
 assert(start >= 0); assert.match(phone, /@media\(max-width:650px\)/);
 assert.equal(rules.length, 2); assert.deepEqual(rules.map(rule => rule.size), [15, 16]);
 const declarations = [...phone.matchAll(/\{([^{}]+)\}/g)].map(match => match[1].trim());
 assert.deepEqual(declarations, ['font-size:15px', 'font-size:16px']);
});
test('the actual competing ID-level gallery floor is modeled, not mistaken for a class-only selector', () => {
 assert(styles.includes(generic + '{font-size:15px}'));
 assert(styles.includes(paragraphs + '{font-size:14px;line-height:20px}'));
 assert.deepEqual(specificity(generic), [1, 2, 1]);
 assert.deepEqual(specificity(paragraphs), [0, 3, 1]);
 assert.deepEqual(specificity('#menu-rename input'), [1, 0, 1]);
 assert.deepEqual(specificity('#menu-rename .st-button'), [1, 1, 0]);
 assert(compare(specificity(generic), specificity('#menu-rename input')) > 0);
 assert(compare(specificity(generic), specificity('#menu-rename .st-button')) > 0);
 // Negative controls: authored14 on these controls is already overruled by15;
 // the editor's authored16 also loses before the phone correction is eligible.
 assert.equal(winner('.menu-demo .app-bar .st-button', generic).size, 15);
 assert.equal(winner('.menu-demo .file-meta span', generic).size, 15);
 assert.equal(winner('#menu-rename input', generic).size, 15);
 assert.equal(winner('#menu-rename .st-button', generic).size, 15);
 assert.equal(winner('.menu-demo #menu-copy-limit', paragraphs).size, 14);
});
test('one explicit phone contract covers every meaningful leaf and beats the competing cascade', () => {
 const f = fixture(), rule = rules[0];
 assert.equal(rule.selector.split(' :is(')[0], '.stage.menu-demo[data-menu-demo]');
 assert(f.stage.classList.contains('stage') && f.stage.classList.contains('menu-demo') && f.stage.hasAttribute('data-menu-demo'));
 assert.deepEqual(splitList(rule.selector.slice(rule.selector.indexOf(':is(') + 4, -1)), meaningfulLeaves);
 for (const selector of meaningfulLeaves) {
  const leaves = f.stage.querySelectorAll(selector);
  assert(leaves.length > 0, `${selector} must match actual fixture markup`);
  for (const leaf of leaves) assert(!leaf.closest('#menu-rename'), `${selector} must not change editor controls`);
 }
 assert.deepEqual(specificity(rule.selector), [1, 3, 0]);
 for (const competing of [generic, paragraphs, '.menu-demo .menu-demo-count', '.menu-demo .app-bar .st-button', '.menu-demo .file-meta span', '.menu-demo .menu-demo-recovery .st-button', '.menu-demo #menu-copy-limit']) assert(compare(specificity(rule.selector), specificity(competing)) > 0, competing);
 assert.equal(winner(rule.selector, generic, paragraphs, '.menu-demo #menu-copy-limit').size, 15);
});
test('the phone editor contract retains intended 16px labels, input and actions over the broad 15px floor', () => {
 const f = fixture(), editor = f.find('#menu-rename'), rule = rules[1];
 assert.equal(rule.selector, '.stage #menu-rename.menu-demo-editor :is(label,input,.st-button)');
 assert(editor.classList.contains('menu-demo-editor') && editor.closest('.stage') === f.stage);
 assert.equal(editor.querySelectorAll('label,input,.st-button').length, 4);
 assert.deepEqual(specificity(rule.selector), [1, 3, 0]);
 assert(compare(specificity(rule.selector), specificity(generic)) > 0);
 assert.equal(rule.size, 16);
 assert.equal(winner(rule.selector, generic, '#menu-rename input', '#menu-rename .st-button').size, 16);
});
test('phone selectors continue matching after the actual stage moves into detail', () => {
 const f = fixture(), detail = new f.E('dialog'); detail.id = 'library-detail'; f.doc.body.append(detail); detail.append(f.stage);
 assert(f.stage.classList.contains('stage') && f.stage.classList.contains('menu-demo') && f.stage.hasAttribute('data-menu-demo'));
 for (const selector of meaningfulLeaves) assert(f.stage.querySelectorAll(selector).length > 0);
 assert.equal(f.find('#menu-rename').closest('.stage'), f.stage);
 assert.equal(f.find('#menu-rename').querySelectorAll('label,input,.st-button').length, 4);
});
