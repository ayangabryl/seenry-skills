// `library` finds the agents on a computer and adds the Seenry MCP server to each one's own config; `update` runs the
// skills installer and restarts a running canvas. Every run here uses a fake home folder and a stand-in for npx and claude.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, statSync, readdirSync, chmodSync, cpSync, rmSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn, spawnSync} from 'node:child_process';
import {request} from 'node:http';

const sync = resolve('skills/seenry-canvas/scripts/sync.mjs');
const KEY = 'seenry_pro_' + 'k'.repeat(43), URL = 'https://mcp.seenry.design/pro';
const posix = process.platform !== 'win32';

/** A home folder with the given agent folders, a linked Seenry config holding the library key, and a project inside it. */
function computer(folders = []) {
  const home = mkdtempSync(join(tmpdir(), 'seenry-home-')), config = join(home, '.config', 'seenry'), bin = join(home, 'bin'), project = join(home, 'work', 'shop');
  for (const f of [config, bin, project, ...folders.map(f => join(home, f))]) mkdirSync(f, {recursive: true});
  writeFileSync(join(config, 'canvas-sync.json'), JSON.stringify({server: 'http://127.0.0.1:9', token: 'seenry_canvas_' + 'x'.repeat(43)}));
  writeFileSync(join(config, 'canvas-library-key'), KEY + '\n', {mode: 0o600});
  const env = {HOME: home, USERPROFILE: home, APPDATA: join(home, 'AppData'), XDG_CONFIG_HOME: '', CODEX_HOME: '', COPILOT_HOME: '', SEENRY_CONFIG_DIR: config, PATH: bin};
  const library = (...args) => spawnSync(process.execPath, [sync, 'library', ...args], {cwd: project, encoding: 'utf8', env: {...process.env, ...env}});
  return {home, config, bin, project, env, library};
}
const read = path => readFileSync(path, 'utf8');
const backups = folder => readdirSync(folder).filter(f => f.includes('.seenry-backup-'));
const fakeClaude = (bin, log, stored = '') => {
  writeFileSync(join(bin, 'claude'), `#!/bin/sh\necho "$@" >> "${log}"\nif [ "$2" = "get" ]; then ${stored ? `printf '%s\\n' '${stored}'; exit 0` : 'exit 1'}; fi\nexit 0\n`);
  chmodSync(join(bin, 'claude'), 0o755);
};

