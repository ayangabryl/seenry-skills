#!/usr/bin/env node
/** The director's side of a directed run (run.mjs --director): the person who looks at the sketches and picks.
 *
 *  node evals/baseline/direct.mjs watch <run dir> [--minutes 30]     wait until the sketches are shown; print them
 *  node evals/baseline/direct.mjs shots <run dir>                    a PNG of each option, to look at before picking
 *  node evals/baseline/direct.mjs pick  <run dir> <screen> --reason "…" [--note "…"]
 *
 *  `pick` goes through the canvas's own feedback path: the POST the Send button makes. The reason and at most one note
 *  travel as the general comment, and the pick is recorded in <run dir>/director.json. A run dir is the folder that
 *  holds work/ and meta.json. */
import {existsSync, readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..', '..');
const [cmd, runArg, ...rest] = process.argv.slice(2), flag = (n, f) => { const i = rest.indexOf(`--${n}`); return i >= 0 ? rest[i + 1] : f; };
if (!cmd || !runArg) { console.error('Usage: direct.mjs watch|shots|pick <run dir> …'); process.exit(2); }
const run = resolve(runArg), work = join(run, 'work'), canvas = join(work, '.seenry', 'canvas');
const json = f => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };
const script = join(root, 'skills', 'seenry-canvas', 'scripts', 'canvas.mjs');
const list = () => { const r = spawnSync(process.execPath, [script, 'list', '--json', '--dir', canvas], {encoding: 'utf8'}); try { return JSON.parse(r.stdout); } catch { return {sections: []}; } };
const options = () => list().sections.filter(s => s.options).flatMap(s => s.frames.map(f => ({section: s.id, ...f})));

if (cmd === 'watch') {
  const until = Date.now() + Number(flag('minutes', 30)) * 60000;
  // Shown means `open` ran with options on the canvas: the same moment the canvas keeps as firstOption.
  while (Date.now() < until) {
    const m = json(join(canvas, 'canvas.json')), meta = json(join(run, 'meta.json'));
    if (m?.firstOption && options().length) { console.log(`shown ${m.firstOption}\n${options().map(f => `${f.id}  ${f.name}  ${f.file}`).join('\n')}`); process.exit(0); }
    if (meta?.finished) { console.log('The run finished without showing sketches.'); process.exit(3); }
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('No sketches shown in time.'); process.exit(3);
} else if (cmd === 'shots') {
  const pw = process.env.SEENRY_PLAYWRIGHT || join(run, '..', '..', '..', 'pw', 'node_modules', 'playwright', 'index.mjs');
  const r = spawnSync(process.execPath, [script, 'render', ...options().map(f => f.id), '--json', '--dir', canvas, '--playwright', pw], {encoding: 'utf8', env: {...process.env, SEENRY_NO_BROWSER: '1'}});
  process.stdout.write(r.stdout || r.stderr);
  for (const f of options()) { const html = readFileSync(join(canvas, f.file), 'utf8'); console.log(`${f.id}: ${(html.match(/name="seenry-idea"\s+content="([^"]*)"/) || [])[1] || '(no idea line)'}`); }
} else if (cmd === 'pick') {
  const frame = rest[0], opts = options(), hit = opts.find(f => f.id === frame);
  if (!hit) { console.error(`No option "${frame}". Options: ${opts.map(f => f.id).join(', ')}`); process.exit(2); }
  const info = json(join(canvas, '.canvas.json'));
  if (!info?.port) { console.error('The canvas is not running in that run.'); process.exit(1); }
  const reason = flag('reason', ''), note = flag('note', '');
  const general = [reason && `Picked ${hit.name}: ${reason}`, note && `One note: ${note}`].filter(Boolean).join(' ');
  const res = await fetch(`http://127.0.0.1:${info.port}/feedback`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({picks: {[hit.section]: frame}, general})});
  if (!res.ok) { console.error(`The canvas refused the feedback (${res.status}).`); process.exit(1); }
  const file = join(run, 'director.json'), log = json(file) || [];
  log.push({at: new Date().toISOString(), options: opts.map(f => f.id), pick: frame, reason, note});
  writeFileSync(file, JSON.stringify(log, null, 2));
  console.log(`Sent: ${frame}. ${general}`);
} else { console.error(`Unknown command ${cmd}`); process.exit(2); }
