/** Run a fresh, blind model process on images and a prompt, and get JSON back. Shared by every Seenry critic and judge.
 *  The CLI is the host agent app's own: Claude Code inside Claude Code, Codex inside Codex; outside either, whichever is
 *  installed. SEENRY_CRITIC=codex|claude picks one, SEENRY_CODEX_BIN / SEENRY_CLAUDE_BIN the binaries.
 *  No model is chosen here: the CLI runs on the model the person selected or set as their default. SEENRY_MODEL (or
 *  SEENRY_CODEX_MODEL / SEENRY_CLAUDE_MODEL) names one explicitly, and SEENRY_CRITIC_EFFORT a Codex reasoning effort. */
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
    : [process.env.SEENRY_CLAUDE_BIN, process.env.CLAUDE_CODE_EXECPATH, ...homes.map(h => join(h, '.local/bin/claude'))];
  for (const bin of [...new Set([...extra.filter(Boolean), ...found])]) {
    if (existsSync(bin) && spawnSync(bin, ['--version'], {stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000}).status === 0) return bin;
  }
  return null;
}

/** The agent app this process runs inside, when it is one with a CLI: its CLI runs on the model the person chose there. */
export function hostCli(env = process.env) {
  if (env.CLAUDECODE === '1' || env.CLAUDE_CODE_ENTRYPOINT || env.CLAUDE_CODE_EXECPATH) return 'claude';
  if (env.CODEX_THREAD_ID || env.CODEX_SANDBOX || env.CODEX_SANDBOX_NETWORK_DISABLED || /com\.openai\.codex/i.test(env.__CFBundleIdentifier || '')) return 'codex';
  return null;
}

export function findCli(preferred) {
  const host = hostCli();
  for (const cli of preferred ? [preferred] : [...new Set([host, 'codex', 'claude'].filter(Boolean))]) {
    const bin = runnable(cli);
    if (bin) return {cli, bin};
  }
  return null;
}

/** The model the person asked for explicitly, or '' for the CLI's own (their selected or default) model. */
export function modelFor(cli, env = process.env) {
  return String(env.SEENRY_MODEL || (cli === 'codex' ? env.SEENRY_CODEX_MODEL : env.SEENRY_CLAUDE_MODEL) || '').trim();
}

/** The command line for one blind call, without the prompt and images. */
export function cliArgs(cli, env = process.env) {
  const model = modelFor(cli, env);
  if (cli === 'codex') return ['exec', '--skip-git-repo-check', '-s', 'read-only', ...(model ? ['-m', model] : []), ...(env.SEENRY_CRITIC_EFFORT ? ['-c', `model_reasoning_effort="${env.SEENRY_CRITIC_EFFORT}"`] : [])];
  return ['--allowedTools', 'Read', '--output-format', 'text', ...(model ? ['--model', model] : [])];
}

/** Returns the parsed JSON, or throws with the CLI's error output. */
export function askModel({cli, bin}, {images, prompt, schema}) {
  const work = mkdtempSync(join(tmpdir(), 'seenry-model-'));
  if (cli === 'codex') {
    const schemaFile = join(work, 'schema.json'), result = join(work, 'out.json');
    writeFileSync(schemaFile, JSON.stringify(schema));
    const cmd = [...cliArgs('codex'), '--output-schema', schemaFile, '-o', result];
    for (const img of images) cmd.push('-i', img);
    cmd.push('--', prompt);
    const r = spawnSync(bin, cmd, {cwd: work, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 900000});
    if (existsSync(result)) return JSON.parse(readFileSync(result, 'utf8'));
    throw new Error(`codex failed on ${modelFor('codex') || 'your default model'} (status ${r.status}${r.error ? ', ' + r.error.code : ''}): ${(r.stderr || r.stdout || '').slice(-1500)}`);
  }
  const p = `${prompt}\n\nThe images are these files; read each one: ${images.join(', ')}\nAnswer with only a JSON object matching this schema: ${JSON.stringify(schema)}`;
  const r = spawnSync(bin, ['-p', p, ...cliArgs('claude'), ...[...new Set(images.map(i => dirname(i)))].flatMap(d => ['--add-dir', d])], {cwd: work, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 900000});
  const out = r.stdout || '';
  const raw = out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1);
  if (!raw) throw new Error(`claude failed (status ${r.status}): ${(r.stderr || out).slice(-1500)}`);
  return JSON.parse(raw);
}