test('library with no --agent finds every installed agent and adds the server, keeping their other servers', () => {
  const c = computer(['.cursor', '.codex', '.gemini/antigravity', '.kimi', '.copilot', '.claude']);
  const cursor = join(c.home, '.cursor', 'mcp.json'), codex = join(c.home, '.codex', 'config.toml');
  writeFileSync(cursor, JSON.stringify({mcpServers: {notes: {command: 'uvx', args: ['notes-mcp']}}}, null, 4) + '\n');
  writeFileSync(codex, 'model = "o3"\n\n[mcp_servers.tasks]\ncommand = "tasks"\n\n[mcp_servers.tasks.env]\nPATH_X = "1"\n');
  const log = join(c.bin, 'claude.log');
  if (posix) fakeClaude(c.bin, log);

  const first = c.library();
  assert.equal(first.status, 0, first.stderr);
  assert.ok(!(first.stdout + first.stderr).includes(KEY), 'the key is never printed');
  for (const name of ['Codex', 'Cursor', 'Antigravity', 'GitHub Copilot', 'Kimi Code']) assert.match(first.stdout, new RegExp(`${name}[^\\n]*: added to ~`), name);
  assert.match(first.stdout, /Not found on this computer: Gemini CLI/);
  if (posix) {
    assert.match(first.stdout, /Claude Code: added for every project/);
    assert.ok(read(log).includes(`mcp add --transport http --scope user seenry ${URL} --header Authorization: Bearer ${KEY}`));
  } else assert.match(first.stdout, /Claude Code: could not: the claude command was not found\. By hand: run claude mcp add[^\n]*\$\(cat /);

  const cursorData = JSON.parse(read(cursor));
  assert.deepEqual(cursorData.mcpServers.notes, {command: 'uvx', args: ['notes-mcp']}, 'other servers are kept');
  assert.deepEqual(cursorData.mcpServers.seenry, {url: URL, headers: {Authorization: `Bearer ${KEY}`}});
  assert.match(read(cursor), /^\{\n {4}"mcpServers"/, 'the file keeps its indentation');
  assert.equal(read(codex), 'model = "o3"\n\n[mcp_servers.tasks]\ncommand = "tasks"\n\n[mcp_servers.tasks.env]\nPATH_X = "1"\n\n'
    + `[mcp_servers.seenry]\nurl = "${URL}"\nhttp_headers = { Authorization = "Bearer ${KEY}" }\n`, 'Codex gets a table appended, nothing else changes');
  assert.deepEqual(JSON.parse(read(join(c.home, '.gemini', 'config', 'mcp_config.json'))), {mcpServers: {seenry: {serverUrl: URL, headers: {Authorization: `Bearer ${KEY}`}}}});
  assert.deepEqual(JSON.parse(read(join(c.home, '.copilot', 'mcp-config.json'))).mcpServers.seenry, {type: 'http', url: URL, headers: {Authorization: `Bearer ${KEY}`}, tools: ['*']});
  assert.deepEqual(JSON.parse(read(join(c.home, '.kimi', 'mcp.json'))).mcpServers.seenry, {url: URL, transport: 'http', headers: {Authorization: `Bearer ${KEY}`}});
  assert.ok(!existsSync(join(c.home, '.gemini', 'settings.json')), 'an agent that is not installed is not configured');
  assert.equal(backups(join(c.home, '.cursor')).length, 1, 'a file is backed up before it changes');
  assert.equal(read(join(c.home, '.cursor', backups(join(c.home, '.cursor'))[0])), JSON.stringify({mcpServers: {notes: {command: 'uvx', args: ['notes-mcp']}}}, null, 4) + '\n');
  assert.equal(backups(join(c.home, '.kimi')).length, 0, 'a new file has nothing to back up');
  if (posix) for (const f of [cursor, codex, join(c.home, '.kimi', 'mcp.json'), join(c.home, '.cursor', backups(join(c.home, '.cursor'))[0])]) assert.equal(statSync(f).mode & 0o777, 0o600, f);
  assert.ok(!readdirSync(c.project).length, 'nothing is written into the project');

  // The same run again changes nothing.
  const before = [cursor, codex].map(read);
  if (posix) fakeClaude(c.bin, log, `seenry:\n  URL: ${URL}\n  Headers:\n    Authorization: Bearer ${KEY}`);
  const second = c.library();
  assert.equal(second.status, 0, second.stderr);
  for (const name of ['Codex', 'Cursor', 'Antigravity', 'GitHub Copilot', 'Kimi Code', ...(posix ? ['Claude Code'] : [])]) assert.match(second.stdout, new RegExp(`${name}[^\\n]*: already set`), name);
  assert.deepEqual([cursor, codex].map(read), before);
  assert.equal(backups(join(c.home, '.cursor')).length, 1, 'no new backup when nothing changed');
  if (posix) assert.ok(!read(log).split('\n').slice(-2).join('').includes('remove'), 'Claude Code is not touched either');
  assert.ok(!(second.stdout + second.stderr).includes(KEY));
});

test('library updates a rotated key in place and leaves what it does not understand as it is', () => {
  const c = computer(['.cursor', '.codex', '.kimi', '.copilot', '.gemini']);
  const old = 'seenry_pro_' + 'o'.repeat(43);
  const cursor = join(c.home, '.cursor', 'mcp.json'), codex = join(c.home, '.codex', 'config.toml'), kimi = join(c.home, '.kimi', 'mcp.json');
  const copilot = join(c.home, '.copilot', 'mcp-config.json'), gemini = join(c.home, '.gemini', 'settings.json');
  writeFileSync(cursor, JSON.stringify({mcpServers: {seenry: {url: URL, headers: {Authorization: `Bearer ${old}`, 'X-Team': 'a'}, timeout: 30}}}));
  const toml = `[mcp_servers.seenry]\nurl = "${URL}"\nstartup_timeout_sec = 20\n\n[mcp_servers.seenry.http_headers]\nAuthorization = "Bearer ${old}"\n`;
  writeFileSync(codex, toml);
  writeFileSync(kimi, JSON.stringify({mcpServers: {seenry: {url: 'https://mcp.seenry.design'}}}));
  const commented = '{\n  // my servers\n  "mcpServers": {}\n}\n';
  writeFileSync(copilot, commented);
  writeFileSync(gemini, JSON.stringify({mcpServers: {seenry: {httpUrl: URL, headers: {Authorization: 'Bearer ${SEENRY_PRO_KEY}'}}}}));

  const out = c.library();
  assert.equal(out.status, 0, out.stderr);
  assert.ok(!(out.stdout + out.stderr).includes(KEY) && !out.stdout.includes(old));
  assert.match(out.stdout, /Cursor: key updated in ~/);
  assert.deepEqual(JSON.parse(read(cursor)).mcpServers.seenry, {url: URL, headers: {'X-Team': 'a', Authorization: `Bearer ${KEY}`}, timeout: 30}, 'its other settings are kept');
  assert.match(out.stdout, /Codex: key updated in ~/);
  assert.equal(read(codex), toml.replace(old, KEY), 'only the key changes in the Codex file');
  assert.match(out.stdout, /Kimi Code: left as it is: [^\n]*different MCP server named seenry \(https:\/\/mcp\.seenry\.design\)/);
  assert.match(out.stdout, /GitHub Copilot[^\n]*: could not: [^\n]*not plain JSON[^\n]*By hand: add "seenry"/);
  assert.equal(read(copilot), commented, 'a file with comments is never rewritten');
  assert.match(out.stdout, /Gemini CLI: already set[^\n]*environment variable/);
  assert.equal(backups(join(c.home, '.kimi')).length + backups(join(c.home, '.copilot')).length + backups(join(c.home, '.gemini')).length, 0);

  writeFileSync(codex, 'mcp_servers = { other = { command = "x" } }\n');
  const inline = c.library('--agent', 'codex');
  assert.match(inline.stdout, /Codex: could not: [^\n]*form this script does not edit[^\n]*By hand: add \[mcp_servers\.seenry\]/);
  assert.equal(read(codex), 'mcp_servers = { other = { command = "x" } }\n');
});

test('library --agent sets up one agent, says when it is missing, and never writes into the project', () => {
  const c = computer(['.cursor', '.kimi']);
  const one = c.library('--agent', 'cursor');
  assert.equal(one.status, 0, one.stderr);
  assert.match(one.stdout, /Cursor: added/);
  assert.ok(!existsSync(join(c.home, '.kimi', 'mcp.json')), 'only the agent asked for');
  assert.ok(!one.stdout.includes('Not found'));
  assert.match(c.library('--agent', 'antigravity').stdout, /Antigravity: could not: it was not found on this computer\. By hand: add "seenry": \{"serverUrl"/);
  const unknown = c.library('--agent', 'notepad');
  assert.match(unknown.stdout, /"notepad" is not one this script can set up[\s\S]*Authorization: Bearer <the key in /);
  assert.ok(!unknown.stdout.includes(KEY));

  mkdirSync(join(c.project, '.codex'));
  const inside = spawnSync(process.execPath, [sync, 'library', '--agent', 'codex'], {cwd: c.project, encoding: 'utf8', env: {...process.env, ...c.env, CODEX_HOME: join(c.project, '.codex')}});
  assert.match(inside.stdout, /Codex: could not: [^\n]*would be inside this project/);
  assert.deepEqual(readdirSync(join(c.project, '.codex')), []);
});

// ── update ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** A copy of the installed skills, and a stand-in npx that lists them, records each call and "updates" them. */
function installed({fail = false} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'seenry-skills-')), skills = join(root, 'skills');
  cpSync(resolve('skills/seenry-canvas'), join(skills, 'seenry-canvas'), {recursive: true});
  mkdirSync(join(skills, 'animate'), {recursive: true});
  writeFileSync(join(skills, 'animate', 'SKILL.md'), '---\nname: animate\ndescription: x\n---\nv1\n');
  mkdirSync(join(skills, 'quiet'), {recursive: true});
  writeFileSync(join(skills, 'quiet', 'SKILL.md'), '---\nname: quiet\n---\n');
  const log = join(root, 'npx.log'), npx = join(root, 'npx.mjs');
  writeFileSync(npx, `import {appendFileSync, readFileSync, writeFileSync} from 'node:fs';
const args = process.argv.slice(2), skills = ${JSON.stringify(skills)};
appendFileSync(${JSON.stringify(log)}, args.join(' ') + '\\n');
if (args.join(' ') === '-y skills ls -g --json') console.log(JSON.stringify(['seenry-canvas', 'animate', 'quiet'].map(name => ({name, path: skills + '/' + name, scope: 'global'}))));
else if (args.join(' ') === '-y skills update -g -y') {
  if (${fail}) { console.error('network down'); process.exit(1); }
  const file = skills + '/seenry-canvas/SKILL.md';
  writeFileSync(file, readFileSync(file, 'utf8').replace(/version: "[^"]+"/, 'version: "9.9.9"'));
  writeFileSync(skills + '/animate/SKILL.md', '---\\nname: animate\\ndescription: x\\n---\\nv2\\n');
} else { console.error('unexpected: ' + args.join(' ')); process.exit(9); }
`);
  const project = mkdtempSync(join(tmpdir(), 'seenry-update-')), dir = join(project, '.seenry', 'canvas');
  const script = join(skills, 'seenry-canvas', 'scripts', 'canvas.mjs');
  const env = {...process.env, SEENRY_NPX: npx, SEENRY_CONFIG_DIR: mkdtempSync(join(tmpdir(), 'seenry-no-link-'))};
  const update = (...args) => spawnSync(process.execPath, [script, 'update', ...args], {cwd: project, encoding: 'utf8', env});
  // Async when a canvas runs: the test started that server, so its event loop must stay free to reap it once killed.
  const updating = (...args) => new Promise(done => {
    const child = spawn(process.execPath, [script, 'update', ...args], {cwd: project, env});
    let stdout = '', stderr = '';
    child.stdout.on('data', c => { stdout += c; }); child.stderr.on('data', c => { stderr += c; });
    child.on('close', status => done({status, stdout, stderr}));
  });
  return {skills, log, project, dir, script, env, update, updating};
}
const version = skills => read(join(skills, 'seenry-canvas', 'SKILL.md')).match(/version: "([^"]+)"/)[1];
const get = port => new Promise((done, fail) => request({host: '127.0.0.1', port, path: '/'}, res => { res.resume(); done(res.statusCode); }).on('error', fail).end());
const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };

