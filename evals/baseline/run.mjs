#!/usr/bin/env node
/** Baseline eval: does the Seenry skill set make a coding agent build a better landing page than the same agent without it?
 *
 *  node evals/baseline/run.mjs [--models claude:sonnet,codex] [--briefs clinic-scheduling,…] [--runs <dir>] [--parallel 2] [--minutes 75] [--conditions A,B] [--probe] [--dry]
 *                              [--director] [--brief-file <md> --brief-id <id>] [--refs <dir>] [--without-example]
 *
 *  --director  A person directs the run: the prompt says a director will pick from the sketches on the canvas, and
 *              direct.mjs (watch, then pick) stands in for them. Without it the run is unattended, as before.
 *  --brief-file / --brief-id   one brief from a file instead of evals/level/briefs.json.
 *  --refs      copies the person's reference images into the run's refs/ folder; the prompt names them.
 *  --without-example   removes the Waterline example from the run's copy of the skill, for a run on Waterline's own job.
 *
 *  Two conditions per brief and model, everything else identical (model, effort, CLI flags, time cap, Playwright,
 *  `codex exec` for images, network):
 *    A  baseline: no Seenry skills, no Seenry MCP. Prompt: "Design and build this landing page; pick any stack."
 *    B  seenry:   the repo's skills installed in the run folder and the Seenry MCP connected. Prompt: "Use the seenry skill."
 *
 *  Isolation. Each run gets its own HOME, so the person's user-level skills (~/.claude/skills, ~/.agents/skills,
 *  ~/.codex/skills) and MCP servers are not visible in either condition. Claude runs with --strict-mcp-config, so the
 *  repo's .mcp.json (Bearer ${SEENRY_PRO_KEY}, empty unless exported) cannot shadow the key: that is what sent Sonnet
 *  a 401 in earlier rounds, because those runs lived inside the repo. Run folders live outside any repo for the same
 *  reason, and so a baseline agent cannot wander into skills/.
 *
 *  Validity. A B run is invalid when the MCP preflight fails, when the agent's MCP did not connect, when any Seenry call
 *  came back unauthorised, or when no Seenry call succeeded. An A run is invalid if any Seenry skill or tool shows up.
 *  Invalid runs are kept and reported, never scored as if valid. Re-running skips runs that finished; delete a run's
 *  folder to redo it. Judging is in judge.mjs. */
import {existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, symlinkSync, copyFileSync, readdirSync, createWriteStream, rmSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn, spawnSync} from 'node:child_process';
import {homedir} from 'node:os';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..', '..');
const args = process.argv.slice(2), flag = (n, f) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : f; };
const dry = args.includes('--dry'), probe = args.includes('--probe');
const models = flag('models', 'claude:sonnet,codex').split(',');
const wanted = flag('briefs', 'clinic-scheduling,studio-portfolio,cash-forecast').split(',');
const conditions = flag('conditions', 'A,B').split(',');
const director = args.includes('--director'), refsFrom = flag('refs'), withoutExample = args.includes('--without-example');
const briefs = flag('brief-file') ? [{id: flag('brief-id', 'custom'), brief: readFileSync(resolve(flag('brief-file')), 'utf8').trim()}]
  : JSON.parse(readFileSync(join(root, 'evals', 'level', 'briefs.json'), 'utf8')).filter(b => wanted.includes(b.id));
export const RUNS = resolve(flag('runs', '/tmp/seenry-baseline-runs'));
const parallel = Number(flag('parallel', 2)), minutes = Number(flag('minutes', 75));
const realHome = homedir(), MCP_URL = 'https://mcp.seenry.design';
const PW_DIR = join(RUNS, 'pw');
export const PLAYWRIGHT = join(PW_DIR, 'node_modules', 'playwright', 'index.mjs');

const SUFFIX = 'The brief is in BRIEF.md. Nobody can answer questions or review your work: this is an unattended run. Build the page in this folder. If your stack has a build step, run it so the built page exists at dist/index.html; otherwise leave it at index.html. Do not ask questions.';
// With a director: the same job, but a person is at the canvas to pick, so the run takes the skill's default path.
const DIRECTED = `The brief is in BRIEF.md.${refsFrom ? ' The references I want it held to are in refs/.' : ''} I am at the canvas and will pick from your sketches there: after \`open\`, run \`wait\` and run it again each time it says Still waiting. I answer on the canvas, not in chat, so do not ask questions here and do not pick for me. Build the page in this folder. If your stack has a build step, run it so the built page exists at dist/index.html; otherwise leave it at index.html.`;
export const PROMPTS = {A: `Design and build this landing page; pick any stack. ${SUFFIX}`, B: `Use the seenry skill. ${director ? DIRECTED : SUFFIX}`};

