// The tells a blind Codex run shipped when its gate could not start: a dotted uppercase label, "01 /" labels and
// cream with terracotta. Each must be a board blocker. node tests/slop-tells.browser.mjs --playwright <index.mjs>
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

const index = process.argv.indexOf('--playwright');
if (index < 0) throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const dir = mkdtempSync(join(tmpdir(), 'seenry-tells-'));
writeFileSync(join(dir, 'index.html'), `<!doctype html><html lang="en"><body style="margin:0;background:#f8f4ee;color:#3b2a22;font:18px/1.5 Georgia,serif">
<main style="max-width:1200px;margin:0 auto;padding:48px">
<p style="font:500 12px Arial;letter-spacing:.12em;text-transform:uppercase;color:#a04a2c"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#a04a2c;margin-right:8px"></span>A little more care. A little less admin.</p>
<h1 style="font-size:64px;font-weight:400;line-height:1.05;margin:16px 0">A full diary.<br><span style="color:#a04a2c">A little breathing room.</span></h1>
<a href="#" style="display:inline-block;background:#a04a2c;color:#fff;padding:14px 22px;border-radius:4px;font:500 16px Arial;text-decoration:none">Find your rhythm</a>
<section style="margin-top:120px;display:grid;grid-template-columns:1fr 1fr;gap:24px">
<div style="background:#f6e9de;padding:32px;min-height:420px"><p style="font:500 12px Arial;letter-spacing:.1em;text-transform:uppercase;color:#a04a2c">01 / Keep the day moving</p><h3 style="font-size:28px;font-weight:400">From “I can’t make it” to “See you at ten.”</h3><p>When a slot opens, Marrow texts the right people on your waitlist.</p></div>
<div style="background:#f6e9de;padding:32px;min-height:420px"><p style="font:500 12px Arial;letter-spacing:.1em;text-transform:uppercase;color:#a04a2c">02 / The whole clinic, in step</p><h3 style="font-size:28px;font-weight:400">The right person. The right room.</h3><p>See practitioners, rooms and equipment together.</p></div>
</section><div style="background:#a04a2c;color:#fff;padding:96px 48px;margin-top:120px"><h2 style="font-size:44px;font-weight:400;margin:0">Make a little room for the work you love.</h2></div></main></body></html>`);
const r = spawnSync(process.execPath, [resolve('skills/seenry/scripts/review_board.mjs'), join(dir, 'index.html'), '--out', join(dir, 'review'), '--studio', '--software', '--playwright', process.argv[index + 1]], {encoding: 'utf8'});
const out = r.stdout + r.stderr;
for (const tell of [/uppercase letter-spaced label/, /colored dot in front of text/, /numbered label/, /a palette the skill lists as generated/, /no real material/]) assert.match(out, tell, out.slice(0, 1500));
assert.match(out, /\d+ blocker\(s\)/);
console.log('slop tells: ok');
