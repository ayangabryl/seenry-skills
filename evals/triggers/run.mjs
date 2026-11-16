#!/usr/bin/env node
// Asks a model to pick a skill from the listing alone (name + description), the way a host does at startup.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const skills = resolve(here, '../../skills');
const listing = readdirSync(skills).filter((n) => existsSync(resolve(skills, n, 'SKILL.md')))
  .map((n) => `- ${n}: ${readFileSync(resolve(skills, n, 'SKILL.md'), 'utf8').match(/^description: "(.*)"$/m)[1]}`).join('\n');
const prompts = JSON.parse(readFileSync(resolve(here, 'prompts.json'), 'utf8'));
const ask = `You are a coding agent. These skills are installed:\n${listing}\n\nFor each user request below, answer with the one skill you would load first, or "none" if no skill applies. Reply with only a JSON array of strings, one per request, in order.\n\n${prompts.map(([p], i) => `${i + 1}. ${p}`).join('\n')}`;
const target = process.argv[2] || 'claude:sonnet';
const [tool, model] = target.split(':');
const out = tool === 'codex'
  ? execFileSync('codex', ['exec', '--skip-git-repo-check', '-s', 'read-only', ask], { encoding: 'utf8', maxBuffer: 1 << 24 })
  : execFileSync('claude', ['-p', '--model', model, ask], { encoding: 'utf8', maxBuffer: 1 << 24 });
const picks = JSON.parse(out.slice(out.lastIndexOf('['), out.lastIndexOf(']') + 1));
if (picks.length !== prompts.length) { console.error(`model returned ${picks.length} answers for ${prompts.length} requests`); process.exit(2); }
const misses = prompts.map(([p, want], i) => ({ p, want, got: picks[i] })).filter((r) => r.got !== r.want);
const result = { target, total: prompts.length, right: prompts.length - misses.length, misses };
writeFileSync(resolve(here, `result-${target.replace(':', '-')}.json`), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(misses.length > 2 ? 1 : 0);
