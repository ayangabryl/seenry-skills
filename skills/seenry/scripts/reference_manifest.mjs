/** Reference handoff contract. Manifest order is priority; reserve one slot per role. */
import {existsSync, readFileSync, readdirSync, statSync, realpathSync} from 'node:fs';
import {resolve, dirname, join, isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
const imageType = /\.(png|jpe?g|webp)$/i;
const fail = message => { throw new Error(`Reference evidence: ${message}`); };
const hash = value => createHash('sha256').update(value).digest('hex');
function image(path) {
  if (!imageType.test(path)) fail(`unsupported image path ${path}`);
  if (!existsSync(path) || !statSync(path).isFile()) fail(`missing image file ${path}`);
  return {path: resolve(path), sha256: hash(readFileSync(path))};
}
export function readManifest(path) {
  path = resolve(path);
  let data;
  try { data = JSON.parse(readFileSync(path, 'utf8')); } catch (e) { fail(`cannot read manifest ${path}: ${e.message}`); }
  if (data?.version !== 1 || !Array.isArray(data.entries) || !data.entries.length) fail(`${path} requires version: 1 and a nonempty entries array`);
  const ids = new Set(), paths = new Set();
  return data.entries.map((entry, i) => {
    for (const field of ['id', 'path', 'role', 'source', 'observation', 'application', 'limitations']) {
      if (typeof entry?.[field] !== 'string' || !entry[field].trim()) fail(`entry ${i + 1}: ${field} must be a nonempty string`);
    }
    if (!['craft', 'mechanism'].includes(entry.role)) fail(`entry ${entry.id}: role must be craft or mechanism`);
    if (entry.state !== undefined && (typeof entry.state !== 'string' || !entry.state.trim())) fail(`entry ${entry.id}: state must be a nonempty string`);
    if (isAbsolute(entry.path)) fail(`entry ${entry.id}: path must be relative to the manifest directory`);
    const material = image(resolve(dirname(path), entry.path)), canonical = realpathSync(material.path);
    if (ids.has(entry.id) || paths.has(canonical)) fail(`duplicate id or image path at entry ${entry.id}`);
    ids.add(entry.id); paths.add(canonical);
    return {id: entry.id, ...material, role: entry.role, source: entry.source, observation: entry.observation,
      application: entry.application, limitations: entry.limitations, ...(entry.state ? {state: entry.state} : {})};
  });
}
export function selectEntries(entries, limit = 3) {
  const selected = new Set();
  for (const role of ['craft', 'mechanism']) { const entry = entries.find(e => e.role === role); if (entry) selected.add(entry); }
  for (const entry of entries) { if (selected.size >= limit) break; selected.add(entry); }
  return entries.filter(e => selected.has(e));
}
export function selectReferences({dir, refs, manifest, warn = console.warn}) {
  let entries, origin;
  if (refs !== undefined) {
    if (typeof refs !== 'string' || !refs.trim() || refs.startsWith('--')) fail('--refs requires comma-separated image paths');
    entries = refs.split(',').map((p, i) => ({id: `explicit-${i + 1}`, ...image(resolve(p.trim())), role: 'craft', source: 'explicit --refs',
      observation: 'Unannotated screenshot; only visible pixels are evidence.', application: 'Visual craft comparison only.', limitations: 'State, provenance, and behavior are unverified.'}));
    origin = 'explicit';
  } else {
    if (manifest !== undefined && (!manifest || manifest.startsWith('--'))) fail('--manifest requires a path');
    const path = resolve(manifest || join(dir, 'refs', 'manifest.json'));
    if (manifest !== undefined || existsSync(path)) { entries = selectEntries(readManifest(path)); origin = path; }
    else {
      warn('WARNING: no reference manifest; using legacy screenshot selection. Roles, states, and behavior are unverified. Write refs/manifest.json to hand off kept evidence.');
      const pick = folder => existsSync(folder) ? readdirSync(folder).sort().filter(p => imageType.test(p)).slice(0, 3).map(p => join(folder, p)) : [];
      let paths = pick(join(dir, 'research', 'bar')); if (!paths.length) paths = pick(join(dir, 'refs'));
      entries = paths.map((p, i) => ({id: `legacy-${i + 1}`, ...image(p), role: 'craft', source: 'legacy screenshot fallback',
        observation: 'Unannotated screenshot; only visible pixels are evidence.', application: 'Visual craft comparison only.', limitations: 'State, provenance, and behavior are unverified.'}));
      origin = 'legacy';
    }
  }
  return {version: 1, origin, entries};
}
export function evidenceDigest(evidence) { return hash(JSON.stringify(evidence)); }
export function readEvidence(path) {
  let evidence;
  try { evidence = JSON.parse(readFileSync(path, 'utf8')); } catch (e) { fail(`cannot read evidence ${path}: ${e.message}`); }
  if (evidence?.version !== 1 || !Array.isArray(evidence.entries)) fail('invalid selected evidence');
  for (const entry of evidence.entries) {
    if (!['craft', 'mechanism'].includes(entry.role) || !entry.id || !isAbsolute(entry.path || '')) fail('invalid selected evidence entry');
    if (image(entry.path).sha256 !== entry.sha256) fail(`image changed after selection: ${entry.path}`);
  }
  return evidence;
}