/** The canvas's own clock, and the same moments measured from the start of the run (the clock starts at `init`). */
export function readTimings(work, startedAt) {
  const out = {firstSketchSeconds: null, pickSeconds: null, builtSeconds: null, sinceRunStart: {firstSketch: null, pick: null, built: null}};
  let m; try { m = JSON.parse(readFileSync(join(work, '.seenry', 'canvas', 'canvas.json'), 'utf8')); } catch { return out; }
  const start = Date.parse(m.started || ''), run = Date.parse(startedAt || ''), at = k => Date.parse(m[k] || '');
  const since = (t, from) => from && t && t >= from ? Math.round((t - from) / 1000) : null;
  Object.assign(out, {firstSketchSeconds: since(at('firstOption'), start), pickSeconds: since(at('picked'), start), builtSeconds: since(at('built'), start)});
  out.sinceRunStart = {firstSketch: since(at('firstOption'), run), pick: since(at('picked'), run), built: since(at('built'), run)};
  out.unattended = !!m.unattended;
  return out;
}

/** Images made by image.mjs (its log lists one line per file) and the image files on the canvas. */
export function readImages(work) {
  let log = ''; try { log = readFileSync(join(work, '.seenry', 'images.log'), 'utf8'); } catch {}
  const dir = join(work, '.seenry', 'canvas', 'img');
  return {generated: (log.match(/^✓ /gm) || []).length, failed: (log.match(/^✗ /gm) || []).length, onCanvas: existsSync(dir) ? readdirSync(dir).filter(f => /\.(png|jpe?g|webp|avif)$/i.test(f)).length : 0};
}

function proKey() {
  if (process.env.SEENRY_PRO_KEY) return process.env.SEENRY_PRO_KEY.trim();
  try { return readFileSync(join(realHome, '.config', 'seenry', 'pro-key'), 'utf8').trim(); } catch { return ''; }
}
function realCodexModel() {
  try { return (readFileSync(join(realHome, '.codex', 'config.toml'), 'utf8').match(/^model\s*=\s*"([^"]+)"/m) || [])[1] || null; } catch { return null; }
}

/** One get_credits call over plain HTTP, the way the agent's client will make it. */
async function mcpPreflight(key) {
  const h = {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream'};
  try {
    const init = await fetch(MCP_URL, {method: 'POST', headers: h, body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'initialize', params: {protocolVersion: '2025-06-18', capabilities: {}, clientInfo: {name: 'seenry-eval-preflight', version: '0'}}})});
    const sid = init.headers.get('mcp-session-id');
    const r = await fetch(MCP_URL, {method: 'POST', headers: {...h, ...(sid ? {'mcp-session-id': sid} : {})}, body: JSON.stringify({jsonrpc: '2.0', id: 2, method: 'tools/call', params: {name: 'get_credits', arguments: {}}})});
    const text = await r.text();
    return {ok: r.status === 200 && !/"error"/.test(text.slice(0, 200)), status: r.status, detail: text.slice(0, 160)};
  } catch (e) { return {ok: false, status: 0, detail: String(e.message || e)}; }
}

function setupHome(dir, model, cond, work, key) {
  const home = join(dir, 'home');
  mkdirSync(join(home, 'Library'), {recursive: true});
  // macOS finds the login keychain through HOME; Claude Code's OAuth credentials live there.
  try { symlinkSync(join(realHome, 'Library', 'Keychains'), join(home, 'Library', 'Keychains')); } catch {}
  const codexHome = join(home, '.codex');
  mkdirSync(codexHome, {recursive: true});
  try { symlinkSync(join(realHome, '.codex', 'auth.json'), join(codexHome, 'auth.json')); } catch {}
  try { copyFileSync(join(realHome, '.codex', 'models_cache.json'), join(codexHome, 'models_cache.json')); } catch {}
  const cm = realCodexModel();
  let toml = `${cm ? `model = "${cm}"\n` : ''}model_reasoning_effort = "medium"\n\n[projects."${work}"]\ntrust_level = "trusted"\n`;
  if (cond === 'B') toml += `\n[mcp_servers.seenry]\nurl = "${MCP_URL}"\nstartup_timeout_sec = 30\ntool_timeout_sec = 120\n\n[mcp_servers.seenry.http_headers]\nAuthorization = "Bearer ${key}"\n`;
  writeFileSync(join(codexHome, 'config.toml'), toml, {mode: 0o600});
  const mcpFile = join(home, 'mcp.json');
  writeFileSync(mcpFile, JSON.stringify({mcpServers: cond === 'B' ? {seenry: {type: 'http', url: MCP_URL, headers: {Authorization: `Bearer ${key}`}}} : {}}), {mode: 0o600});
  return {home, codexHome, mcpFile};
}