test('update takes no flags, runs the installer for every global skill, and says what changed', () => {
  const s = installed(), was = version(s.skills);
  const out = s.update();
  assert.equal(out.status, 0, out.stderr + out.stdout);
  assert.deepEqual(read(s.log).trim().split('\n'), ['-y skills ls -g --json', '-y skills update -g -y', '-y skills ls -g --json']);
  assert.ok(out.stdout.includes(`seenry-canvas ${was} → 9.9.9`), out.stdout);
  assert.match(out.stdout, /animate: updated/);
  assert.ok(!out.stdout.includes('quiet'), 'an unchanged skill is only counted');
  assert.match(out.stdout, /2 updated, 1 already current/);
  assert.match(out.stdout, /No canvas is running/);
  assert.match(out.stdout, /Start a new agent session/);
  assert.ok(!existsSync(s.dir), 'update never makes a canvas');
});

test('update restarts a running canvas on the new code, on its port, and leaves the screens alone', async t => {
  const s = installed();
  assert.equal(spawnSync(process.execPath, [s.script, 'init', s.dir], {env: s.env}).status, 0);
  mkdirSync(join(s.dir, '01-home')); const screen = join(s.dir, '01-home', 'a.html');
  writeFileSync(screen, '<!doctype html><title>Home</title><p>Mine</p>');
  const server = spawn(process.execPath, [s.script, 'serve', s.dir, '--port', '0'], {env: s.env, detached: true, stdio: 'ignore'});
  server.unref();
  let info = null;
  for (let i = 0; i < 50 && !info; i++) { await new Promise(r => setTimeout(r, 100)); try { info = JSON.parse(read(join(s.dir, '.canvas.json'))); } catch {} }
  assert.ok(info, 'the canvas started');
  let next = null;
  t.after(() => { for (const pid of [info.pid, next?.pid]) { try { if (pid) process.kill(pid); } catch {} } });

  const out = await s.updating(s.dir);
  assert.equal(out.status, 0, out.stderr + out.stdout);
  assert.match(out.stdout, /Restarted the canvas on the new code: http:\/\/127\.0\.0\.1:\d+\/\. Your screens and feedback are as they were\./);
  next = JSON.parse(read(join(s.dir, '.canvas.json')));
  assert.notEqual(next.pid, info.pid);
  assert.equal(next.port, info.port, 'same address, so the open pane reconnects');
  assert.ok(!alive(info.pid), 'the old server is gone');
  assert.equal(await get(next.port), 200);
  assert.equal(read(screen), '<!doctype html><title>Home</title><p>Mine</p>');

  const again = await s.updating(s.dir);
  assert.match(again.stdout, /already runs the current code/, 'nothing changed, nothing restarts');
  assert.equal(JSON.parse(read(join(s.dir, '.canvas.json'))).pid, next.pid);
});

test('update that fails says so and restarts nothing', async t => {
  const s = installed({fail: true});
  assert.equal(spawnSync(process.execPath, [s.script, 'init', s.dir], {env: s.env}).status, 0);
  const server = spawn(process.execPath, [s.script, 'serve', s.dir, '--port', '0'], {env: s.env, detached: true, stdio: 'ignore'});
  server.unref();
  let info = null;
  for (let i = 0; i < 50 && !info; i++) { await new Promise(r => setTimeout(r, 100)); try { info = JSON.parse(read(join(s.dir, '.canvas.json'))); } catch {} }
  t.after(() => { try { process.kill(info.pid); } catch {} rmSync(s.project, {recursive: true, force: true}); });
  const out = await s.updating(s.dir);
  assert.equal(out.status, 1);
  assert.match(out.stderr, /The update did not finish\. Nothing was restarted\.\nnetwork down/);
  assert.equal(JSON.parse(read(join(s.dir, '.canvas.json'))).pid, info.pid);
  assert.ok(alive(info.pid));
});
