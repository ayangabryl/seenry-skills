#!/usr/bin/env node
/** Generate photographs through the Codex CLI's built-in image model, from any host (Claude Code, Cursor, Codex).
 *
 *  node image.mjs --prompt "<art-directed prompt>" --out assets/hero.png
 *  node image.mjs --batch images.json           # [{"prompt": "...", "out": "assets/hero.png"}, ...], run 3 at a time
 *
 *  Write prompts like a photographer (see SKILL.md Imagery and seenry-assets/references/generation.md): subject, set
 *  and surface, one light, lens and distance, composition for the slot and ratio, color grade, exclusions, and
 *  "no text" on labels. Then run photo_check.mjs on the results. Needs a working, signed-in `codex` CLI. */
import {existsSync, readFileSync, copyFileSync, mkdirSync, mkdtempSync, readdirSync, statSync} from 'node:fs';
import {resolve, dirname, join, extname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {findCli} from './model_cli.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const jobs = flag('batch') ? JSON.parse(readFileSync(resolve(flag('batch')), 'utf8')) : [{prompt: flag('prompt'), out: flag('out')}];
if (!jobs.length || jobs.some(j => !j.prompt || !j.out)) { console.error('Usage: node image.mjs --prompt "<prompt>" --out <file.png> | --batch <jobs.json>'); process.exit(2); }
const found = findCli('codex');
if (!found) { console.error('No working Codex CLI found, so no image model is available. Use the host image tool, seenry-assets (OPENAI_API_KEY or GEMINI_API_KEY), license-clear photos, or the no-photo fallback in SKILL.md.'); process.exit(2); }

function generate({prompt, out}) {
  return new Promise(done => {
    const work = mkdtempSync(join(tmpdir(), 'seenry-image-'));
    const ask = `Generate exactly one image with your image generation tool from the description below, then copy the generated file into the current working directory as image.png. Do not generate more than one image and do not edit it. Reply only with "saved".\n\nDescription: ${prompt}`;
    const child = spawn(found.bin, ['exec', '--skip-git-repo-check', '-s', 'workspace-write', ask], {cwd: work, stdio: ['ignore', 'pipe', 'pipe']});
    let log = '';
    child.stdout.on('data', d => { log += d; }); child.stderr.on('data', d => { log += d; });
    const timer = setTimeout(() => child.kill('SIGTERM'), 600000);
    child.on('close', () => {
      clearTimeout(timer);
      const made = readdirSync(work).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).map(f => join(work, f)).sort((a, b) => statSync(b).size - statSync(a).size)[0];
      if (!made) { console.error(`✗ ${out}: no image was produced. ${log.slice(-600)}`); return done(false); }
      const dest = resolve(out);
      mkdirSync(dirname(dest), {recursive: true});
      copyFileSync(made, extname(dest) ? dest : dest + extname(made));
      console.log(`✓ ${out}`);
      done(true);
    });
  });
}

let ok = 0;
for (let i = 0; i < jobs.length; i += 3) {
  const results = await Promise.all(jobs.slice(i, i + 3).map(generate));
  ok += results.filter(Boolean).length;
}
console.log(`${ok}/${jobs.length} image(s) generated. Next: node ${join(dirname(new URL(import.meta.url).pathname), 'photo_check.mjs')} <images> --use "<slot>" --brand "<brand>"`);
process.exit(ok === jobs.length ? 0 : 1);
