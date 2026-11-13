#!/usr/bin/env node
// Seenry libraries: check npm packages before recommending or installing them.
//   node check.mjs sonner @number-flow/react motion [--json]
// Prints the latest version, its release date, license and weekly downloads, and flags a package
// with no release in 18 months or a license that is not a common permissive one. No packages. Node 18+.
const args = process.argv.slice(2), json = args.includes('--json'), names = args.filter(a => !a.startsWith('--'));
if (!names.length) { console.error('Usage: node check.mjs <package> [<package> …] [--json]'); process.exit(2); }
const PERMISSIVE = /^(MIT|ISC|Apache-2\.0|Apache 2\.0|BSD-2-Clause|BSD-3-Clause|0BSD|Unlicense|CC0-1\.0)$/i;

async function get(url) {
  try { const r = await fetch(url); return r.ok ? r.json() : null; }
  catch (e) { console.error(`Could not reach ${new URL(url).host} (${e.cause?.code || e.message}). Behind a proxy, run with NODE_USE_ENV_PROXY=1.`); process.exit(1); }
}

const rows = await Promise.all(names.map(async name => {
  const meta = await get(`https://registry.npmjs.org/${name.replace('/', '%2f')}`);
  if (!meta?.['dist-tags']) return {name, found: false};
  const version = meta['dist-tags'].latest, released = (meta.time?.[version] || '').slice(0, 10);
  const raw = meta.versions?.[version]?.license ?? meta.license, license = typeof raw === 'string' ? raw : raw?.type || 'unknown';
  const downloads = (await get(`https://api.npmjs.org/downloads/point/last-week/${name}`))?.downloads ?? null;
  const months = released ? (Date.now() - Date.parse(released)) / 2.63e9 : null, flags = [];
  if (meta.versions?.[version]?.deprecated) flags.push('deprecated');
  if (months != null && months > 18) flags.push(`no release in ${Math.round(months)} months`);
  if (!PERMISSIVE.test(license)) flags.push(`license "${license.slice(0, 40)}": read it before using`);
  return {name, found: true, version, released, license, downloads, flags};
}));

if (json) console.log(JSON.stringify(rows, null, 2));
else for (const r of rows) console.log(r.found ? `${r.name}  ${r.version}  ${r.released}  ${r.license.slice(0, 30)}  ${r.downloads == null ? '?' : r.downloads.toLocaleString('en')}/week${r.flags.length ? '  ⚠ ' + r.flags.join('; ') : ''}` : `${r.name}  not on npm`);
process.exitCode = rows.some(r => !r.found) ? 1 : 0;
