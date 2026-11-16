// Seenry's critics and judges run on the host agent app's CLI and the person's own model, never one Seenry picks.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, readFileSync, readdirSync, statSync, chmodSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';

const cli = await import(pathToFileURL(resolve('skills/seenry/scripts/model_cli.mjs')).href);

test('the host app decides the CLI', () => {
  assert.equal(cli.hostCli({CLAUDECODE: '1'}), 'claude');
  assert.equal(cli.hostCli({CLAUDE_CODE_ENTRYPOINT: 'sdk-ts'}), 'claude');
  assert.equal(cli.hostCli({CODEX_THREAD_ID: 'x'}), 'codex');
  assert.equal(cli.hostCli({__CFBundleIdentifier: 'com.openai.codex'}), 'codex');
  assert.equal(cli.hostCli({}), null);
});

test('no model is named unless the person names one', () => {
  for (const name of ['claude', 'codex']) {
    const args = cli.cliArgs(name, {});
    assert.ok(!args.includes('-m') && !args.includes('--model'), `${name}: ${args.join(' ')}`);
    assert.ok(!args.some(a => /reasoning_effort/.test(a)), 'no effort override either');
  }
  assert.deepEqual(cli.cliArgs('codex', {SEENRY_MODEL: 'mine'}).slice(-2), ['-m', 'mine']);
  assert.deepEqual(cli.cliArgs('claude', {SEENRY_CLAUDE_MODEL: 'mine'}).slice(-2), ['--model', 'mine']);
  assert.equal(cli.modelFor('codex', {SEENRY_CODEX_MODEL: 'c', SEENRY_CLAUDE_MODEL: 'x'}), 'c');
  assert.equal(typeof cli.codexModels, 'undefined', 'no list of models to fall back through');
});

test('no helper script carries a model id of its own', () => {
  // Image APIs called with a key (seenry-assets) need a model id per request; they are not an agent CLI.
  const skip = new Set([resolve('skills/seenry-assets/scripts/assets.py')]);
  const files = [];
  const walk = d => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) { if (n !== 'node_modules') walk(p); } else if (/\.(mjs|js|cjs|py)$/.test(n) && !skip.has(p)) files.push(p); } };
  walk(resolve('skills'));
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    assert.doesNotMatch(text, /['"`](gpt-\d[\w.-]*|o\d-[\w-]+|claude-(opus|sonnet|haiku|fable)[\w.-]*|opus|sonnet|haiku)['"`]/, f);
    assert.doesNotMatch(text, /--model['"`]?\s*,\s*['"`]\w/, `${f} passes a fixed --model`);
  }
});

test('a fake host CLI receives no model flag, and the person\'s choice when they make one', {skip: process.platform === 'win32' ? 'shell fakes' : false}, () => {
  const dir = mkdtempSync(join(tmpdir(), 'seenry-cli-')), log = join(dir, 'argv.json'), bin = join(dir, 'claude');
  writeFileSync(bin, `#!/bin/sh\nif [ "$1" = "--version" ]; then echo 1.0; exit 0; fi\nnode -e 'require("fs").writeFileSync(process.argv[1], JSON.stringify(process.argv.slice(2)))' ${JSON.stringify(log)} "$@"\necho '{"ok": true}'\n`);
  chmodSync(bin, 0o755);
  const saved = {...process.env};
  try {
    Object.assign(process.env, {SEENRY_CLAUDE_BIN: bin, CLAUDECODE: '1'}); delete process.env.SEENRY_MODEL; delete process.env.SEENRY_CLAUDE_MODEL;
    const found = cli.findCli();
    assert.deepEqual(found, {cli: 'claude', bin});
    assert.deepEqual(cli.askModel(found, {images: [], prompt: 'p', schema: {}}), {ok: true});
    assert.ok(!JSON.parse(readFileSync(log, 'utf8')).includes('--model'));
    process.env.SEENRY_MODEL = 'their-pick';
    cli.askModel(found, {images: [], prompt: 'p', schema: {}});
    const argv = JSON.parse(readFileSync(log, 'utf8'));
    assert.equal(argv[argv.indexOf('--model') + 1], 'their-pick');
  } finally { for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]; Object.assign(process.env, saved); }
});