function childEnv({home, codexHome}, cond, key) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) if (!/^(CLAUDE|CLAUDECODE|ANTHROPIC_|CODEX_|SEENRY_|MCP_|T3CODE_|CURSOR_|CONDUCTOR_)/.test(k)) env[k] = v;
  Object.assign(env, {
    HOME: home, CODEX_HOME: codexHome,
    PLAYWRIGHT_BROWSERS_PATH: join(realHome, 'Library', 'Caches', 'ms-playwright'),
    npm_config_cache: join(realHome, '.npm'),
    NODE_PATH: join(PW_DIR, 'node_modules'),
    SEENRY_PLAYWRIGHT: PLAYWRIGHT,
    // The canvas must not open a tab on the machine running the eval; the director reaches it over HTTP.
    SEENRY_NO_BROWSER: '1',
    PATH: `${join(realHome, '.local', 'bin')}:${process.env.PATH}`,
  });
  if (cond === 'B') env.SEENRY_PRO_KEY = key;
  return env;
}

function command(model, cond, work, mcpFile) {
  const [cli, name] = model.split(':');
  if (cli === 'codex') return ['codex', ['exec', '--json', '--skip-git-repo-check', '--dangerously-bypass-approvals-and-sandbox', ...(name ? ['-m', name] : []), '-C', work, PROMPTS[cond]]];
  return ['claude', ['-p', PROMPTS[cond], '--output-format', 'stream-json', '--verbose', ...(name ? ['--model', name] : []), '--permission-mode', 'bypassPermissions', '--strict-mcp-config', '--mcp-config', mcpFile]];
}

/** What the transcript says about Seenry access, tokens and cost. */
export function readTranscript(file, cli) {
  const out = {mcpConnected: null, seenryCalls: 0, seenryOk: 0, seenryAuthErrors: 0, seenrySkillUsed: false, tokens: null, costUsd: null, turns: null, resultText: null, sessionId: null};
  if (!existsSync(file)) return out;
  const pending = new Map(), unauth = /\b401\b|valid Seenry Pro key|unauthori[sz]ed/i;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (cli === 'claude') {
      if (e.type === 'system' && e.subtype === 'init') {
        out.sessionId = e.session_id || out.sessionId;
        const s = (e.mcp_servers || []).find(m => m.name === 'seenry');
        out.mcpConnected = s ? s.status === 'connected' : false;
        if ((e.skills || e.slash_commands || []).some(n => /seenry/.test(typeof n === 'string' ? n : n.name))) out.seenrySkillsListed = true;
      }
      for (const c of e.message?.content || []) {
        if (c.type === 'tool_use' && /^mcp__seenry__/.test(c.name)) { out.seenryCalls++; pending.set(c.id, c.name); }
        if (c.type === 'tool_use' && c.name === 'Skill' && /seenry/.test(JSON.stringify(c.input))) out.seenrySkillUsed = true;
        if (c.type === 'tool_result' && pending.has(c.tool_use_id)) {
          const text = JSON.stringify(c.content || '');
          if (unauth.test(text)) out.seenryAuthErrors++; else if (!c.is_error) out.seenryOk++;
        }
      }
      if (e.type === 'result') { out.costUsd = e.total_cost_usd ?? null; out.turns = e.num_turns ?? null; out.resultText = String(e.result || '').slice(0, 4000); const u = e.usage || {}; out.tokens = {input: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0), output: u.output_tokens || 0, cached: u.cache_read_input_tokens || 0}; }
    } else {
      const it = e.item || {};
      if (it.type === 'mcp_tool_call' && it.server === 'seenry' && e.type === 'item.completed') {
        out.seenryCalls++;
        const text = JSON.stringify(it.result || '') + JSON.stringify(it.error || '');
        if (unauth.test(text)) out.seenryAuthErrors++; else if (it.status !== 'failed' && !it.error) out.seenryOk++;
      }
      if (it.type === 'command_execution' && /\bskills\/seenry/.test(it.command || '')) out.seenrySkillUsed = true;
      if (it.type === 'agent_message' && e.type === 'item.completed') out.resultText = String(it.text || '').slice(0, 4000);
      if (e.type === 'turn.completed' && e.usage) { const u = e.usage; out.tokens = {input: (out.tokens?.input || 0) + (u.input_tokens || 0), output: (out.tokens?.output || 0) + (u.output_tokens || 0), cached: (out.tokens?.cached || 0) + (u.cached_input_tokens || 0)}; }
      if (/mcp/i.test(e.type || '') && /seenry/.test(line)) { if (/fail|error/i.test(line)) out.mcpConnected = false; else if (out.mcpConnected === null) out.mcpConnected = true; }
    }
  }
  if (cli === 'codex' && out.mcpConnected === null) out.mcpConnected = out.seenryOk > 0 ? true : null;
  return out;
}

