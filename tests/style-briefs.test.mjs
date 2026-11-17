// Style briefs are a shelf of visual identities, never page templates: each has the same nine headings, stays short
// enough to be read whole, and carries two image jobs image.mjs accepts once their <…> are filled.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {validateJob, inherit} from '../skills/seenry/scripts/art_prompt.mjs';

const dir = resolve('skills/seenry/references/styles');
const HEADINGS = ['Identity', 'Type', 'Colour roles', 'Imagery', 'How image and interface meet', 'Below the hero', 'Phone', 'Never', 'Seen in'];
export const STYLE_WORD_CAP = 480;
const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort();
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
const part = (text, name) => (text.split(`\n## ${name}\n`)[1] || '').split('\n## ')[0];
const bullets = s => s.split('\n').filter(l => /^- /.test(l));
const fill = v => typeof v === 'string' ? v.replace(/<[^<>]*hex>/g, '#123456').replace(/<[^<>]+>/g, 'the harbour wall at low tide') : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)])) : v;

test('the shelf holds 16 to 20 briefs and the index names exactly those', () => {
  assert.ok(files.length >= 16 && files.length <= 20, `${files.length} briefs`);
  assert.deepEqual(index.map(s => `${s.slug}.md`).sort(), files);
  for (const s of index) {
    assert.match(s.slug, /^[a-z]+(-[a-z]+)*$/);
    assert.ok(s.name && s.for && s.for.split(/\s+/).length <= 16, `${s.slug}: a name and a reason of at most 16 words`);
    assert.ok(Array.isArray(s.keywords) && s.keywords.length >= 6, `${s.slug}: at least 6 keywords`);
  }
});

for (const file of files) {
  const text = readFileSync(join(dir, file), 'utf8'), slug = file.replace(/\.md$/, '');
  test(`${slug}: nine headings in order, under ${STYLE_WORD_CAP} words`, () => {
    assert.deepEqual([...text.matchAll(/^## (.+)$/gm)].map(m => m[1]), HEADINGS);
    assert.match(text, /^# \S/);
    const words = text.split(/\s+/).filter(Boolean).length;
    assert.ok(words <= STYLE_WORD_CAP, `${words} words`);
    for (const h of HEADINGS) assert.ok(part(text, h).trim().length > 20, `${h} is empty`);
  });
  test(`${slug}: an identity, not a template`, () => {
    const sentences = part(text, 'Identity').trim().split(/(?<=[.!?])\s+/).length;
    assert.ok(sentences >= 2 && sentences <= 3, `Identity has ${sentences} sentences (needs 2 or 3)`);
    assert.match(part(text, 'Type'), /\d+(–\d+)?px/, 'Type gives measured sizes');
    assert.doesNotMatch(part(text, 'Colour roles'), /#[0-9a-f]{6}\b/i, 'Colour roles names roles, never hexes');
    const moves = bullets(part(text, 'Below the hero'));
    assert.ok(moves.length >= 5, `${moves.length} section moves (needs 5)`);
    for (const m of moves) assert.match(m, /^- \*\*[^*]+\*\*/, `a move is named: ${m.slice(0, 40)}`);
    assert.doesNotMatch(moves.map(m => m.match(/\*\*([^*]+)\*\*/)[1]).join('|'), /\b(FAQ|steps?|how it works|feature cards?|testimonials?)\b/i, 'no default section names');
    const bans = bullets(part(text, 'Never'));
    assert.ok(bans.length >= 5 && bans.length <= 8, `${bans.length} bans (needs 5 to 8)`);
    assert.doesNotMatch(text, /waterline/i, 'the bundled example is never named');
    assert.doesNotMatch(text, /^\d+\. /m, 'no ordered list: a brief fixes no section order');
  });
  test(`${slug}: two image jobs, a hero and a returning motif, valid once filled`, () => {
    const block = part(text, 'Imagery').match(/```json\n([\s\S]+?)\n```/);
    assert.ok(block, 'Imagery holds one json block');
    const raw = JSON.parse(block[1]);
    assert.equal(raw.length, 2);
    assert.ok(raw.some(j => /<[^<>]+>/.test(JSON.stringify(j.subject))), 'the subject leaves a <…> for the product');
    assert.ok(inherit(raw).some(j => validateJob(j).some(e => /placeholder/.test(e))), 'an unfilled template is refused');
    const jobs = inherit(raw.map(fill));
    for (const job of jobs) assert.deepEqual(validateJob(job), [], job.out);
    assert.notEqual(jobs[0].out, jobs[1].out);
    assert.notEqual(jobs[0].placement.slot, jobs[1].placement.slot);
  });
}
