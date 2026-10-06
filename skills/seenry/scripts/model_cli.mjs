/** Run a fresh, blind model process (Codex CLI or Claude Code) on images and a prompt, and get JSON back.
 *  Shared by critic.mjs and photo_check.mjs. Override the CLI with SEENRY_CRITIC=codex|claude and the binaries with
 *  SEENRY_CODEX_BIN / SEENRY_CLAUDE_BIN. Codex runs on SEENRY_CODEX_MODEL if set, else gpt-6.1-sol, falling back to
 *  gpt-6-sol and then the CLI's default when an account does not offer a model. */
import {existsSync, readFileSync, writeFileSync, mkdtempSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {tmpdir, homedir, userInfo} from 'node:os';
import {spawnSync} from 'node:child_process';

// A PATH can hold several installs of a CLI, some broken (a global npm shim whose binary is missing), so try each
// candidate and keep the first that actually runs.
function runnable(name) {
  const found = spawnSync('sh', ['-c', `which -a ${name} 2>/dev/null`], {encoding: 'utf8'}).stdout.split('\n').filter(Boolean);
  const homes = [homedir(), userInfo().homedir];
  const extra = name === 'codex'
    ? [process.env.SEENRY_CODEX_BIN, ...homes.flatMap(h => [join(h, '.local/bin/codex'), join(h, '.codex/packages/standalone/current/bin/codex')])]
    : [process.env.SEENRY_CLAUDE_BIN, ...homes.map(h => join(h, '.local/bin/claude'))];
  for (const bin of [...new Set([...extra.filter(Boolean), ...found])]) {
    if (existsSync(bin) && spawnSync(bin, ['--version'], {stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000}).status === 0) return bin;
  }
  return null;
}

export function findCli(preferred) {
  for (const cli of preferred ? [preferred] : ['codex', 'claude']) {
    const bin = runnable(cli);
    if (bin) return {cli, bin};
  }
  return null;
}

/** Returns the parsed JSON, or throws with the CLI's error output. */
export function askModel({cli, bin}, {images, prompt, schema}) {
  const work = mkdtempSync(join(tmpdir(), 'seenry-model-'));
  if (cli === 'codex') {
    const schemaFile = join(work, 'schema.json'), result = join(work, 'out.json');
    writeFileSync(schemaFile, JSON.stringify(schema));
    let last = '';
    for (const model of [...new Set([process.env.SEENRY_CODEX_MODEL, 'gpt-6.1-sol', 'gpt-6-sol', ''])].filter(m => m !== undefined)) {
      const cmd = ['exec', '--skip-git-repo-check', '-s', 'read-only', ...(model ? ['-m', model] : []), '-c', `model_reasoning_effort="${process.env.SEENRY_CRITIC_EFFORT || 'medium'}"`, '--output-schema', schemaFile, '-o', result];
      for (const img of images) cmd.push('-i', img);
      cmd.push('--', prompt);
      const r = spawnSync(bin, cmd, {cwd: work, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 900000});
      if (existsSync(result)) return JSON.parse(readFileSync(result, 'utf8'));
      last = `codex failed on ${model || 'its default model'} (status ${r.status}${r.error ? ', ' + r.error.code : ''}): ${(r.stderr || r.stdout || '').slice(-1500)}`;
      if (!/not supported|does not exist|unknown model|model_not_found|invalid model/i.test(r.stderr + r.stdout)) break;
    }
    throw new Error(last);
  }
  const p = `${prompt}\n\nThe images are these files; read each one: ${images.join(', ')}\nAnswer with only a JSON object matching this schema: ${JSON.stringify(schema)}`;
  const r = spawnSync(bin, ['-p', p, '--allowedTools', 'Read', '--output-format', 'text', ...[...new Set(images.map(i => dirname(i)))].flatMap(d => ['--add-dir', d])], {cwd: work, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 900000});
  const out = r.stdout || '';
  const raw = out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1);
  if (!raw) throw new Error(`claude failed (status ${r.status}): ${(r.stderr || out).slice(-1500)}`);
  return JSON.parse(raw);
}