export function validity(cond, t, preflight) {
  if (cond === 'B') {
    if (preflight && !preflight.ok) return `MCP preflight failed (${preflight.status})`;
    if (t.mcpConnected === false) return 'Seenry MCP did not connect';
    if (t.seenryAuthErrors > 0) return `${t.seenryAuthErrors} Seenry call(s) unauthorised`;
    // Connected but never called is the agent skipping the skill's research step: that is the skill's effect, so the
    // run counts and is flagged (mcpUnused) rather than invalid.
    if (t.seenryOk === 0 && t.mcpConnected !== true) return 'no Seenry MCP call succeeded';
    return null;
  }
  if (t.seenryCalls > 0 || t.seenrySkillUsed) return 'baseline touched Seenry';
  return null;
}

export const runDir = (model, brief, cond) => join(RUNS, model.replace(/[^\w.-]+/g, '-'), brief, cond);

async function runOne(model, b, cond) {
  const dir = runDir(model, b.id, cond), work = join(dir, 'work'), metaFile = join(dir, 'meta.json');
  if (existsSync(metaFile) && JSON.parse(readFileSync(metaFile, 'utf8')).finished) { console.log(`skip ${model} ${b.id} ${cond} (done)`); return; }
  mkdirSync(work, {recursive: true});
  // Two runners on one folder overwrite each other's transcript and work; refuse instead.
  const lock = join(dir, 'running.lock');
  if (existsSync(lock)) { const pid = Number(readFileSync(lock, 'utf8')); try { process.kill(pid, 0); console.log(`skip ${model} ${b.id} ${cond} (runner ${pid} has it)`); return; } catch {} }
  if (!dry) writeFileSync(lock, String(process.pid));
  const key = proKey(), cli = model.split(':')[0];
  const paths = setupHome(dir, model, cond, work, key);
  writeFileSync(join(work, 'BRIEF.md'), `# Brief\n\n${b.brief}\n`);
  if (cond === 'B') {
    const dest = join(work, cli === 'claude' ? '.claude' : '.agents', 'skills');
    for (const s of readdirSync(join(root, 'skills'))) cpSync(join(root, 'skills', s), join(dest, s), {recursive: true});
    // A run on the example's own job must not see the example: it would copy it. The links to it are cut too.
    if (withoutExample) {
      rmSync(join(dest, 'seenry', 'assets', 'examples', 'waterline'), {recursive: true, force: true});
      const scrub = d => { for (const f of readdirSync(d, {withFileTypes: true})) { const p = join(d, f.name); if (f.isDirectory()) scrub(p); else if (/\.md$/.test(f.name)) { const t = readFileSync(p, 'utf8'), kept = t.split('\n').filter(l => !/waterline/i.test(l)).join('\n'); if (kept !== t) writeFileSync(p, kept); } } };
      for (const s of ['seenry', 'seenry-canvas']) scrub(join(dest, s));
    }
  }
  if (refsFrom && cond === 'B') cpSync(resolve(refsFrom), join(work, 'refs'), {recursive: true});
  const [bin, argv] = command(model, cond, work, paths.mcpFile);
  if (dry) { console.log(`${model} ${b.id} ${cond}\n  cd ${work} && HOME=${paths.home} ${bin} ${argv.map(a => a.length > 60 ? JSON.stringify(a.slice(0, 60) + '…') : a).join(' ')}`); return; }
  const preflight = cond === 'B' ? await mcpPreflight(key) : null;
  const meta = {model, brief: b.id, cond, prompt: PROMPTS[cond], director, withoutExample, startedAt: new Date().toISOString(), preflight, capMinutes: minutes,
    cliVersion: spawnSync(bin, ['--version'], {encoding: 'utf8'}).stdout.trim()};
  if (preflight && !preflight.ok) { Object.assign(meta, {finished: true, invalid: `MCP preflight failed (${preflight.status}): ${preflight.detail}`}); writeFileSync(metaFile, JSON.stringify(meta, null, 2)); console.log(`${model} ${b.id} ${cond} INVALID preflight`); return; }
  writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  console.log(`start ${model} ${b.id} ${cond}`);
  const started = Date.now(), transcript = join(dir, 'transcript.jsonl');
  const code = await new Promise(res => {
    const child = spawn(bin, argv, {cwd: work, env: childEnv(paths, cond, key), stdio: ['ignore', 'pipe', 'pipe'], detached: true});
    const o = createWriteStream(transcript), er = createWriteStream(join(dir, 'stderr.txt'));
    child.stdout.pipe(o); child.stderr.pipe(er);
    const timer = setTimeout(() => { meta.timedOut = true; try { process.kill(-child.pid, 'SIGTERM'); } catch {} setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 15000); }, minutes * 60000);
    child.on('close', c => { clearTimeout(timer); res(c); });
  });
  const t = readTranscript(transcript, cli);
  Object.assign(meta, {finished: true, exitCode: code, seconds: Math.round((Date.now() - started) / 1000), ...t, invalid: validity(cond, t, preflight), mcpUnused: cond === 'B' && t.seenryOk === 0,
    timing: readTimings(work, meta.startedAt), images: readImages(work)});
  writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  if (meta.timing.sinceRunStart.firstSketch !== null) console.log(`     ${b.id}: first sketch ${meta.timing.sinceRunStart.firstSketch}s, pick ${meta.timing.sinceRunStart.pick ?? '-'}s, built ${meta.timing.sinceRunStart.built ?? '-'}s after the run started; ${meta.images.generated} image(s) generated`);
  console.log(`done ${model} ${b.id} ${cond} ${meta.seconds}s exit ${code}${meta.timedOut ? ' TIMED OUT' : ''}${meta.invalid ? ` INVALID: ${meta.invalid}` : ''} seenry ok ${t.seenryOk}/${t.seenryCalls}`);
}

