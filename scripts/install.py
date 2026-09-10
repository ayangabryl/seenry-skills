"""Install Seenry with shared agent links and an explicit, reversible legacy migration.
Default is a dry run. No network, credentials or MCP configuration changes.
"""
import argparse
import hashlib
import json
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NAMES = ('seenry', 'seenry-motion', 'seenry-assets', 'seenry-branding', 'seenry-decks')
AGENTS = ('agents', 'codex', 'claude', 'cursor', 'antigravity')
LEGACY = ('design-judgment', 'design-motion', 'design-assets', 'design-video',
          'web-atlas-usage', 'web-atlas-web-design', 'web-atlas-motion',
          'web-atlas-branding', 'web-atlas-decks', 'seenry-usage', 'seenry-web-design')

def exists(path):
    return path.exists() or path.is_symlink()

def link_signature(path):
    # Windows readlink may expose an extended-path prefix. Compare destinations,
    # not the platform-specific spelling; archive moves preserve the raw link.
    return {'link': os.path.normcase(os.path.realpath(path))}

def signature(path):
    if path.is_symlink():
        return link_signature(path)
    if not path.is_dir():
        raise ValueError(f'Expected a skill directory: {path}')
    digest = hashlib.sha256()
    for child in sorted(path.rglob('*')):
        rel = child.relative_to(path).as_posix()
        if '__pycache__' in child.relative_to(path).parts or child.name == '.DS_Store' or child.suffix in ('.pyc', '.pyo'):
            continue
        if child.is_symlink():
            data = b'link:' + os.fsencode(os.readlink(child))
        elif child.is_file():
            data = child.read_bytes()
        else:
            data = b'directory'
        digest.update(rel.encode() + b'\0' + data + b'\0')
    return {'sha256': digest.hexdigest()}

def remove(path):
    if path.is_symlink() or path.is_file():
        path.unlink()
    elif path.is_dir():
        shutil.rmtree(path)

def save(manifest, path):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)

def plan(home, source=ROOT, migrate=False, replace=False, link_mode='symlink'):
    home, source = Path(home).absolute(), Path(source).resolve()
    new, old = [], []
    for name in NAMES:
        origin = source / 'skills' / name
        if not (origin / 'SKILL.md').is_file():
            raise ValueError(f'Missing source skill: {origin}')
        canonical = home / '.agents/skills' / name
        for agent in AGENTS:
            target = home / f'.{agent}/skills' / name
            wanted = signature(origin) if agent == 'agents' or link_mode == 'copy' else link_signature(canonical)
            new.append({'path': str(target), 'source': str(origin), 'canonical': str(canonical),
                        'kind': 'copy' if agent == 'agents' or link_mode == 'copy' else 'symlink', 'signature': wanted})
    if migrate:
        for agent in AGENTS:
            for name in LEGACY:
                target = home / f'.{agent}/skills' / name
                if exists(target):
                    old.append({'path': str(target), 'backup': f'entries/{agent}/{name}'})
    unchanged = not old and all(exists(Path(x['path'])) and signature(Path(x['path'])) == x['signature'] for x in new)
    if not unchanged:
        for item in new:
            target = Path(item['path'])
            if exists(target):
                if not replace:
                    raise ValueError(f'Existing Seenry install at {target}; use --replace to archive and upgrade it.')
                old.append({'path': str(target), 'backup': f'entries/{target.parents[1].name[1:]}/{target.name}'})
    return {'schema': 1, 'home': str(home), 'source': str(source), 'link_mode': link_mode,
            'status': 'unchanged' if unchanged else 'planned', 'retired': migrate,
            'new': new, 'old': old, 'installed': [], 'moved': []}

def undo(manifest, folder, check_edits=True):
    # Preflight the whole rollback before deleting a single installed entry.
    if check_edits:
        for entry in manifest['installed']:
            path = Path(entry['path'])
            if not exists(path) or signature(path) != entry['signature']:
                raise ValueError(f'Rollback stopped: installed content changed at {path}. Preserve or move it first.')
        new_paths = {entry['path'] for entry in manifest['installed']}
        for entry in manifest['moved']:
            if not exists(folder / entry['backup']):
                raise ValueError(f'Missing archive: {entry["backup"]}')
            if entry['path'] not in new_paths and exists(Path(entry['path'])):
                raise ValueError(f'Rollback collision: {entry["path"]}')
    for entry in reversed(manifest['installed']):
        remove(Path(entry['path']))
    for entry in reversed(manifest['moved']):
        target, backup = Path(entry['path']), folder / entry['backup']
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(backup), str(target))
    manifest['status'] = 'rolled-back'
    save(manifest, folder / 'manifest.json')

def apply(manifest):
    if manifest['status'] == 'unchanged':
        return None
    folder = Path(manifest['home']) / '.local/share/seenry/migrations' / (
        datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8])
    folder.mkdir(parents=True)
    journal = folder / 'manifest.json'
    manifest['status'] = 'installing'
    save(manifest, journal)
    try:
        for entry in manifest['old']:
            backup = folder / entry['backup']
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(entry['path'], str(backup))
            manifest['moved'].append(entry)
            save(manifest, journal)
        for entry in manifest['new']:
            target = Path(entry['path'])
            target.parent.mkdir(parents=True, exist_ok=True)
            if exists(target):
                raise ValueError(f'Concurrent install collision: {target}')
            manifest['installed'].append(entry)
            if entry['kind'] == 'copy':
                shutil.copytree(entry['source'], target, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', '*.pyo', '.DS_Store'))
            else:
                target.symlink_to(entry['canonical'], target_is_directory=True)
            save(manifest, journal)
        for entry in manifest['new']:
            if signature(Path(entry['path'])) != entry['signature']:
                raise ValueError(f'Installed content differs: {entry["path"]}')
        manifest['status'] = 'installed'
        save(manifest, journal)
    except Exception:
        undo(manifest, folder, check_edits=False)
        raise
    return journal

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--home', type=Path, default=Path.home())
    parser.add_argument('--source', type=Path, default=ROOT)
    parser.add_argument('--migrate', action='store_true', help='Archive only the named legacy design/atlas skills.')
    parser.add_argument('--replace', action='store_true', help='Archive an existing Seenry install before upgrading.')
    parser.add_argument('--link-mode', choices=['symlink', 'copy'], default='symlink')
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--rollback', type=Path, help='Restore one trusted local migration manifest; no --apply needed.')
    args = parser.parse_args()
    try:
        if args.rollback:
            file = args.rollback.resolve()
            manifest = json.loads(file.read_text(encoding='utf-8'))
            if manifest['status'] != 'installed':
                raise ValueError('Only a completed install can be rolled back by this command.')
            undo(manifest, file.parent)
            print(json.dumps({'status': 'rolled-back', 'manifest': str(file)}))
            return
        result = plan(args.home, args.source, args.migrate, args.replace, args.link_mode)
        if args.apply:
            manifest = apply(result)
            print(json.dumps({'status': result['status'], 'manifest': str(manifest) if manifest else None}, indent=2))
        else:
            print(json.dumps({'status': result['status'], 'install': [x['path'] for x in result['new']],
                              'archive': [x['path'] for x in result['old']], 'link_mode': args.link_mode}, indent=2))
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(1, str(exc) + '\n')

if __name__ == '__main__':
    main()
