#!/usr/bin/env node
// Does the agent load a Seenry skill before it edits UI code, with (a) skills only and (b) skills plus the AGENTS.md index?
// Each run: a fresh small React app with the skills copied into .claude/skills, `claude -p` with user settings,
// user skills and MCP excluded. A run counts as "loaded" when a Skill call names seenry* or a Read opens a seenry
// SKILL.md before the first Write/Edit; it is stopped at that first edit, or after the turn or time limit.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const model = args.model || 'sonnet';
const trials = Number(args.trials || 1);
const parallel = Number(args.parallel || 4);
const limitMs = Number(args.timeout || 240) * 1000;
const tasks = JSON.parse(readFileSync(join(here, 'tasks.json'), 'utf8')).slice(0, Number(args.limit || 99));
const block = execFileSync('python3', ['-c', `import importlib.util as u;s=u.spec_from_file_location('i','${repo}/scripts/install.py');m=u.module_from_spec(s);s.loader.exec_module(m);print(m.index_block('.claude/skills'))`], { encoding: 'utf8' }).trim();
const root = mkdtempSync(join(args.tmp || tmpdir(), 'seenry-always-on-'));
const mcp = join(root, 'mcp.json');
writeFileSync(mcp, '{"mcpServers":{}}');

const app = {
  'package.json': JSON.stringify({ name: 'acme-app', private: true, type: 'module', scripts: { dev: 'vite' }, dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', 'react-router-dom': '^7.0.0' }, devDependencies: { vite: '^6.0.0', '@vitejs/plugin-react': '^4.0.0' } }, null, 2),
  'index.html': '<!doctype html><html><head><title>Acme</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>\n',
  'src/main.jsx': "import { createRoot } from 'react-dom/client';\nimport { BrowserRouter } from 'react-router-dom';\nimport App from './App.jsx';\nimport './styles.css';\ncreateRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>);\n",
  'src/App.jsx': "import { Routes, Route } from 'react-router-dom';\nimport Sidebar from './components/Sidebar.jsx';\nimport Home from './pages/Home.jsx';\nimport Dashboard from './pages/Dashboard.jsx';\nimport Projects from './pages/Projects.jsx';\n\nexport default function App() {\n  return (\n    <div className=\"layout\">\n      <Sidebar />\n      <main>\n        <Routes>\n          <Route path=\"/\" element={<Home />} />\n          <Route path=\"/dashboard\" element={<Dashboard />} />\n          <Route path=\"/projects\" element={<Projects />} />\n        </Routes>\n      </main>\n    </div>\n  );\n}\n",
  'src/components/Sidebar.jsx': "import { NavLink } from 'react-router-dom';\n\nexport default function Sidebar() {\n  return (\n    <nav className=\"sidebar\">\n      <NavLink to=\"/\">Home</NavLink>\n      <NavLink to=\"/dashboard\">Dashboard</NavLink>\n      <NavLink to=\"/projects\">Projects</NavLink>\n    </nav>\n  );\n}\n",
  'src/pages/Home.jsx': "export default function Home() {\n  return (\n    <section className=\"hero\">\n      <h1>Ship projects faster with Acme</h1>\n      <p>The all-in-one workspace for modern teams.</p>\n      <a className=\"button\" href=\"/dashboard\">Get started</a>\n    </section>\n  );\n}\n",
  'src/pages/Dashboard.jsx': "import { useProjects } from '../api.js';\n\nexport default function Dashboard() {\n  const { projects } = useProjects();\n  return (\n    <div>\n      <h1>Dashboard</h1>\n      <div className=\"stats\">\n        <div className=\"card\">Projects: {projects.length}</div>\n        <div className=\"card\">Signups this week: 128</div>\n      </div>\n    </div>\n  );\n}\n",
  'src/pages/Projects.jsx': "import { useProjects } from '../api.js';\n\nexport default function Projects() {\n  const { projects, remove, save } = useProjects();\n  return (\n    <div>\n      <h1>Projects</h1>\n      <ul>\n        {projects.map((p) => (\n          <li key={p.id}>{p.name} <button onClick={() => save(p)}>Save</button> <button onClick={() => remove(p.id)}>Delete</button></li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n",
  'src/api.js': "import { useEffect, useState } from 'react';\n\nexport function useProjects() {\n  const [projects, setProjects] = useState([]);\n  const [loading, setLoading] = useState(true);\n  useEffect(() => { fetch('/api/projects').then((r) => r.json()).then(setProjects).finally(() => setLoading(false)); }, []);\n  return {\n    projects, loading,\n    save: (p) => fetch(`/api/projects/${p.id}`, { method: 'PUT', body: JSON.stringify(p) }),\n    remove: (id) => fetch(`/api/projects/${id}`, { method: 'DELETE' }).then(() => setProjects((x) => x.filter((p) => p.id !== id))),\n  };\n}\n",
  'src/styles.css': "body { font-family: system-ui, sans-serif; margin: 0; }\n.layout { display: flex; min-height: 100vh; }\n.sidebar { width: 200px; display: flex; flex-direction: column; gap: 8px; padding: 16px; background: #f4f4f5; }\nmain { flex: 1; padding: 24px; }\n.card { padding: 16px; border: 1px solid #ddd; border-radius: 8px; }\n.stats { display: flex; gap: 16px; }\n.button { background: #4f46e5; color: white; padding: 10px 16px; border-radius: 6px; }\n",
  'README.md': '# Acme\n\nProject workspace app. `npm run dev` to start.\n',
};

function project(condition, i, trial) {
  const dir = join(root, `${condition}-${trial}-${String(i).padStart(2, '0')}`);
  for (const [file, text] of Object.entries(app)) { mkdirSync(dirname(join(dir, file)), { recursive: true }); writeFileSync(join(dir, file), text); }
  cpSync(join(repo, 'skills'), join(dir, '.claude/skills'), { recursive: true });
  if (condition === 'index') writeFileSync(join(dir, 'AGENTS.md'), block + '\n');
  return dir;
}

function verdictOf(event, state) {
  if (event.type !== 'assistant') return null;
  for (const part of event.message?.content || []) {
    if (part.type !== 'tool_use') continue;
    const input = part.input || {};
    state.tools.push(part.name === 'Skill' ? `Skill:${input.skill || input.command}` : part.name);
    if (part.name === 'Skill' && /seenry/.test(String(input.skill || input.command || ''))) return { loaded: true, skill: String(input.skill || input.command) };
    if (part.name === 'Read' && /skills\/seenry[^/]*\/SKILL\.md$/.test(input.file_path || '')) return { loaded: true, skill: input.file_path.split('/').at(-2) };
    if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(part.name)) return { loaded: false, skill: null, stop: `${part.name} ${(input.file_path || '').split(/seenry-always-on-[^/]+\/[^/]+\//).at(-1)}` };
  }
  return null;
}

function run(condition, task, i, trial) {
  const dir = project(condition, i, trial);
  return new Promise((done) => {
    const child = spawn('claude', ['-p', '--model', model, '--output-format', 'stream-json', '--verbose', '--setting-sources', 'project',
      '--strict-mcp-config', '--mcp-config', mcp, '--permission-mode', 'acceptEdits', '--max-turns', '25', '--', task], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
    const state = { tools: [] };
    let buffer = '', result = null;
    const finish = (r) => { if (result) return; result = r; child.kill('SIGTERM'); };
    const timer = setTimeout(() => finish({ loaded: false, skill: null, stop: 'timeout' }), limitMs);
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      let n;
      while ((n = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, n); buffer = buffer.slice(n + 1);
        try { const v = verdictOf(JSON.parse(line), state); if (v) finish(v); } catch {}
      }
    });
    child.on('close', () => {
      clearTimeout(timer);
      const r = result || { loaded: false, skill: null, stop: 'ended' };
      if (!args.keep) rmSync(dir, { recursive: true, force: true });
      done({ condition, trial, task, ...r, tools: state.tools.slice(0, 12) });
    });
  });
}

const jobs = [];
for (let trial = 1; trial <= trials; trial++) tasks.forEach((task, i) => { for (const c of ['skills', 'index']) jobs.push([c, task, i, trial]); });
const results = [];
await Promise.all(Array.from({ length: parallel }, async () => {
  while (jobs.length) {
    const r = await run(...jobs.shift());
    results.push(r);
    console.error(`${r.condition.padEnd(6)} ${r.loaded ? 'LOADED ' + r.skill : 'missed (' + r.stop + ')'}  ${r.task}`);
  }
}));
const rate = (c) => { const rs = results.filter((r) => r.condition === c); return { loaded: rs.filter((r) => r.loaded).length, runs: rs.length }; };
const summary = { model, trials, date: new Date().toISOString().slice(0, 10), skillsOnly: rate('skills'), skillsPlusIndex: rate('index'),
  results: results.sort((a, b) => a.task.localeCompare(b.task) || a.condition.localeCompare(b.condition)) };
writeFileSync(join(here, `result-claude-${model}.json`), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ skillsOnly: summary.skillsOnly, skillsPlusIndex: summary.skillsPlusIndex }));
rmSync(root, { recursive: true, force: true });