async function runProbe() {
  // Checks the isolation itself: which skills and MCP tools each condition sees. Uses a cheap prompt.
  for (const model of models) for (const cond of conditions) {
    const dir = join(RUNS, 'probe', model.replace(/[^\w.-]+/g, '-'), cond), work = join(dir, 'work');
    mkdirSync(work, {recursive: true});
    const key = proKey(), cli = model.split(':')[0], paths = setupHome(dir, model, cond, work, key);
    if (cond === 'B') { const dest = join(work, cli === 'claude' ? '.claude' : '.agents', 'skills'); for (const s of readdirSync(join(root, 'skills'))) cpSync(join(root, 'skills', s), join(dest, s), {recursive: true}); }
    const ask = 'Do not build anything. Reply with two lines: "skills:" then the names of every skill available to you, comma separated; "seenry-mcp:" then the raw result of calling the Seenry MCP tool get_credits, or "not available" if you have no such tool.';
    const [bin, argv] = command(model, cond, work, paths.mcpFile);
    const i = argv.indexOf(PROMPTS[cond]); argv[i] = ask;
    const r = spawnSync(bin, argv, {cwd: work, env: childEnv(paths, cond, key), encoding: 'utf8', timeout: 600000, maxBuffer: 1 << 26});
    writeFileSync(join(dir, 'transcript.jsonl'), r.stdout || '');
    const t = readTranscript(join(dir, 'transcript.jsonl'), cli);
    console.log(`\n== ${model} ${cond}: mcpConnected ${t.mcpConnected} seenry ok ${t.seenryOk}/${t.seenryCalls} auth errors ${t.seenryAuthErrors}\n${(t.resultText || r.stderr || '').slice(0, 900)}`);
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (!isMain) {}
else if (probe) await runProbe();
else {
  if (!dry && !existsSync(PLAYWRIGHT)) { mkdirSync(PW_DIR, {recursive: true}); spawnSync('npm', ['i', '--prefix', PW_DIR, 'playwright@1.49.1'], {stdio: 'inherit'}); }
  // A and B of one brief and model run side by side, so a usage limit leaves whole pairs.
  const jobs = [];
  for (const b of briefs) for (const model of models) for (const cond of conditions) jobs.push([model, b, cond]);
  let next = 0;
  await Promise.all(Array.from({length: parallel}, async () => { while (next < jobs.length) { const j = jobs[next++]; await runOne(...j); } }));
}
