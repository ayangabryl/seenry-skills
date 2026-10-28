#!/usr/bin/env node
/** Remember this project's identity on this machine so the next identity can differ from it.
 *  node history.mjs [--dir .seenry] [--project .]      records .seenry/identity.md (system, icon set, display face, hero color, device)
 *  node history.mjs --list                              prints the last ten identities to avoid
 *  Kept in ~/.config/seenry/history.json (last 20). Run it right after writing identity.md; check.mjs runs it too. */
import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {homedir} from 'node:os';

export function recordIdentity(dir, project) {
  const idFile = join(dir, 'identity.md');
  if (!existsSync(idFile)) return null;
  const text = readFileSync(idFile, 'utf8');
  // The text under a numbered or bold heading, up to the next heading, flattened to one line.
  const section = name => { const m = text.match(new RegExp(`${name}[^\\n]*?[.:]\\**\\s*([\\s\\S]*?)(?=\\n\\s*(?:\\d+[.)]|#|- \\*\\*)|$)`, 'i')); return (m?.[1] || '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 180); };
  const entry = {project: resolve(project), at: new Date().toISOString(), type: section('typographic voice') || section('type voice'), color: section('colou?r world'), device: section('graphic device') || section('device'), system: (text.match(/^\s*(?:[-*]\s*)?\**system\**\s*:\s*\**\s*([a-z0-9-]+)/im)?.[1] || '').toLowerCase(), icons: (text.match(/^\s*(?:[-*]\s*)?\**icons?(?: set)?\**\s*:\s*\**\s*([A-Za-z0-9 -]+)/im)?.[1] || '').trim()};
  const histDir = join(homedir(), '.config', 'seenry'), hist = join(histDir, 'history.json');
  mkdirSync(histDir, {recursive: true});
  const list = existsSync(hist) ? JSON.parse(readFileSync(hist, 'utf8')) : [];
  writeFileSync(hist, JSON.stringify([...list.filter(e => e.project !== entry.project), entry].slice(-20), null, 2));
  return entry;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
  if (args.includes('--list')) {
    const hist = join(homedir(), '.config', 'seenry', 'history.json');
    const list = existsSync(hist) ? JSON.parse(readFileSync(hist, 'utf8')).slice(-10) : [];
    if (!list.length) console.log('No identities recorded yet on this machine.');
    for (const e of list) console.log(`- system: ${e.system || 'none'} · icons: ${e.icons || 'none'}\n  face: ${e.type}\n  color: ${e.color}\n  device: ${e.device}`);
  } else {
    const e = recordIdentity(resolve(flag('dir', '.seenry')), flag('project', '.'));
    console.log(e ? `Recorded: ${e.type.slice(0, 60)} · ${e.color.slice(0, 50)} · ${e.device.slice(0, 50)}` : 'No identity.md found; write it first.');
  }
}
